import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  PASSWORD_REGEX,
  PASSWORD_REGEX_MESSAGE,
} from '../../../common/util/account.util';

/**
 * Lớp 1 của phòng thủ nhiều lớp: DTO chỉ khai báo đúng những field client
 * được phép gửi. KHÔNG có accountRole và status ở đây — /register là endpoint
 * công khai, để client tự chọn role là mở đường leo thang quyền.
 * Việc tạo admin phải đi qua endpoint riêng do admin gọi.
 */
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
  @MinLength(8)
  @Matches(PASSWORD_REGEX, { message: PASSWORD_REGEX_MESSAGE })
  @ApiProperty({ example: 'abc@12345', minLength: 8, format: 'password' })
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
}
