import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EAccountStatus } from '../../../common/enum/account-statuses.enum';

export class UpdateAdminDto {
  @ApiProperty({ maxLength: 255 })
  name!: string;

  @ApiProperty({ format: 'email' })
  email!: string;

  @ApiProperty({ nullable: true, type: String })
  phone!: string | null;

  @ApiProperty({ enum: EAccountStatus, enumName: 'EAccountStatus' })
  status!: EAccountStatus;

  @ApiProperty({ nullable: true, type: String })
  statusReason!: string | null;

  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  emailVerifiedAt!: Date | null;

  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  phoneVerifiedAt!: Date | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: Date;

  @IsOptional()
  @IsString()
  // Cột là text không giới hạn; chặn ở đây để một chuỗi khổng lồ không thành
  // hàng nghìn lần dựng Netmask trên mỗi request đi qua guard.
  @MaxLength(2000)
  @ApiPropertyOptional({
    example: '203.0.113.1,10.0.0.0/24',
    maxLength: 2000,
    description:
      'CSV các IP/CIDR. Ghi đè toàn bộ. Chuỗi rỗng = cho phép mọi IP.',
  })
  ipWhitelist?: string;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({
    example: false,
    default: false,
    description:
      'Bỏ qua kiểm tra tự khoá khi tự sửa whitelist của mình. Dùng có ý thức.',
  })
  acknowledgeSelfLockout?: boolean;
}
