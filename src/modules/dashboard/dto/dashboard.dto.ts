import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";

export enum StatsPeriod {
  DAY = "day",
  MONTH = "month",
  YEAR = "year",
}

export class GetStatisticsDTO {
  @IsNotEmpty()
  @IsEnum(StatsPeriod, { message: "period must be day, month, or year" })
  period!: StatsPeriod;

  @IsOptional()
  @IsString()
  year?: string;

  @IsOptional()
  @IsString()
  month?: string;
}