import { PrismaClient } from "../../../generated/prisma/client.js";
import { ApiError } from "../../../utils/api-error.js";
import { hashPassword } from "../../../utils/hash/hash-password.js";
import { generateUniqueReferral } from "../../../utils/referral/generate-unique-referral.js";

export class RegisterService {
  constructor(private prisma: PrismaClient) {}

  register = async (data: {
    name: string;
    email: string;
    password: string;
    role: "USER" | "ORGANIZER";
    referralCode?: string;
  }) => {
    const { name, email, password, role, referralCode } = data;

    //normalized semua email ke huruf kecil dan kode referral ke huruf besar semua
    const normalizedEmail = email.toLowerCase();
    const normalizedCode = referralCode?.toUpperCase();

    //cek apakah email sudah ada atau belum
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    //kalau email sudah terdaftar maka throw error
    if (existingUser) {
      throw new ApiError("Email is already registered!", 400);
    }

    //hashing password yg dipanggil dari function yg ada di file hash-password.ts
    const hashed = await hashPassword(password);

    //generate referral code untuk user baru
    const newReferralCode = await generateUniqueReferral(this.prisma, name);

    let referredById: string | null = null;

    //cek kode referral user
    if (normalizedCode) {
      const refUser = await this.prisma.user.findUnique({
        where: { referralCode: normalizedCode },
      });

      //throw error jika email atau password tidak diisi
      if (!email || !password) {
        throw new ApiError("Invalid input", 400);
      }

      //throw error kl kode referral tidak valid
      if (!refUser) {
        throw new ApiError("Invalid referral code", 400);
      }

      //prevent self-referral
      if (refUser.email === normalizedEmail) {
        throw new ApiError("Cannot use your own referral code", 400);
      }

      referredById = refUser.id;
    }

    const user = await this.prisma.user.create({
      data: {
        name: name.trim(), //biar tidak tersimpan dengan spasi
        email: normalizedEmail,
        password: hashed,
        role,
        referralCode: newReferralCode,
        referredById,
      },
    });

    const { password: _, ...safeUser } = user;
    return safeUser;
  };
}