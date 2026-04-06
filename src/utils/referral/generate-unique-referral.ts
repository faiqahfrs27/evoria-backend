import { PrismaClient } from "../../generated/prisma/client.js";
import { generateReferralCode } from "./generate-referral-code.js";

export const generateUniqueReferral = async (prisma: PrismaClient, name: string): Promise<string> => {
  let code: string = "";
  let isExist = true;

  while (isExist) {
    code = generateReferralCode(name);

    const existing = await prisma.user.findUnique({
      where: { referralCode: code },
    });

    if (!existing) isExist = false;
  }

  return code;
};