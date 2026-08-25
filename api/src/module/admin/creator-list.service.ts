import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ERole } from '../../common/enum/roles.enum';
import { EAccountStatus } from '../../common/enum/account-statuses.enum';
import { ESortField, ESortOrder } from '../../common/enum/sort-fields.enum';
import {
  PaginatedResult,
  escapeLike,
  paginate,
} from '../../common/util/pagination.util';
import {
  assertEnum,
  assertNumericEnum,
} from '../../common/util/enum-assert.util';
import {
  CREATOR_LIST_FIELDS,
  CREATOR_DETAIL_COLUMNS,
} from './constants/user-list.constants';
import { AuthEntity } from '../auth/entities/auth.entity';
import { AccountCacheService } from '../../security/account-cache.service';
import { SessionService } from '../../security/session.service';
import { CreatorFilterDto } from './dto/creator-list.dto';
import {
  CreatorListItem,
  CreatorDetail,
} from './constants/user-list.constants';

@Injectable()
export class CreatorListService {
  constructor(
    @InjectRepository(AuthEntity)
    private readonly authRepository: Repository<AuthEntity>,
    private readonly accountCache: AccountCacheService,
    private readonly sessionService: SessionService,
  ) {}

  /** Danh sách creator, phân trang + lọc. */
  async findAll(
    query: CreatorFilterDto,
  ): Promise<PaginatedResult<CreatorListItem>> {
    const qb = this.authRepository
      .createQueryBuilder('account')
      .select(CREATOR_LIST_FIELDS.map((f) => `account.${f}`))
      .where('account.accountRole = :role', { role: ERole.CREATOR });

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
        'creator_profiles',
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
        ? ESortField.CREATED_AT
        : assertEnum(ESortField, query.sortBy, 'sortBy');
    const sortOrder =
      query.sortOrder === undefined
        ? ESortOrder.DESC
        : assertEnum(ESortOrder, query.sortOrder, 'sortOrder');

    qb.orderBy(`account.${sortBy}`, sortOrder);
    // khoá thứ tự bằng id để phân trang ổn định khi trùng giá trị sort
    qb.addOrderBy('account.id', ESortOrder.ASC);

    return paginate(qb, query);
  }

  /** Chi tiết một creator. 404 nếu không có, 400 nếu account không phải creator. */
  async findCreatorById(accountId: string): Promise<CreatorDetail> {
    const account = await this.authRepository.findOne({
      where: { id: accountId },
      select: CREATOR_DETAIL_COLUMNS,
    });
    if (!account) {
      throw new NotFoundException('account not found');
    }
    if (account.accountRole !== ERole.CREATOR) {
      throw new BadRequestException('account is not a creator');
    }
    return account;
  }

  async remove(accountId: string): Promise<{ message: string }> {
    const account = await this.authRepository.findOneBy({ id: accountId });
    if (!account) {
      throw new NotFoundException('account not found');
    }
    // Chặn xoá nhầm vai trò khác qua endpoint này.
    if (account.accountRole !== ERole.CREATOR) {
      throw new BadRequestException('account is not a creator');
    }

    await this.authRepository.delete(accountId);
    // Xoá phiên TRƯỚC: phiên chết thì JwtStrategy chặn ngay, không phụ thuộc
    // cache có xoá được hay không.
    await this.sessionService.deleteAllByAccount(accountId);
    await this.accountCache.invalidate(accountId);
    return { message: 'Delete Creator account success' };
  }
}
