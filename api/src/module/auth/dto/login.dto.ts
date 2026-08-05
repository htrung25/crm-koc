import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';
import { MaxLength, MinLength, Matches } from 'class-validator';
import {
  PASSWORD_REGEX,
  PASSWORD_REGEX_MESSAGE,
} from '../../../common/util/account.util';

// Lưu ý: route /login đi qua LocalAuthGuard trước ValidationPipe (guards chạy
// trước pipes) nên các decorator dưới đây chỉ có giá trị mô tả, không chặn
// được request sai. Body sai định dạng sẽ nhận 401 từ passport, không phải 400.

export class LoginDto {
  @IsEmail()
  @MaxLength(255)
  @ApiProperty({ example: 'test@gmail.com', format: 'email' })
  email!: string;

  @IsString()
  @MinLength(8)
  @Matches(PASSWORD_REGEX, { message: PASSWORD_REGEX_MESSAGE })
  @ApiProperty({ example: 'test@12345', minLength: 8, format: 'password' })
  password!: string;
}

export class LoginAdminDto {
  @IsEmail()
  @MaxLength(255)
  @ApiProperty({ example: 'admin@gmail.com', format: 'email' })
  email!: string;

  @IsString()
  @MinLength(8)
  @Matches(PASSWORD_REGEX, { message: PASSWORD_REGEX_MESSAGE })
  @ApiProperty({ example: 'abc@12345', minLength: 8, format: 'password' })
  password!: string;
}
