import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

// Lưu ý: route /login đi qua LocalAuthGuard trước ValidationPipe (guards chạy
// trước pipes) nên các decorator dưới đây chỉ có giá trị mô tả, không chặn
// được request sai. Body sai định dạng sẽ nhận 401 từ passport, không phải 400.
export class LoginDto {
  @IsEmail()
  @ApiProperty({ example: 'admin@gmail.com', format: 'email' })
  email!: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'abc@123', format: 'password' })
  password!: string;
}
