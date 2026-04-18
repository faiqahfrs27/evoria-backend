import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumberString,
  IsUUID,
} from "class-validator";

export class CreateTransactionDTO {
  @IsNotEmpty()
  @IsUUID()
  eventId!: string;

  @IsOptional()
  @IsUUID()
  ticketTypeId?: string;

  @IsOptional()
  @IsUUID()
  voucherId?: string;

  @IsOptional()
  @IsNumberString()
  pointUsed?: string; // form-data kirim sebagai string

  @IsNotEmpty()
  @IsNumberString()
  quantity!: string;
}