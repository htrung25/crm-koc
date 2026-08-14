import { Injectable } from '@nestjs/common';
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
import { CreatorFilterDto } from './dto/creator-filters.dto';

const CREATOR_LIST_FIELDS = [
  'id',
  'name',
  'email',
  'phone',
  'accountRole',
  'status',
  'createdAt',
] as const;

/** Kiểu của một dòng trong danh sách: đúng bằng các cột đã select. */
export type CreatorListItem = Pick<
  AuthEntity,
  (typeof CREATOR_LIST_FIELDS)[number]
>;

@Injectable()
export class CreatorListService {
  constructor(
    @InjectRepository(AuthEntity)
    private readonly authRepository: Repository<AuthEntity>,
  ) {}

  /** Danh sách creator, phân trang + lọc. */
  findAll(query: CreatorFilterDto): Promise<PaginatedResult<CreatorListItem>> {
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
}
