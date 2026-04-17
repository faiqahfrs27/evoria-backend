import { IsOptional, IsString } from "class-validator";
import { PaginationQueryParams } from "../../pagination/pagination.dto.js";

export class GetVouchersDTO extends PaginationQueryParams {
  @IsOptional()
  @IsString()
  search?: string; 
}