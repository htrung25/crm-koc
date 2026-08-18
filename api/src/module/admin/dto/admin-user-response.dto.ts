import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { ERole } from '../../../common/enum/roles.enum';
import { EAccountStatus } from '../../../common/enum/account-statuses.enum';
import { ESortField, ESortOrder } from '../../../common/enum/sort-fields.enum';
import { EAdminRole } from '../enum/admin-roles.enum';

/** Query string của GET /admin/admin-list. page/limit kế thừa từ PaginationDto. */
export class AdminFilters extends PaginationDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @ApiPropertyOptional({
    description: 'Search by name or email, case-insensitive',
  })
  search?: string;

  @IsOptional()
  // query string luôn là chuỗi: '2' phải thành 2 thì @IsEnum mới pass
  @Type(() => Number)
  @IsEnum(EAccountStatus, {
    message:
      'status must be 1 (pending), 2 (active), 3 (suspended) or 4 (banned)',
  })
  @ApiPropertyOptional({
    enum: EAccountStatus,
    enumName: 'EAccountStatus',
    description: 'Filter by account status',
  })
  status?: EAccountStatus;

  @IsOptional()
  @IsEnum(ESortField, {
    message: 'sortBy must be createdAt, updatedAt, name, email or status',
  })
  @ApiPropertyOptional({
    enum: ESortField,
    enumName: 'ESortField',
    default: ESortField.CREATED_AT,
  })
  sortBy?: ESortField;

  @IsOptional()
  @IsEnum(ESortOrder, { message: 'sortOrder must be ASC or DESC' })
  @ApiPropertyOptional({
    enum: ESortOrder,
    enumName: 'ESortOrder',
    default: ESortOrder.DESC,
  })
  sortOrder?: ESortOrder;
}

export class AdminUserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ enum: ERole, enumName: 'ERole' })
  accountRole: ERole;

  @ApiProperty({ maxLength: 255 })
  name: string;

  @ApiProperty({ format: 'email' })
  email: string;

  @ApiProperty({ nullable: true, type: String })
  phone: string | null;

  @ApiProperty({ enum: EAccountStatus, enumName: 'EAccountStatus' })
  status: EAccountStatus;

  @ApiProperty({ nullable: true, type: String })
  statusReason: string | null;

  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  emailVerifiedAt: Date | null;

  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  phoneVerifiedAt: Date | null;

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt: Date;

  /** null hoặc rỗng = KHÔNG giới hạn IP, không phải chặn hết. */
  @ApiProperty({
    nullable: true,
    type: String,
    example: '203.0.113.1,10.0.0.0/24',
    description: 'null hoặc rỗng = cho phép truy cập từ mọi IP',
  })
  ipWhitelist: string | null;

  /** FE dùng field này để render trình soạn thảo hay chế độ chỉ-đọc. */
  @ApiProperty({ enum: EAdminRole, enumName: 'EAdminRole' })
  adminRole: EAdminRole;
}
