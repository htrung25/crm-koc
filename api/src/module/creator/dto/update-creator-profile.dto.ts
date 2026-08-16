import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';
import { GendersEnum } from '../../../common/enum/genders.enum';
import { ECreatorContent } from '../../../common/enum/creator-content.enum';

// @IsOptional() bỏ qua validate khi giá trị là undefined HOẶC null,
// nhờ đó vẫn gửi được null để xoá giá trị cũ.
export class UpdateCreatorProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @ApiPropertyOptional({ example: 'Chau Bui', maxLength: 255 })
  displayName?: string | null;

  @IsOptional()
  @IsEmail()
  @ApiPropertyOptional({ example: 'creator@gmail.com', format: 'email' })
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @ApiPropertyOptional({ example: '+84900000003', maxLength: 20 })
  phone?: string | null;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'KOC linh vuc lam dep va thoi trang' })
  bio?: string | null;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'https://cdn.example.com/a.png' })
  avatarUrl?: string | null;

  // Cột date của Postgres, driver trả về chuỗi 'YYYY-MM-DD' chứ không phải Date
  @IsOptional()
  @IsDateString({ strict: true })
  @ApiPropertyOptional({ example: '1998-04-21', format: 'date' })
  dateOfBirth?: string | null;

  @IsOptional()
  @IsEnum(GendersEnum, { message: 'gender must be 1, 2 or 3' })
  @ApiPropertyOptional({
    example: 1,
    description: '1 = male, 2 = female, 3 = other',
  })
  gender?: GendersEnum;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  @ApiPropertyOptional({ example: 'Ho Chi Minh City', maxLength: 128 })
  city?: string | null;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    example: '12 Nguyen Hue St, District 1, Ho Chi Minh City',
  })
  address?: string | null;

  // Chặn trên số phần tử: cột là text[] không giới hạn, gửi vài nghìn phần tử
  // sẽ làm phình index GIN.
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsEnum(ECreatorContent, { each: true })
  @ApiPropertyOptional({
    enum: ECreatorContent,
    enumName: 'ECreatorContent',
    isArray: true,
    example: [ECreatorContent.BEAUTY, ECreatorContent.FASHION],
    maxItems: 20,
  })
  contentCategories?: ECreatorContent[];

  @IsOptional()
  @IsUrl()
  @ApiPropertyOptional({ example: 'https://portfolio.example.com' })
  portfolioUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  @ApiPropertyOptional({ example: 'Asia/Ho_Chi_Minh', maxLength: 64 })
  timezone?: string;
}
