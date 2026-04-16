import { hash } from "argon2";
import { PrismaClient, Role, User } from "../../../generated/prisma/client.js";
import { ApiError } from "../../../utils/api-error.js";
import { RegisterDTO } from "../dto/register.dto.js";
import { generateReferralCode } from "../../../utils/referral/generate-referral-code.js";
import { REFERRAL_EXPIRED_MONTH } from "../constants.js";

export class RegisterService {
  constructor(private prisma: PrismaClient) {}

  register = async (body: RegisterDTO) => {
    const user = await this.prisma.user.findUnique({
      where: {
        email: body.email,
      },
    });

    if (user) {
      throw new ApiError("Email is already registered!", 400);
    }

    //role default to customer
    const role: Role = body.role ?? Role.USER;

    let referrer: User | null = null;
    if (body.referralCode) {
      if (role != Role.USER) {
        throw new ApiError("Only customers can use a referral code!", 400);
      }

      referrer = await this.prisma.user.findUnique({
        where: { referralCode: body.referralCode },
      });

      if (!referrer) {
        throw new ApiError("Referral code not found!", 400);
      }

      if (referrer.role !== Role.USER) {
        throw new ApiError("Referral code not found!", 400);
      }

      if (referrer.email === body.email) {
        throw new ApiError("Can not use your own referral code!", 400);
      }
    }

    const hashedPassword = await hash(body.password);

    let referralCode: string;
    let isUnique = false;
    do {
      referralCode = generateReferralCode(body.name);
      const collision = await this.prisma.user.findUnique({
        where: { referralCode },
      });
      isUnique = !collision;
    } while (!isUnique);

    const now = new Date();
    const threeMonthsLater = new Date(now);
    threeMonthsLater.setMonth(
      threeMonthsLater.getMonth() + REFERRAL_EXPIRED_MONTH,
    );

    await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: body.name,
          email: body.email,
          password: hashedPassword,
          role,
          referralCode,
          ...(referrer && {referredById: referrer.id}),
        },
      });

      // Only run reward logic when a valid referral code was used
      if (referrer) {
        // New user gets a 10% discount coupon (platform-issued, any event)
        await tx.coupon.create({
          data: {
            userId: newUser.id,
            code: `WELCOME-${referralCode}`,
            discountPercent: 10,
            source: "REFERRAL_REWARD",
            eventId: null,           // null = valid for ALL events
            expiresAt: threeMonthsLater,
            isUsed: false,
          },
        });

         // Referrer gets 10,000 points (expires 3 months from now)
        await tx.point.create({
          data: {
            userId: referrer.id,
            amount: 10_000,
            source: `Referral: ${newUser.name}`,
            expiresAt: threeMonthsLater,
            isExpired: false,
          },
        });
      }
    });

    return {
      message: "register success",
    };
  };
}
