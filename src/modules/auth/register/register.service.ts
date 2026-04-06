import { PrismaClient } from "../../../generated/prisma/client.js";
import { ApiError } from "../../../utils/api-error.js";
import { hashPassword } from "../../../utils/hash/hash-password.js";
import { generateUniqueReferral } from "../../../utils/referral/generate-unique-referral.js";

export class RegisterService{
    constructor(private prisma: PrismaClient){}

    register = async (data: {
        name: string;
        email: string;
        password: string;
        role: "USER" | "ORGANIZER";
        referralCode?: string;
    }) => {
        const {name, email, password, role, referralCode} = data;

        //cek apakah email sudah ada atau belum
        const existingUser = await this.prisma.user.findUnique({
            where: {email},
        });

        //kalau email sudah terdaftar maka throw error
        if (existingUser){
            throw new ApiError("Email is already registered!", 400);
        }

        //hashing password yg dipanggil dari function yg ada di file hash-password.ts 
        const hashed = await hashPassword(password);

        //generate referral code untuk user baru
        const newReferralCode = await generateUniqueReferral(this.prisma, name)

        let referredById: number | null = null;

        //cek kode referral user
        if (referralCode) {
    const refUser = await this.prisma.user.findUnique({
      where: { referralCode },
    });

    //throw error kl kode referral tidak valid
    if (!refUser) {
      throw new ApiError("Invalid referral code", 400);
    }

    referredById = refUser.id;
  }

        const user = await this.prisma.user.create({
            data: {
                name,
                email,
                password: hashed,
                role,
                referralCode: newReferralCode,
                referredById,
            },
        });





    }
}