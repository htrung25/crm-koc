import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * Tham số cho DELETE /admin/:id/ip-whitelist.
 *
 * `entry` đi bằng query chứ không phải path param: CIDR chứa dấu '/', nhét vào
 * đường dẫn sẽ bị router cắt thành hai đoạn.
 */
export class RemoveIpWhitelistDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: '10.0.0.0/24',
    description:
      'IP hoặc CIDR cần xoá. So khớp sau khi chuẩn hoá nên gửi 10.0.0.5/24 cũng xoá được 10.0.0.0/24.',
  })
  entry!: string;

  // Transform vì query string luôn là 'true'/'false' dạng chuỗi
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @ApiPropertyOptional({
    type: Boolean,
    default: false,
    description:
      'Chấp nhận mất quyền truy cập khi xoá chính dải đang cho mình đi qua.',
  })
  acknowledgeSelfLockout?: boolean;
}
