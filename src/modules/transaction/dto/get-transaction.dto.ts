import { IsOptional, IsString } from "class-validator";
import { PaginationQueryParams } from "../../pagination/pagination.dto.js";

export class GetTransactionsDTO extends PaginationQueryParams {
  @IsOptional()
  @IsString()
  status?: string;
}