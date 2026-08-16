import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

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
