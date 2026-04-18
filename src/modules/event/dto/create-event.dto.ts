import {
  IsArray,
  IsBooleanString,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import { TicketTypeDTO } from "./ticket-type.dto.js";

export class CreateEventDTO {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsString()
  description!: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(["MUSIC", "SPORTS", "TECHNOLOGY", "FOOD", "ART", "EDUCATION", "OTHER"])
  category!: string;

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
