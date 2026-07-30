import { SelectQueryBuilder, ObjectLiteral } from 'typeorm';
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  MAX_LIMIT,
  PaginationDto,
} from '../dto/pagination.dto';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function resolvePagination(pagination: PaginationDto = {}) {
  const rawPage = Number(pagination.page);
  const rawLimit = Number(pagination.limit);

  const page =
    Number.isFinite(rawPage) && rawPage >= 1
      ? Math.floor(rawPage)
      : DEFAULT_PAGE;
  const limit =
    Number.isFinite(rawLimit) && rawLimit >= 1
      ? Math.min(Math.floor(rawLimit), MAX_LIMIT)
      : DEFAULT_LIMIT;

  return { page, limit, skip: (page - 1) * limit };
}

export async function paginate<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  pagination: PaginationDto = {},
): Promise<PaginatedResult<T>> {
  const { page, limit, skip } = resolvePagination(pagination);

  const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();

  return {
    data,
    total,
    page,
    limit,
    totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
  };
}

/** Escape %, _ và \ để chuỗi tìm kiếm được hiểu theo nghĩa đen trong ILIKE. */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}
