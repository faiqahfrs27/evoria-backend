import { IsNotEmpty, IsNumber, IsString } from "class-validator";
import { Type } from "class-transformer";

export class TicketTypeDTO {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  price!: number;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  quota!: number;
}