import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';
import { PASSWORD_REGEX, PASSWORD_REGEX_MESSAGE } from '../util/account.util';

export class ChangePasswordDto {
  @IsString()
  @ApiProperty({ description: 'Mật khẩu hiện tại, dùng để xác thực lại' })
  oldPassword: string;

  @IsString()
  @Matches(PASSWORD_REGEX, { message: PASSWORD_REGEX_MESSAGE })
  @ApiProperty({ example: 'Abc@12345' })
  newPassword: string;
}
