import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsNotEmpty,
  Length,
  Matches,
} from 'class-validator';

export class AuthVerifyOtpDto {
  @ApiProperty({ example: 'user@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: 'otp must be 6 digits' })
  otp: string;
}

export class AuthResendOtpDto {
  @ApiProperty({ example: 'user@gmail.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class AuthLoginPendingResponseDto {
  @ApiProperty({ example: true })
  requireOtp: boolean;

  @ApiProperty({ example: 'OTP has been sent to your email' })
  message: string;
}
