import { ApiProperty } from '@nestjs/swagger';
import { ERole } from '../../../common/enum/roles.enum';
import { EAccountStatus } from '../../../common/enum/account-statuses.enum';
import { EAdminRole } from '../enum/admin-roles.enum';

/** Một account admin trong danh sách. Không bao giờ chứa password. */
export class AdminResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: ERole, enumName: 'ERole' })
  accountRole!: ERole;

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

  /**
   * CSV các IP/CIDR được phép, null nghĩa là KHÔNG giới hạn IP.
   * Client đọc field này sau khi PATCH để đồng bộ lại thay vì tin state cũ.
   */
  @ApiProperty({
    nullable: true,
    type: String,
    example: '203.0.113.1,10.0.0.0/24',
    description: 'null hoặc rỗng = cho phép truy cập từ mọi IP',
  })
  ipWhitelist!: string | null;

  @ApiProperty({ enum: EAdminRole, enumName: 'EAdminRole' })
  adminRole!: EAdminRole;
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
