import {
  IsDateString,
  IsNotEmpty,
  IsNumberString,
  IsString,
  MinLength,
} from "class-validator";

export class CreateVoucherDTO {
  @IsNotEmpty()
  @IsString()
  @MinLength(3, { message: "Code must be at least 3 characters" })
  code!: string;

  @IsNotEmpty()
  @IsNumberString()
  discountAmount!: string; 

  @IsNotEmpty()
  @IsDateString()
  startDate!: string;

  @IsNotEmpty()
  @IsDateString()
  endDate!: string;

  @IsNotEmpty()
  @IsNumberString()
  quota!: string;
}