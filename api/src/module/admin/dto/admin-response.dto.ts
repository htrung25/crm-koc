import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ERole } from '../../../common/enum/roles.enum';
import { EAccountStatus } from '../../../common/enum/account-statuses.enum';
import { EAdminRole } from '../enum/admin-roles.enum';

/** Một account admin trong danh sách. Không bao giờ chứa password. */
export class AdminResponseDto {
  @IsOptional()
  @IsUUID()
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @IsOptional()
  @IsEnum(ERole)
  @ApiProperty({ enum: ERole, enumName: 'ERole' })
  accountRole!: ERole;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @ApiProperty({ maxLength: 255 })
  name!: string;

  @IsOptional()
  @IsEmail()
  @ApiProperty({ format: 'email' })
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @ApiProperty({ nullable: true, type: String })
  phone!: string | null;

  @IsOptional()
  @IsEnum(EAccountStatus)
  @ApiProperty({ enum: EAccountStatus, enumName: 'EAccountStatus' })
  status!: EAccountStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @ApiProperty({ nullable: true, type: String })
  statusReason!: string | null;

  @IsOptional()
  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  emailVerifiedAt!: Date | null;

  @IsOptional()
  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  phoneVerifiedAt!: Date | null;

  @IsOptional()
  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @IsOptional()
  @ApiProperty({ format: 'date-time' })
  updatedAt!: Date;

  /**
   * CSV các IP/CIDR được phép, null nghĩa là KHÔNG giới hạn IP.
   * Client đọc field này sau khi PATCH để đồng bộ lại thay vì tin state cũ.
   */
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @ApiProperty({
    nullable: true,
    type: String,
    example: '203.0.113.1,10.0.0.0/24',
    description: 'null hoặc rỗng = cho phép truy cập từ mọi IP',
  })
  ipWhitelist!: string | null;

  @IsOptional()
  @IsEnum(EAdminRole)
  @ApiProperty({ enum: EAdminRole, enumName: 'EAdminRole' })
  adminRole!: EAdminRole;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({
    default: false,
    description: 'Accept a self-lockout when replacing your own IP whitelist',
  })
  acknowledgeSelfLockout?: boolean;
}

/** Bọc phân trang — khớp đúng PaginatedResult<T> mà paginate() trả về. */
export class AdminFilterResponseDto {
  @ApiProperty({ type: [AdminResponseDto] })
  data!: AdminResponseDto[];

  @ApiProperty({ example: 42, description: 'Total rows matching the filter' })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 3 })
  totalPages!: number;
}
