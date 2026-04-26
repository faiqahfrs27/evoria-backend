import { PrismaClient } from "../../generated/prisma/client.js";
import { ApiError } from "../../utils/api-error.js";
import { CloudinaryService } from "../cloudinary/cloudinary.service.js";
import { ChangePasswordDTO, UpdateProfileDTO } from "./dto/profile.dto.js";
import { hash, verify } from "argon2";

export class ProfileService {
  constructor(
    private prisma: PrismaClient,
    private cloudinaryService: CloudinaryService,
  ) {}

  getProfile = async (userId: string) => {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profilePic: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new ApiError("User Not Found", 404);
    }

    const pointAggregate = await this.prisma.point.aggregate({
      where: {
        userId,
        isExpired: false,
        expiresAt: { gt: new Date() },
      },
      _sum: { amount: true },
    });

    return {
      ...user,
      pointBalance: pointAggregate._sum.amount ?? 0,
    };
  };

  updateProfile = async (userId: string, body: UpdateProfileDTO) => {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new ApiError("User Not Found", 404);
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { name: body.name },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profilePic: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  };

  updateProfilePic = async (
    userId: string,
    profilePic: Express.Multer.File,
  ) => {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new ApiError("user not found", 404);
    }

    if (user.profilePic) {
      await this.cloudinaryService.removeByUrl(user.profilePic);
    }

    const { secure_url } = (await this.cloudinaryService.upload(
      profilePic,
    )) as { secure_url: string };

    return this.prisma.user.update({
      where: { id: userId },
      data: { profilePic: secure_url },
      select: { id: true, profilePic: true },
    });
  };

  changePassword = async (userId: string, body: ChangePasswordDTO) => {
    if (body.newPassword !== body.confirmNewPassword) {
      throw new ApiError("New password don't match", 400);
    }

    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new ApiError("User not found", 404);
    }

    const isPassMatch = await verify(user.password, body.currentPassword);

    if (!isPassMatch) {
      throw new ApiError("Current password is incorrect", 400);
    }

    const hashedPassword = await hash(body.newPassword);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  };

  getMyPoints = async (userId: string) => {
    return this.prisma.point.findMany({
      where: { userId, isExpired: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });
  };

  getMyVouchers = async (userId: string) => {
    return this.prisma.coupon.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  };
  getMyTransactions = async (userId: string) => {
    return this.prisma.transaction.findMany({
      where: { customerId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            slug: true,
            imageUrl: true,
            startDate: true,
            endDate: true,
            location: true,
          },
        },
        ticketType: true,
        voucher: true,
      },
    });
  };
}
