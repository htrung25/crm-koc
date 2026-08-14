import { QueryFailedError } from 'typeorm';

export const PG_UNIQUE_VIOLATION = '23505';

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
