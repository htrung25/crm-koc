import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { EAccountStatus } from '../../../common/enum/account-statuses.enum';

/**
 * Body của PATCH /admin/:id — sửa một tài khoản admin.
 *
 * MỌI FIELD BẮT BUỘC PHẢI CÓ DECORATOR VALIDATOR. ValidationPipe chạy với
 * `whitelist` + `forbidNonWhitelisted` (main.ts), và target là ES2023 nên
 * `useDefineForClassFields` bật: một field khai trong class VẪN tồn tại trên
 * instance với giá trị `undefined` sau `plainToInstance`, kể cả khi client
 * không gửi nó. Field không có validator sẽ bị coi là property lạ và làm MỌI
 * request bị từ chối 400 "property X should not exist" — dù body hợp lệ.
 *
 * Ngữ nghĩa PATCH: `undefined` (không gửi field) = giữ nguyên; `null` = chủ
 * động xoá giá trị. Riêng `ipWhitelist` là GHI ĐÈ toàn bộ chuỗi CSV, chuỗi
 * rỗng = cho phép mọi IP (không phải chặn hết).
 */
export class UpdateAdminDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @ApiPropertyOptional({ maxLength: 255 })
  name?: string;

  @IsOptional()
  @IsEmail()
  @ApiPropertyOptional({
    format: 'email',
    description:
      'Ràng buộc UNIQUE nằm ở accounts.email; trùng sẽ trả 409. Giá trị được trim + lowercase trước khi ghi.',
  })
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @ApiPropertyOptional({ nullable: true, type: String, maxLength: 20 })
  phone?: string | null;

  @IsOptional()
  @IsEnum(EAccountStatus, {
    message:
      'status must be 1 (pending), 2 (active), 3 (suspended) or 4 (banned)',
  })
  @ApiPropertyOptional({ enum: EAccountStatus, enumName: 'EAccountStatus' })
  status?: EAccountStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @ApiPropertyOptional({
    nullable: true,
    type: String,
    example: 'Spamming campaigns',
    description: 'Shown to the account owner when they are blocked',
  })
  statusReason?: string | null;

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
