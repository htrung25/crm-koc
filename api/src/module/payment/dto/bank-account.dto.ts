import { PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class BankAccountDto {
  @IsString()
  @IsOptional()
  bankCode: string;

  @IsString()
  bankNumber: string;

  @IsString()
  bankName: string;

  @IsString()
  accountHolderName: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}

export class UpdateBankAccountDto extends PartialType(BankAccountDto) {}
