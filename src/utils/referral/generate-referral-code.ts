import { randomBytes } from "crypto";

export const generateReferralCode = (name: string) => {
  const prefix = name.trim().split(" ")[0].toUpperCase().slice(0, 6);
    const suffix = randomBytes(3).toString("hex").toUpperCase(); // ex: "A3F9B2"
    return `${prefix}-${suffix}`;
};