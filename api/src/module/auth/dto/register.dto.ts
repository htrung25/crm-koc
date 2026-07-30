import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { EAccountRole } from '../../../common/enum/account-roles.enum';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @ApiProperty({ example: 'Huu Trung', maxLength: 255 })
  name!: string;

  @IsEmail()
  @MaxLength(255)
  @ApiProperty({ example: 'admin@gmail.com', format: 'email' })
  email!: string;

  @IsString()
  @MinLength(6)
  @ApiProperty({ example: 'abc@123', minLength: 6, format: 'password' })
  password!: string;

  // Định dạng số do normalizePhone() kiểm tra, ở đây chỉ chặn kiểu và độ dài
  @IsOptional()
  @IsString()
  @MaxLength(20)
  @ApiPropertyOptional({
    example: '0900000001',
    maxLength: 20,
    description:
      'Vietnamese number. Accepts 0xxxxxxxxx / 84xxxxxxxxx / +84xxxxxxxxx and is normalized to E.164 (+84xxxxxxxxx) before saving.',
  })
  phone?: string;

  @IsOptional()
  @IsEnum(EAccountRole, {
    message: 'accountRole must be admin, brand or creator',
  })
  @ApiPropertyOptional({
    enum: EAccountRole,
    enumName: 'EAccountRole',
    default: EAccountRole.ADMIN,
  })
  accountRole?: EAccountRole;
}
