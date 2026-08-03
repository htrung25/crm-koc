import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

// @IsOptional() bỏ qua validate khi giá trị là undefined HOẶC null,
// nhờ đó vẫn gửi được null để xoá giá trị cũ.
//
// Không có address và gender: admin_users không có hai cột đó. Trước đây DTO
// dùng chung vẫn nhận chúng rồi bỏ qua im lặng — client tưởng đã lưu.
export class UpdateAdminProfileDto {
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
  @MaxLength(64)
  @ApiPropertyOptional({ example: 'Asia/Ho_Chi_Minh', maxLength: 64 })
  timezone?: string;
}
