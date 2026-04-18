import { verify } from "argon2";
import { PrismaClient, User } from "../../../generated/prisma/client.js";
import { ApiError } from "../../../utils/api-error.js";
import jwt from "jsonwebtoken";
import {
  EXPIRED_7_DAY,
  EXPIRED_ACCESS_TOKEN_JWT,
  EXPIRED_REFRESH_TOKEN_JWT,
} from "../constants.js";
import { LoginDTO } from "../dto/login.dto.js";

export class LoginService {
  constructor(private prisma: PrismaClient) {}

  login = async (body: LoginDTO) => {
    const user = await this.prisma.user.findFirst({
      where: {
        email: body.email,
        deletedAt: null, //soft delete
      },
    });

    //2. throw error kalau password atau email tidak sesuai
    if (!user) {
      throw new ApiError("Invalid Credentials", 400);
    }

    const isPassMatch = await verify(user.password, body.password);

    if (!isPassMatch) {
      throw new ApiError("Invalid Email or Password", 401);
    }

    const payload = { id: user.id, role: user.role };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: EXPIRED_ACCESS_TOKEN_JWT,
    });

    const refreshToken = jwt.sign(payload, process.env.JWT_SECRET_REFRESH!, {
      expiresIn: EXPIRED_REFRESH_TOKEN_JWT,
    });

    await this.prisma.refreshToken.upsert({
      where: { userId: user.id },
      update: {
        token: refreshToken,
        expiredAt: EXPIRED_7_DAY,
      },
      create: {
        token: refreshToken,
        expiredAt: EXPIRED_7_DAY,
        userId: user.id,
      },
    });

    const { password, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, accessToken, refreshToken };
  };
}
