import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class BankAccountDto {
  @IsString()
  @IsOptional()
  accountId: string;

  @IsString()
  @IsOptional()
  bankCode: string;

  @IsString()
  bankNumber: string;

  @IsString()
  bankName: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
