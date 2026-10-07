import {
  EBankAccountSortField,
  ESortField,
  EWithdrawalSortField,
} from '../../../common/enum/sort-fields.enum';
import { ERole } from '../../../common/enum/roles.enum';

export const BANK_ACCOUNT_SORT_FIELDS = [
  ESortField.CREATED_AT,
  ESortField.UPDATED_AT,
  EBankAccountSortField.BANK_CODE,
  EBankAccountSortField.BANK_NAME,
  EBankAccountSortField.IS_DEFAULT,
] as const;

export const WITHDRAWAL_SORT_FIELDS = [
  ESortField.CREATED_AT,
  ESortField.UPDATED_AT,
  EWithdrawalSortField.AMOUNT,
] as const;

// Payment chỉ phục vụ creator và brand
export const PAYMENT_ROLES: readonly ERole[] = [ERole.CREATOR, ERole.BRAND];

export const WITHDRAWAL_FEE_PERCENT_KEY = 'withdrawal.fee_percent';

export const WITHDRAWAL_IDEMPOTENCY_HEADER = 'Idempotency-Key';
/** Khớp varchar(128) của withdrawals.idempotency_key. */
export const MAX_WITHDRAWAL_IDEMPOTENCY_KEY_LENGTH = 128;

/** numeric(15,2): tối đa 13 chữ số phần nguyên, 2 chữ số thập phân. */
export const WITHDRAWAL_AMOUNT_PATTERN = /^\d{1,13}(\.\d{1,2})?$/;

export const WITHDRAWAL_CODE_PREFIX = 'WD-';
export const WITHDRAWAL_CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
export const WITHDRAWAL_CODE_LENGTH = 10;
