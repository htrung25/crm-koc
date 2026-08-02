import { ApiProperty } from '@nestjs/swagger';
import { IsJWT, IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  // @IsJWT chỉ kiểm tra đúng 3 phần a.b.c — chữ ký và hạn do JwtAuthService lo.
  // Có nó thì chuỗi rác bị chặn ngay ở pipe, không phải đi tới tận Redis.
  @IsJWT()
  @ApiProperty({
    description: 'Refresh token nhận được khi đăng nhập',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken!: string;
}

export class TokenPairResponseDto {
  @ApiProperty({ description: 'Sống ngắn, dùng cho mọi request thường' })
  accessToken!: string;

  @ApiProperty({
    description:
      'Token mới; token cũ lập tức vô hiệu. Client PHẢI thay thế token đang giữ.',
  })
  refreshToken!: string;
}
