import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUrl,
  MinLength,
  MaxLength,
  Matches,
} from "class-validator";

export class UpdateProfileDTO {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;
}

export class ChangePasswordDTO {
  @IsNotEmpty()
  @IsString()
  currentPassword!: string;
 
  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: "New password must be at least 8 characters" })
  @Matches(/^(?=.*[A-Z])(?=.*[0-9])/, {
    message:
      "New password must contain at least one uppercase letter and one number",
  })
  newPassword!: string;
 
  @IsNotEmpty()
  @IsString()
  confirmNewPassword!: string;
}