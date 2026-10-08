import {
  BANK_ACCOUNT_SORT_FIELDS,
  WITHDRAWAL_SORT_FIELDS,
} from '../constants/payment.constants';
import type { Deposit } from '../entities/deposit.entity';

export type BankAccountSortField = (typeof BANK_ACCOUNT_SORT_FIELDS)[number];
export type WithdrawalSortField = (typeof WITHDRAWAL_SORT_FIELDS)[number];

// Payload webhook của SePay (docs.sepay.vn/tich-hop-webhooks.html).
export type SepayWebhookPayload = {
  id: number;
  gateway: string;
  transactionDate: string;
  accountNumber: string;
  subAccount: string | null;
  code: string | null;
  content: string;
  transferType: string;
  description: string;
  transferAmount: number;
  accumulated: number;
  referenceCode: string;
};

export type DepositWithQr = {
  deposit: Deposit;
  // Nội dung chuyển khoản user phải giữ nguyên để lệnh nạp được nhận diện.
  transferContent: string;
  bankCode: string;
  accountNumber: string;
  qrUrl: string;
};
