import { hash } from "argon2";
import { PrismaClient, User } from "../../../generated/prisma/client.js";
import { ApiError } from "../../../utils/api-error.js";

export class RegisterService {
  constructor(private prisma: PrismaClient) {}

  register = async (body: User) => {
    const user = await this.prisma.user.findUnique({
      where: {
        email: body.email,
      },
    });

    if (user) {
      throw new ApiError("Email is already registered!", 400);
    }

    const hashedPassword = await hash(body.password);

    await this.prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: hashedPassword,
      },
    });

    return {
      message: "register success",
    }
  };
}