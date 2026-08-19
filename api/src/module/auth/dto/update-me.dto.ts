import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { ERole } from '../../../common/enum/roles.enum';
import { RegisterResponseDto } from './auth.dto';

export const SELF_ASSIGNABLE_ROLES = [ERole.BRAND, ERole.CREATOR] as const;

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @ApiPropertyOptional({ example: 'John Doe', maxLength: 255 })
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @ApiPropertyOptional({
    nullable: true,
    type: String,
    example: '+84901111111',
  })
  phone?: string | null;

  @IsOptional()
  @IsIn(SELF_ASSIGNABLE_ROLES as readonly string[], {
    message: `accountRole must be one of: ${SELF_ASSIGNABLE_ROLES.join(', ')}`,
  })
  @ApiPropertyOptional({
    enum: SELF_ASSIGNABLE_ROLES,
    description:
      'Vai trò đang hoạt động. Đổi qua lại được; hồ sơ của vai trò cũ giữ nguyên.',
  })
  accountRole?: (typeof SELF_ASSIGNABLE_ROLES)[number];
}

export class UpdateMeResponseDto {
  @ApiProperty({ type: RegisterResponseDto })
  account: RegisterResponseDto;

  /**
   * Chỉ khác null khi vai trò vừa đổi: token cũ mang vai trò cũ trong payload
   * nên phải thay. Sửa tên/điện thoại thì giữ nguyên phiên đang dùng.
   */
  @ApiProperty({ nullable: true, type: String })
  accessToken: string | null;

  @ApiProperty({ nullable: true, type: String })
  refreshToken: string | null;
}
