import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { Role } from "../../../generated/prisma/enums.js";

export class RegisterDTO {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @IsString()
  password!: string;

  @IsOptional()
  @IsString()
  role?: Role;

  @IsOptional()
  @IsString()
  referralCode?: string;
}
