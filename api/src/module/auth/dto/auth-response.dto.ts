import { ApiProperty } from '@nestjs/swagger';
import { ERole } from '../../../common/enum/roles.enum';
import { EAccountStatus } from '../../../common/enum/account-statuses.enum';

/** Account tóm tắt kèm theo token khi login — không bao giờ chứa password. */
export class AuthResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'email' })
  email: string;

  @ApiProperty({ maxLength: 255 })
  name: string;

  @ApiProperty({ enum: ERole, enumName: 'ERole' })
  accountRole: ERole;

  @ApiProperty({ enum: EAccountStatus, enumName: 'EAccountStatus' })
  status: EAccountStatus;
}

/** Account đầy đủ trả về sau khi register. */
export class RegisterResponseDto extends AuthResponseDto {
  // name đã có ở AuthResponseDto, khai lại sẽ đè base property

  @ApiProperty({ nullable: true, type: String })
  phone: string | null;

  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  emailVerifiedAt: Date | null;

  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  phoneVerifiedAt: Date | null;

  @ApiProperty({ nullable: true, type: String })
  statusReason: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt: Date;
}

export class LoginResponseDto {
  @ApiProperty({ description: 'Sống ngắn (15 phút), dùng cho request thường' })
  accessToken: string;

  @ApiProperty({
    description:
      'Dùng để lấy cặp token mới qua POST /refresh. Xoay vòng mỗi lần dùng.',
  })
  refreshToken: string;

  @ApiProperty({ type: AuthResponseDto })
  account: AuthResponseDto;
}
