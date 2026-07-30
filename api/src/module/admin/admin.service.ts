import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EAccountRole } from '../../common/enum/account-roles.enum';
import { EAccountSortField } from '../../common/enum/sort-fields.enum';
import { EAccountStatus } from '../../common/enum/account-statuses.enum';
import { ESortOrder } from '../../common/enum/sort-fields.enum';
import {
  PaginatedResult,
  escapeLike,
  paginate,
} from '../../common/util/pagination.util';
import { AuthEntity } from '../auth/entities/auth.entity';
import { AdminFilters } from './dto/admin-filters.dto';

/** Kiểm tra giá trị có nằm trong enum không, để dùng lại cho cả 3 field. */
function assertEnum<T extends Record<string, string>>(
  enumType: T,
  value: unknown,
  field: string,
): T[keyof T] {
  const allowed = Object.values(enumType);
  if (!allowed.includes(value as string)) {
    throw new BadRequestException(
      `${field} must be one of: ${allowed.join(', ')}`,
    );
  }
  return value as T[keyof T];
}

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(AuthEntity)
    private readonly authRepository: Repository<AuthEntity>,
  ) {}

  async findAll(query: AdminFilters): Promise<PaginatedResult<AuthEntity>> {
    const qb = this.authRepository
      .createQueryBuilder('account')
      .where('account.accountRole = :role', { role: EAccountRole.ADMIN });

    if (query.search?.trim()) {
      qb.andWhere('(account.name ILIKE :s OR account.email ILIKE :s)', {
        s: `%${escapeLike(query.search.trim())}%`,
      });
    }

    if (query.status !== undefined) {
      const status = assertEnum(EAccountStatus, query.status, 'status');
      qb.andWhere('account.status = :status', { status });
    }

    // Bắt buộc whitelist: orderBy() nhận chuỗi raw nên input client đi thẳng
    // vào SQL. ValidationPipe đang tắt => không được dựa vào @IsEnum ở DTO.
    const sortBy =
      query.sortBy === undefined
        ? EAccountSortField.CREATED_AT
        : assertEnum(EAccountSortField, query.sortBy, 'sortBy');
    const sortOrder =
      query.sortOrder === undefined
        ? ESortOrder.DESC
        : assertEnum(ESortOrder, query.sortOrder, 'sortOrder');

    qb.orderBy(`account.${sortBy}`, sortOrder);
    // khoá thứ tự bằng id để phân trang ổn định khi nhiều dòng trùng giá trị sort
    qb.addOrderBy('account.id', ESortOrder.ASC);

    return paginate(qb, query);
  }
}
