import { IsOptional, IsString, IsIn } from "class-validator";
import { PaginationQueryParams } from "../../pagination/pagination.dto.js";

export class GetEventDTO extends PaginationQueryParams {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  @IsIn(["MUSIC", "SPORTS", "FOOD", "ART", "EDUCATION", "OTHER"])
  category?: string;

  @IsOptional()
  @IsString()
  location?: string;
}