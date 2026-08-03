import { QueryFailedError } from 'typeorm';
import { uniqueViolationOf } from './pg-error.util';

function pgError(code: string, constraint?: string): QueryFailedError {
  const error = new QueryFailedError('SQL', [], new Error('boom'));
  Object.assign(error, { code, constraint });
  return error;
}

describe('uniqueViolationOf', () => {
  it('trả tên constraint khi là 23505', () => {
    expect(uniqueViolationOf(pgError('23505', 'UQ_accounts_email'))).toBe(
      'UQ_accounts_email',
    );
  });

  it('trả chuỗi rỗng khi 23505 nhưng driver không kèm tên', () => {
    expect(uniqueViolationOf(pgError('23505'))).toBe('');
  });

  it('trả null với mã lỗi Postgres khác', () => {
    // 23503 = foreign key violation, KHÔNG được nhầm thành trùng lặp
    expect(uniqueViolationOf(pgError('23503', 'FK_x'))).toBeNull();
  });

  it('trả null với lỗi không phải của TypeORM', () => {
    expect(uniqueViolationOf(new Error('lỗi thường'))).toBeNull();
    expect(uniqueViolationOf('chuỗi')).toBeNull();
    expect(uniqueViolationOf(null)).toBeNull();
  });
});
