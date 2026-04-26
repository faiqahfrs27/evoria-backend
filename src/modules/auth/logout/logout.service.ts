import { PrismaClient } from "../../../generated/prisma/client.js";

export class LogoutService {
  constructor(private prisma: PrismaClient) {}

  logout = async (refreshToken?: string) => {
    if (!refreshToken) return;

    await this.prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });

    return { message: "Logout success" };
  };
}
