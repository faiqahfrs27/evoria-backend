import {
  IsBooleanString,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
} from "class-validator";
import { EventCategory } from "../../../generated/prisma/enums.js";

export class CreateEventDTO {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsString()
  description!: string;

  @IsNotEmpty()
  @IsString()
  @IsEnum(EventCategory, { message: "Invalid category" })
  category!: EventCategory;

  @IsNotEmpty()
  @IsString()
  location!: string;

  @IsNotEmpty()
  @IsDateString()
  startDate!: string;

  @IsNotEmpty()
  @IsDateString()
  endDate!: string;

  @IsNotEmpty()
  @IsBooleanString()
  isFree!: string;

  @IsOptional()
  @IsNumberString()
  price?: string;

  @IsNotEmpty()
  @IsNumberString()
  availableSeats!: string;

  @IsNotEmpty()
  @IsNumberString()
  totalSeats!: string;
}
