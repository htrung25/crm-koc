import {
  BANK_ACCOUNT_SORT_FIELDS,
  WITHDRAWAL_SORT_FIELDS,
} from '../constants/payment.constants';

export type BankAccountSortField = (typeof BANK_ACCOUNT_SORT_FIELDS)[number];
export type WithdrawalSortField = (typeof WITHDRAWAL_SORT_FIELDS)[number];
