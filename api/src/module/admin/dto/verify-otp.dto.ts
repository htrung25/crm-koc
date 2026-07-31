import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsNotEmpty,
  Length,
  Matches,
} from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({ example: 'admin@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '384921' })
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: 'otp must be 6 digits' })
  otp!: string;
}

export class ResendOtpDto {
  @ApiProperty({ example: 'admin@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}

export class LoginPendingResponseDto {
  @ApiProperty({ example: true })
  requireOtp!: boolean;

  @ApiProperty({ example: 'OTP has been sent to your email' })
  message!: string;
}
