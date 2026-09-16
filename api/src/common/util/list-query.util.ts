import { BadRequestException } from '@nestjs/common';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { PaginationDto } from '../dto/pagination.dto';
import { resolvePagination } from './pagination.util';

/** Validate direct service calls as well as requests already passed through a pipe. */
export function validateListQuery<T extends PaginationDto>(
  dto: ClassConstructor<T>,
  query: T,
): T {
  if (!query || typeof query !== 'object' || Array.isArray(query)) {
    throw new BadRequestException('invalid list filters');
  }
  // Query parameters have no null representation; do not let IsOptional hide it.
  if (Object.values(query).some((value) => value === null)) {
    throw new BadRequestException('list filters must not be null');
  }
  const filters = plainToInstance(dto, query);
  // Prevent class-transformer's numeric coercion from accepting booleans/empty strings.
  for (const [key, value] of Object.entries(query)) {
    if (
      typeof Reflect.get(filters, key) === 'number' &&
      (typeof value === 'boolean' ||
        (typeof value === 'string' && !value.trim()))
    ) {
      throw new BadRequestException(`${key} must be a number`);
    }
  }
  const errors = validateSync(filters, {
    whitelist: true,
    forbidNonWhitelisted: true,
    forbidUnknownValues: true,
    validationError: { target: false, value: false },
  });
  if (errors.length) {
    throw new BadRequestException(
      errors.flatMap((error) => Object.values(error.constraints ?? {})),
    );
  }
  const { skip } = resolvePagination(filters);
  if (!Number.isSafeInteger(skip)) {
    throw new BadRequestException('pagination offset is too large');
  }
  return filters;
}

/** Alias and column keys must be server-owned mappings, never the raw query. */
export function applyEqualityFilters<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  alias: string,
  filters: Record<string, unknown>,
): void {
  for (const [field, value] of Object.entries(filters)) {
    if (value !== undefined) {
      qb.andWhere(`${alias}.${field} = :${field}`, { [field]: value });
    }
  }
}

export interface CreatedAtRange {
  createdFrom?: string;
  createdTo?: string;
}

export function assertCreatedAtRange(query: CreatedAtRange): void {
  if (
    query.createdFrom &&
    query.createdTo &&
    new Date(query.createdFrom) > new Date(query.createdTo)
  ) {
    throw new BadRequestException('createdFrom must not be after createdTo');
  }
}

/** Preserve the existing inclusive end-day convention. */
export function applyCreatedAtRange<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  alias: string,
  query: CreatedAtRange,
): void {
  const to = query.createdTo ? new Date(query.createdTo) : undefined;
  to?.setDate(to.getDate() + 1);
  const bounds = {
    from: { operator: '>=', value: query.createdFrom },
    to: { operator: '<', value: to },
  };
  for (const [parameter, { operator, value }] of Object.entries(bounds)) {
    if (value !== undefined) {
      qb.andWhere(`${alias}.createdAt ${operator} :${parameter}`, {
        [parameter]: value,
      });
    }
  }
}
