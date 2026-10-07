export enum EWithdrawalStatus {
  PENDING = 1,
  PROCESSING = 2,
  COMPLETED = 3,
  REJECTED = 4,
  FAILED = 5,
  CANCELLED = 6,
}

export enum EPaymentMethod {
  VNPAY = 'vnpay',
  MOMO = 'momo',
  CREDIT_CARD = 'credit_card',
  COD = 'cod',
}

export enum ECurency {
  VND = 'VND',
}

export enum EWalletTransactionsStatus {
  PENDING = 1,
  COMPLETED = 2,
  REVERSED = 3,
}
