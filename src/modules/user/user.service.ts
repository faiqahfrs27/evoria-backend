import { PrismaClient, UserRole } from "../../generated/prisma/client.js";
import { ApiError } from "../../utils/api-error.js";

type CreateUserBody = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

export class UserService {
  constructor(private prisma: PrismaClient) {}

  createUser = async (body: CreateUserBody) => {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: body.email },
    });

    if (existingUser) {
      throw new ApiError("Email already exists", 400);
    }

    const user = await this.prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: body.password,
        role: body.role,
      },
    });

    return user;
  };

  getUsers = async () => {
    const users = await this.prisma.user.findMany({
      orderBy: {
        id: "asc",
      },
    });

    return users;
  };

  getUserById = async (id: number) => {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new ApiError("User not found", 404);
    }

    return user;
  };
}