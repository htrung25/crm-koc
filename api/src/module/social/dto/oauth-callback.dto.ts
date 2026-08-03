import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SocialOAuthCallbackDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  @ApiProperty({ description: 'Authorization code do nền tảng trả về' })
  code!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @ApiProperty({ description: 'Giá trị state của lần chuyển hướng đi' })
  state!: string;
}
