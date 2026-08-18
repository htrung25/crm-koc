import { ApiProperty } from '@nestjs/swagger';
import { ERole } from '../../../common/enum/roles.enum';
import { EAccountStatus } from '../../../common/enum/account-statuses.enum';

export class AccountFilterItemDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ maxLength: 255 })
  name: string;

  @ApiProperty({ format: 'email' })
  email: string;

  @ApiProperty({ nullable: true, type: String, example: '+84901111111' })
  phone: string | null;

  @ApiProperty({ enum: ERole, enumName: 'ERole' })
  accountRole: ERole;

  @ApiProperty({ enum: EAccountStatus, enumName: 'EAccountStatus' })
  status: EAccountStatus;

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;
}

/** Bọc phân trang — khớp PaginatedResult<T> mà paginate() trả về. */
export class AccountFilterResponseDto {
  @ApiProperty({ type: [AccountFilterItemDto] })
  data: AccountFilterItemDto[];

  @ApiProperty({ example: 3, description: 'Total rows matching the filter' })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 1 })
  totalPages: number;
}
