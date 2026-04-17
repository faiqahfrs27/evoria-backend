import { Transform } from "class-transformer";
import { IsNumber, IsOptional, IsString } from "class-validator";

export class PaginationQueryParams {
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  take: number = 5; 

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  page: number = 1;

  @IsOptional()
  @IsString()
  sortBy: string = "startDate"; 

  @IsOptional()
  @IsString()
  sortOrder: string = "asc"; 
}