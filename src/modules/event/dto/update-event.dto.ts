// dto/update-event.dto.ts
import { IsDateString, IsEnum, IsNumberString, IsOptional, IsString, IsBooleanString } from "class-validator";
import { EventCategory } from "../../../generated/prisma/client.js"; 

export class UpdateEventDTO {
  @IsOptional() @IsString()
  name?: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(EventCategory, { message: "Invalid category" }) 
  category?: EventCategory;

  @IsOptional() @IsString()
  location?: string;

  @IsOptional() @IsDateString()
  startDate?: string;

  @IsOptional() @IsDateString()
  endDate?: string;

  @IsOptional() @IsBooleanString()
  isFree?: string;

  @IsOptional() @IsNumberString()
  price?: string;

  @IsOptional() @IsNumberString()
  availableSeats?: string;

  @IsOptional() @IsNumberString()
  totalSeats?: string;
}