import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { GendersEnum } from '../../../common/enum/genders.enum';

// @IsOptional() bỏ qua validate khi giá trị là undefined HOẶC null,
// nhờ đó vẫn gửi được null để xoá giá trị cũ.
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @ApiPropertyOptional({ example: 'John Doe', maxLength: 255 })
  name?: string | null;

  @IsOptional()
  @IsEmail()
  @ApiPropertyOptional({ example: 'admin@gmail.com', format: 'email' })
  email?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'https://cdn.example.com/a.png' })
  avatarUrl?: string | null;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    example: '12 Nguyen Hue St, District 1, Ho Chi Minh City',
  })
  address?: string | null;

  @IsOptional()
  @IsEnum(GendersEnum, { message: 'gender must be 1, 2 or 3' })
  @ApiPropertyOptional({
    example: 1,
    description: '1 = male, 2 = female, 3 = other',
  })
  gender?: GendersEnum;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  @ApiPropertyOptional({ example: 'Asia/Ho_Chi_Minh', maxLength: 64 })
  timezone?: string;
}
