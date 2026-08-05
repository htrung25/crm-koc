import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateAdminDto {
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
