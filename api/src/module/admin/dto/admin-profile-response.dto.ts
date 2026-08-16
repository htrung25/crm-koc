import { ApiProperty } from '@nestjs/swagger';
import { AdminUser } from '../entities/admin-user.entity';

/**
 * Hồ sơ admin nằm chung bảng admin_users với cấu hình bảo mật, nên KHÔNG trả
 * thẳng entity: `ipWhitelist` và `status` là kiểm soát truy cập, không phải
 * thông tin hồ sơ. Ánh xạ tường minh ở đây là chỗ chặn việc chúng lọt ra.
 */
export class AdminProfileResponseDto {
  @ApiProperty({ format: 'uuid', description: 'Same value as accounts.id' })
  accountId: string;

  @ApiProperty({ nullable: true, type: String, maxLength: 255 })
  name: string | null;

  @ApiProperty({ format: 'email' })
  email: string;

  @ApiProperty({ nullable: true, type: String })
  avatarUrl: string | null;

  @ApiProperty({ example: 'Asia/Ho_Chi_Minh' })
  timezone: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt: Date;

  static from(entity: AdminUser): AdminProfileResponseDto {
    return {
      accountId: entity.accountId,
      name: entity.name,
      email: entity.email,
      avatarUrl: entity.avatarUrl,
      timezone: entity.timezone,
      updatedAt: entity.updatedAt,
    };
  }
}
