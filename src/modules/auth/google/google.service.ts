import axios from "axios";
import jwt from "jsonwebtoken";
import { PrismaClient } from "../../../generated/prisma/client.js";
import { GoogleUserInfo } from "../../../types/google.js";
import { GoogleDTO } from "../dto/google.dto.js";
import {
  EXPIRED_7_DAY,
  EXPIRED_ACCESS_TOKEN_JWT,
  EXPIRED_REFRESH_TOKEN_JWT,
} from "../constants.js";
import { ApiError } from "../../../utils/api-error.js";

export class GoogleService {
  constructor(private prisma: PrismaClient) {}

  google = async (body: GoogleDTO) => {
    const response = await axios.get<GoogleUserInfo>(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${body.accessToken}`,
        },
      },
    );

    let user = await this.prisma.user.findUnique({
      where: { email: response.data.email },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          name: response.data.name,
          email: response.data.email,
          password: "",
          profilePic: response.data.picture,
          provider: "GOOGLE",
        },
      });
    }

    if (user?.provider !== "GOOGLE") {
      throw new ApiError("Account already registered without google", 400);
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

    const { password, ...userWithoutPassword } = user; // remove property password

    return { user: userWithoutPassword, accessToken, refreshToken };
  };
}
