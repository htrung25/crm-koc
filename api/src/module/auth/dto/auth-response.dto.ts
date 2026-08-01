import { ApiProperty } from '@nestjs/swagger';
import { ERole } from '../../../common/enum/roles.enum';
import { EAccountStatus } from '../../../common/enum/account-statuses.enum';

/** Account tóm tắt kèm theo token khi login — không bao giờ chứa password. */
export class AuthResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'email' })
  email!: string;

  @ApiProperty({ enum: ERole, enumName: 'ERole' })
  accountRole!: ERole;

  @ApiProperty({ enum: EAccountStatus, enumName: 'EAccountStatus' })
  status!: EAccountStatus;
}

/** Account đầy đủ trả về sau khi register. */
export class RegisterResponseDto extends AuthResponseDto {
  @ApiProperty({ maxLength: 255 })
  name!: string;

  @ApiProperty({ nullable: true, type: String })
  phone!: string | null;

  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  emailVerifiedAt!: Date | null;

  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  phoneVerifiedAt!: Date | null;

  @ApiProperty({ nullable: true, type: String })
  statusReason!: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: Date;
}

export class LoginResponseDto {
  @ApiProperty({ description: 'JWT bearer token' })
  access_token!: string;

  @ApiProperty({ type: AuthResponseDto })
  account!: AuthResponseDto;
}
