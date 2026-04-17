import { hash } from "argon2";
import { PrismaClient, Role, User } from "../../../generated/prisma/client.js";
import { ApiError } from "../../../utils/api-error.js";
import { generateReferralCode } from "../../../utils/referral/generate-referral-code.js";
import { MailService } from "../../mail/mail.service.js";
import {
  DISCOUNT_REFERRAL,
  REFERRAL_EXPIRED_MONTH,
  REFERRAL_POINT,
} from "../constants.js";
import { RegisterDTO } from "../dto/register.dto.js";

export class RegisterService {
  constructor(
    private prisma: PrismaClient,
    private mailService: MailService,
  ) {}

  register = async (body: RegisterDTO) => {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: body.email },
    });

    if (existingUser) {
      throw new ApiError("Email is already registered!", 400);
    }

    const role: Role = body.role ?? Role.USER;

    let referrer: User | null = null;
    if (body.referralCode) {
      if (role !== Role.USER) {
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
        throw new ApiError("Cannot use your own referral code!", 400);
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
    threeMonthsLater.setMonth(now.getMonth() + REFERRAL_EXPIRED_MONTH);

    const result = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: body.name,
          email: body.email,
          password: hashedPassword,
          role,
          referralCode,
          ...(referrer && { referredById: referrer.id }),
        },
      });

      if (referrer) {
        await tx.coupon.create({
          data: {
            userId: newUser.id,
            code: `WELCOME-${referralCode}`,
            discountPercent: DISCOUNT_REFERRAL,
            source: "REFERRAL_REWARD",
            eventId: null,
            expiresAt: threeMonthsLater,
            isUsed: false,
          },
        });

        try{
          await tx.point.create({
            data: {
              userId: referrer.id,
              amount: REFERRAL_POINT,
              source: `Referral: ${newUser.name}`,
              expiresAt: threeMonthsLater,
              isExpired: false,
            },
          });
          console.log("POINT CREATED")
        } catch(err){
          console.error("POINT ERROR", err)
        }

        await tx.referralUsage.create({
          data: {
            referrerId: referrer.id,
            referredUserId: newUser.id,
          },
        });
      }

      return { newUser, referrer };
    });

    await this.mailService.sendMail({
      to: result.newUser.email,
      subject: "Your Welcome Coupon 🎁",
      templateName: "welcomeCoupon",
      context: {
        name: result.newUser.name,
        code: `WELCOME-${referralCode}`,
        discount: DISCOUNT_REFERRAL,
        expiresAt: threeMonthsLater.toDateString(),
      },
    });

    if (result.referrer) {
      await this.mailService.sendMail({
        to: result.referrer.email,
        subject: "You Got a Referral Reward 🎉",
        templateName: "referralReward",
        context: {
          name: result.referrer.name,
          points: REFERRAL_POINT,
          referredUser: result.newUser.name,
          expiresAt: threeMonthsLater.toDateString(),
        },
      });
    }

    return { message: "Register success" };
  };
}
