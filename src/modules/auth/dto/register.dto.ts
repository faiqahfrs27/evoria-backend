import { IsEmail, IsNotEmpty, IsString } from "class-validator";
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

  @IsNotEmpty()
  @IsString()
  role?: Role;

  @IsNotEmpty()
  @IsString()
  referralCode?: string;
}
