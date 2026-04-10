import { PrismaClient } from "../../../generated/prisma/client.js";
import { ApiError } from "../../../utils/api-error.js";
import { comparePassword } from "../../../utils/hash/compare-password.js";

export class LoginService {
  constructor(private prisma: PrismaClient) {}

  login = async(data: {
    email: string;
    password: string;
  }) => {
    const { email, password} = data;

    //1. nyari user
    const user = await this.prisma.user.findFirst({
        where: {
            email,
            deletedAt: null, //soft delete
        },
    });

    //2. throw error kalau password atau email tidak sesuai
    if(!user){
        throw new ApiError("Invalid Email or Password", 401);
    }

    const isValid = await comparePassword(password, user.password);

    if(!isValid){
        throw new ApiError("Invalid Email or Password", 401);
    }

    //3. return safe user
    const {password: _, ...safeUser} = user;

    return safeUser;

  }
}
