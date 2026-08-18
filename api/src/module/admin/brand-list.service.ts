import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ERole } from '../../common/enum/roles.enum';
import { EAccountStatus } from '../../common/enum/account-statuses.enum';
import {
  EAccountSortField,
  ESortOrder,
} from '../../common/enum/sort-fields.enum';
import {
  PaginatedResult,
  escapeLike,
  paginate,
} from '../../common/util/pagination.util';
import {
  assertEnum,
  assertNumericEnum,
} from '../../common/util/enum-assert.util';
import { AuthEntity } from '../auth/entities/auth.entity';
import { AccountCacheService } from '../../security/account-cache.service';
import { SessionService } from '../../security/session.service';
import { BrandFilterDto } from './dto/brand-filters.dto';

const BRAND_LIST_FIELDS = [
  'id',
  'name',
  'email',
  'phone',
  'accountRole',
  'status',
  'createdAt',
] as const;

/** Kiểu của một dòng trong danh sách: đúng bằng các cột đã select. */
export type BrandListItem = Pick<
  AuthEntity,
  (typeof BRAND_LIST_FIELDS)[number]
>;

@Injectable()
export class BrandListService {
  constructor(
    @InjectRepository(AuthEntity)
    private readonly authRepository: Repository<AuthEntity>,
    private readonly accountCache: AccountCacheService,
    private readonly sessionService: SessionService,
  ) {}

  /** Danh sách brand, phân trang + lọc. */
  async findAll(
    query: BrandFilterDto,
  ): Promise<PaginatedResult<BrandListItem>> {
    const qb = this.authRepository
      .createQueryBuilder('account')
      .select(BRAND_LIST_FIELDS.map((f) => `account.${f}`))
      .where('account.accountRole = :role', { role: ERole.BRAND });

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

    if (query.address?.trim()) {
      qb.leftJoin(
        'brand_profiles',
        'profile',
        'profile.account_id = account.id',
      );
      qb.andWhere('profile.address ILIKE :addr', {
        addr: `%${escapeLike(query.address.trim())}%`,
      });
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

  async remove(accountId: string): Promise<{ message: string }> {
    const account = await this.authRepository.findOneBy({ id: accountId });
    if (!account) {
      throw new NotFoundException('account not found');
    }
    // Chặn xoá nhầm vai trò khác qua endpoint này.
    if (account.accountRole !== ERole.BRAND) {
      throw new BadRequestException('account is not a brand');
    }

    await this.authRepository.delete(accountId);
    // Xoá phiên TRƯỚC: phiên chết thì JwtStrategy chặn ngay, không phụ thuộc
    // cache có xoá được hay không.
    await this.sessionService.deleteAllByAccount(accountId);
    await this.accountCache.invalidate(accountId);
    return { message: 'Delete Brand account success' };
  }
}
