import { BadRequestException } from '@nestjs/common';

/** Enum số (status). Ép kiểu rồi chặn giá trị ngoài enum. */
export function assertNumericEnum<T extends Record<string, string | number>>(
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

/** Enum chuỗi (sortBy, sortOrder). */
export function assertEnum<T extends Record<string, string>>(
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
