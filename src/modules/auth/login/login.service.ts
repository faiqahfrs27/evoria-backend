import { verify } from "argon2";
import { PrismaClient, User } from "../../../generated/prisma/client.js";
import { ApiError } from "../../../utils/api-error.js";

export class LoginService {
  constructor(private prisma: PrismaClient) {}

  login = async(body: User) => {
    const user = await this.prisma.user.findUnique({
        where: {
            email: body.email,
            deletedAt: null, //soft delete
        },
    });

    //2. throw error kalau password atau email tidak sesuai
    if(!user){
        throw new ApiError("Invalid Credentials", 400);
    }

    const isPassMatch = await verify(user.password, body.password);

    if(!isPassMatch){
        throw new ApiError("Invalid Email or Password", 401);
    }

    //3. return safe user
    const {password: _, ...safeUser} = user;

    return safeUser;

  }
}
