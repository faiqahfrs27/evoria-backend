import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class GoogleDTO {

  @IsNotEmpty()
  @IsEmail()
  accessToken!: string;
}
