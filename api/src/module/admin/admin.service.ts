import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ERole } from '../../common/enum/roles.enum';
import { EAccountSortField } from '../../common/enum/sort-fields.enum';
import { EAccountStatus } from '../../common/enum/account-statuses.enum';
import { ESortOrder } from '../../common/enum/sort-fields.enum';
import {
  PaginatedResult,
  escapeLike,
  paginate,
} from '../../common/util/pagination.util';
import { AccountCacheService } from '../../security/account-cache.service';
import { AuthEntity } from '../auth/entities/auth.entity';
import { AuthenticatedAccount } from '../auth/entities/authenticated.entity';
import { AccountFilterDto } from './dto/account-filters.dto';
import { AdminFilters } from './dto/admin-filters.dto';
import { BrandFilterDto } from './dto/brand-filters.dto';
import { CreatorFilterDto } from './dto/creator-filters.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

const ACCOUNT_LIST_FIELDS = [
  'id',
  'name',
  'email',
  'phone',
  'accountRole',
  'status',
  'createdAt',
] as const;

/** Kiểu của một dòng trong danh sách: đúng bằng các cột đã select. */
export type AccountListItem = Pick<
  AuthEntity,
  (typeof ACCOUNT_LIST_FIELDS)[number]
>;

/**
 * Dành cho enum SỐ (EAccountStatus).
 *
 * Không dùng chung assertEnum được: với enum số, Object.values() trả về CẢ
 * tên lẫn giá trị (['PENDING', ..., 1, 2, 3, 4]) do TypeScript sinh reverse
 * mapping. Ngoài ra status từ query string là chuỗi '2' nên phải Number().
 */
function assertNumericEnum<T extends Record<string, string | number>>(
  enumType: T,
  value: unknown,
  field: string,
): T[keyof T] {
  const allowed = Object.values(enumType).filter(
    (v): v is number => typeof v === 'number',
  );
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || !allowed.includes(parsed)) {
    throw new BadRequestException(
      `${field} must be one of: ${allowed.join(', ')}`,
    );
  }
  return parsed as T[keyof T];
}

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
    private readonly accountCache: AccountCacheService,
  ) {}

  async findAll(query: AdminFilters): Promise<PaginatedResult<AuthEntity>> {
    const qb = this.authRepository
      .createQueryBuilder('account')
      .where('account.accountRole = :role', { role: ERole.ADMIN });

    if (query.search?.trim()) {
      qb.andWhere('(account.name ILIKE :s OR account.email ILIKE :s)', {
        s: `%${escapeLike(query.search.trim())}%`,
      });
    }

    if (query.status !== undefined) {
      const status = assertNumericEnum(EAccountStatus, query.status, 'status');
      qb.andWhere('account.status = :status', { status });
    }

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

  /** Danh sách brand, phân trang + lọc. */
  findAllBrands(
    query: BrandFilterDto,
  ): Promise<PaginatedResult<AccountListItem>> {
    return this.listByRole(ERole.BRAND, query);
  }

  /** Danh sách creator, phân trang + lọc. */
  findAllCreators(
    query: CreatorFilterDto,
  ): Promise<PaginatedResult<AccountListItem>> {
    return this.listByRole(ERole.CREATOR, query);
  }

  private listByRole(
    role: ERole,
    // hợp của 2 DTO con: field riêng của bên nào cũng optional nên nhánh
    // tương ứng chỉ chạy khi client thực sự gửi
    query: AccountFilterDto & Partial<BrandFilterDto & CreatorFilterDto>,
  ): Promise<PaginatedResult<AccountListItem>> {
    const qb = this.authRepository
      .createQueryBuilder('account')
      .select(ACCOUNT_LIST_FIELDS.map((f) => `account.${f}`))
      .where('account.accountRole = :role', { role });

    if (query.search?.trim()) {
      qb.andWhere('(account.name ILIKE :s OR account.email ILIKE :s)', {
        s: `%${escapeLike(query.search.trim())}%`,
      });
    }

    if (query.status !== undefined) {
      qb.andWhere('account.status = :status', {
        status: assertNumericEnum(EAccountStatus, query.status, 'status'),
      });
    }

    if (query.emailVerified !== undefined) {
      qb.andWhere(
        // @Transform trong AccountFilterDto đã đổi 'true'/'false' thành boolean
        query.emailVerified
          ? 'account.emailVerifiedAt IS NOT NULL'
          : 'account.emailVerifiedAt IS NULL',
      );
    }

    if (query.createdFrom) {
      qb.andWhere('account.createdAt >= :from', { from: query.createdFrom });
    }
    if (query.createdTo) {
      const to = new Date(query.createdTo);
      to.setDate(to.getDate() + 1);
      qb.andWhere('account.createdAt < :to', { to });
    }
    if (query.address?.trim() || query.gender !== undefined) {
      qb.leftJoin(
        'account_profiles',
        'profile',
        'profile.account_id = account.id',
      );

      if (query.address?.trim()) {
        qb.andWhere('profile.address ILIKE :addr', {
          addr: `%${escapeLike(query.address.trim())}%`,
        });
      }

      if (query.gender !== undefined) {
        // @Type(() => Number) + @IsEnum(GendersEnum) trong CreatorFilterDto
        // đã ép kiểu và chặn giá trị ngoài 1/2/3
        qb.andWhere('profile.gender = :gender', { gender: query.gender });
      }
    }

    // orderBy ghép chuỗi raw vào SQL => bắt buộc whitelist, không tin input
    const sortBy =
      query.sortBy === undefined
        ? EAccountSortField.CREATED_AT
        : assertEnum(EAccountSortField, query.sortBy, 'sortBy');
    const sortOrder =
      query.sortOrder === undefined
        ? ESortOrder.DESC
        : assertEnum(ESortOrder, query.sortOrder, 'sortOrder');

    qb.orderBy(`account.${sortBy}`, sortOrder);
    // khoá thứ tự bằng id để phân trang ổn định khi trùng giá trị sort
    qb.addOrderBy('account.id', ESortOrder.ASC);

    return paginate(qb, query);
  }

  async updateStatus(
    id: string,
    dto: UpdateStatusDto,
  ): Promise<AuthenticatedAccount> {
    const account = await this.authRepository.findOneBy({ id });
    if (!account) {
      throw new NotFoundException('account not found');
    }

    account.status = assertNumericEnum(EAccountStatus, dto.status, 'status');
    if (dto.statusReason !== undefined) {
      account.statusReason = dto.statusReason;
    }

    const saved = await this.authRepository.save(account);
    await this.accountCache.invalidate(id);

    const { password: _password, ...result } = saved;
    return result;
  }
}
