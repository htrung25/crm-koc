import { QueryFailedError } from 'typeorm';

export const PG_UNIQUE_VIOLATION = '23505';

/**
 * Tên ràng buộc duy nhất vừa bị vi phạm, hoặc null nếu lỗi không phải 23505.
 *
 * Bảng có nhiều hơn một ràng buộc duy nhất thì chỉ nhìn mã 23505 là không đủ:
 * brand_profiles có UQ_brand_profiles_tax_code còn accounts có
 * UQ_accounts_email, cả hai cùng nổi lên qua một chỗ bắt lỗi. Driver pg có kèm
 * tên constraint trong lỗi — đã kiểm chứng trên DB thật.
 *
 * Trả chuỗi rỗng khi driver không kèm tên: vẫn là unique violation, chỉ không
 * biết của ràng buộc nào, nên chỗ gọi phải có nhánh mặc định.
 */
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
