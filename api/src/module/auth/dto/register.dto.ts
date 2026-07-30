import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EAccountRole } from 'src/common/enum/account-roles.enum';

export class RegisterDto {
  @ApiProperty({ example: 'admin01@test.com', format: 'email' })
  email!: string;

  @ApiProperty({ example: 'abc@123', minLength: 6, format: 'password' })
  password!: string;

  @ApiPropertyOptional({ example: '0900000001', maxLength: 10 })
  phone!: string;

  @ApiPropertyOptional({
    enum: EAccountRole,
    enumName: 'EAccountRole',
    default: EAccountRole.ADMIN,
  })
  accountRole!: EAccountRole;
}
