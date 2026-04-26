import { hash } from "argon2";
import { PrismaClient } from "../../../generated/prisma/client.js";
import { ApiError } from "../../../utils/api-error.js";
import { ResetPasswordDTO } from "../dto/reset-password.dto.js";
import jwt from "jsonwebtoken";

export class ResetPasswordService {
  constructor(private prisma: PrismaClient) {}

  resetPassword = async (token: string, body: ResetPasswordDTO) => {
    const { newPassword, confirmNewPassword } = body;

    // validasi password
    if (newPassword !== confirmNewPassword) {
      throw new ApiError("Password does not match", 400);
    }

    // verify JWT
    let payload: { id: string };
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET_RESET!) as {
        id: string;
      };
    } catch {
      throw new ApiError("Invalid or expired token", 400);
    }

    // cek token di DB
    const storedToken = await this.prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!storedToken || storedToken.expiredAt < new Date()) {
      throw new ApiError("Invalid or expired token", 400);
    }

    // hash password
    const hashedPassword = await hash(newPassword);

    // update password
    await this.prisma.user.update({
      where: { id: payload.id },
      data: { password: hashedPassword },
    });

    // delete token(s)
    await this.prisma.passwordResetToken.deleteMany({
      where: { userId: payload.id },
    });

    return { message: "Password updated successfully" };
  };
}
