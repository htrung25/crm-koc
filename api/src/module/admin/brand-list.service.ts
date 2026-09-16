import {
  validateListQuery,
  assertCreatedAtRange,
} from '../../common/util/list-query.util';
import { applyAccountListFilters } from './util/account-list.util';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ERole } from '../../common/enum/roles.enum';
import { ESortField, ESortOrder } from '../../common/enum/sort-fields.enum';
import {
  PaginatedResult,
  escapeLike,
  paginate,
} from '../../common/util/pagination.util';
import {
  BRAND_LIST_FIELDS,
  BRAND_DETAIL_COLUMNS,
} from './constants/user-list.constants';
import { AuthEntity } from '../auth/entities/auth.entity';
import { AccountCacheService } from '../../security/account-cache.service';
import { SessionService } from '../../security/session.service';
import { BrandFilterDto } from './dto/brand-list.dto';
import { BrandListItem, BrandDetail } from './constants/user-list.constants';

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
    query = validateListQuery(BrandFilterDto, query);
    assertCreatedAtRange(query);
    const sortBy =
      query.sortBy === undefined ? ESortField.CREATED_AT : query.sortBy;
    const sortOrder =
      query.sortOrder === undefined ? ESortOrder.DESC : query.sortOrder;

    const qb = this.authRepository
      .createQueryBuilder('account')
      .select(BRAND_LIST_FIELDS.map((f) => `account.${f}`))
      .where('account.accountRole = :role', { role: ERole.BRAND });

    applyAccountListFilters(qb, query);

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

    qb.orderBy(`account.${sortBy}`, sortOrder);
    // khoá thứ tự bằng id để phân trang ổn định khi trùng giá trị sort
    qb.addOrderBy('account.id', ESortOrder.ASC);

    return paginate(qb, query);
  }

  /** Chi tiết một brand. 404 nếu không có, 400 nếu account không phải brand. */
  async findBrandById(accountId: string): Promise<BrandDetail> {
    const account = await this.authRepository.findOne({
      where: { id: accountId },
      select: BRAND_DETAIL_COLUMNS,
    });
    if (!account) {
      throw new NotFoundException('account not found');
    }
    if (account.accountRole !== ERole.BRAND) {
      throw new BadRequestException('account is not a brand');
    }
    return account;
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
