import { SelectQueryBuilder } from 'typeorm';
import { AuthEntity } from '../../auth/entities/auth.entity';
import { AccountFilterDto } from '../dto/account-filters.dto';
import { escapeLike } from '../../../common/util/pagination.util';
import {
  applyCreatedAtRange,
  applyEqualityFilters,
} from '../../../common/util/list-query.util';

/** Shared account predicates; callers retain their role scope and profile joins. */
export function applyAccountListFilters(
  qb: SelectQueryBuilder<AuthEntity>,
  query: AccountFilterDto,
): void {
  const search = query.search?.trim();
  if (search) {
    qb.andWhere('(account.name ILIKE :s OR account.email ILIKE :s)', {
      s: `%${escapeLike(search)}%`,
    });
  }
  applyEqualityFilters(qb, 'account', { status: query.status });
  if (query.emailVerified !== undefined) {
    qb.andWhere(
      query.emailVerified
        ? 'account.emailVerifiedAt IS NOT NULL'
        : 'account.emailVerifiedAt IS NULL',
    );
  }
  applyCreatedAtRange(qb, 'account', query);
}
