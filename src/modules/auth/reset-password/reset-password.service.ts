import { hash } from "argon2";
import { PrismaClient } from "../../../generated/prisma/client.js";
import { ApiError } from "../../../utils/api-error.js";
import { ResetPasswordDTO } from "../dto/reset-password.dto.js";
import jwt from "jsonwebtoken";

export class ResetPasswordService {
  constructor(private prisma: PrismaClient) {}

  resetPassword = async (body: ResetPasswordDTO) => {
    const { token, password } = body;

    // 1. verify JWT token
    let payload: any;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET_RESET!);
    } catch (err) {
      throw new ApiError("Token invalid", 400);
    }

    // 2. cek token di db
    const storedToken = await this.prisma.passwordResetToken.findFirst({
      where: { token },
    });

    if (!storedToken) {
      throw new ApiError("Invalid token", 400);
    }

    if (storedToken.expiredAt < new Date()) {
      throw new ApiError("Token expired", 400);
    }

    // 3. cari user dari payload
    const user = await this.prisma.user.findUnique({
      where: { id: payload.id },
    });

    if (!user) {
      throw new ApiError("user not found", 400);
    }

    // 4. hash password baru
    const hashedPassword = await hash(password);

    // 5. update password
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // 6. hapus token setelah dipakai (optional tapi penting)
    await this.prisma.passwordResetToken.delete({
      where: { id: storedToken.id },
    });

    return { message: "reset password success" };
  };
}
