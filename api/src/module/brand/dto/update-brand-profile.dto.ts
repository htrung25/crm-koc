import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
} from 'class-validator';

/** MST Việt Nam: 10 số, hoặc 13 ký tự dạng chi nhánh 0123456789-001. */
const TAX_CODE_REGEX = /^\d{10}(-\d{3})?$/;

// @IsOptional() bỏ qua validate khi giá trị là undefined HOẶC null,
// nhờ đó vẫn gửi được null để xoá giá trị cũ.
export class UpdateBrandProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @ApiPropertyOptional({ example: 'Cocoon', maxLength: 255 })
  brandName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @ApiPropertyOptional({
    example: 'Cong ty TNHH My pham Cocoon Viet Nam',
    maxLength: 255,
  })
  companyName?: string | null;

  @IsOptional()
  @Matches(TAX_CODE_REGEX, {
    message: 'taxCode must be 10 digits, optionally followed by -NNN',
  })
  @ApiPropertyOptional({ example: '0123456789', maxLength: 14 })
  taxCode?: string | null;

  @IsOptional()
  @IsEmail()
  @ApiPropertyOptional({ example: 'contact@cocoon.vn', format: 'email' })
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @ApiPropertyOptional({ example: '+84900000001', maxLength: 20 })
  phone?: string | null;

  @IsOptional()
  @IsUrl()
  @ApiPropertyOptional({ example: 'https://cocoon.vn' })
  website?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  @ApiPropertyOptional({ example: 'beauty', maxLength: 64 })
  industry?: string | null;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'https://cdn.example.com/logo.png' })
  logoUrl?: string | null;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Thuong hieu my pham thuan chay' })
  description?: string | null;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    example: '12 Nguyen Hue St, District 1, Ho Chi Minh City',
  })
  address?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @ApiPropertyOptional({ example: 'Nguyen Van A', maxLength: 255 })
  contactName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @ApiPropertyOptional({ example: '+84900000002', maxLength: 20 })
  contactPhone?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  @ApiPropertyOptional({ example: 'Asia/Ho_Chi_Minh', maxLength: 64 })
  timezone?: string;
}
