import { QueryFailedError } from 'typeorm';

export const PG_UNIQUE_VIOLATION = '23505';
export const PG_FOREIGN_KEY_VIOLATION = '23503';
/** Postgres dùng mã RIÊNG cho ON DELETE RESTRICT, không phải 23503. */
export const PG_RESTRICT_VIOLATION = '23001';

export function uniqueViolationOf(error: unknown): string | null {
  if (!(error instanceof QueryFailedError)) {
    return null;
  }

  const driverError = error as QueryFailedError & {
    code?: string;
    constraint?: string;
  };

  if (driverError.code !== PG_UNIQUE_VIOLATION) {
    return null;
  }

  return driverError.constraint ?? '';
}

/** True khi xoá/sửa bị chặn vì còn bản ghi tham chiếu (cả RESTRICT lẫn FK). */
export function isForeignKeyViolation(error: unknown): boolean {
  if (!(error instanceof QueryFailedError)) return false;
  const code = (error as QueryFailedError & { code?: string }).code;
  return code === PG_FOREIGN_KEY_VIOLATION || code === PG_RESTRICT_VIOLATION;
}
