import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@gmail.com', format: 'email' })
  email!: string;

  @ApiProperty({ example: 'abc@123', format: 'password' })
  password!: string;
}
