/** Cột mọi bảng đều có. Cột riêng của từng bảng khai ở enum riêng bên dưới. */
export enum ESortField {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}
export enum ESortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export enum EAccountSortField {
  NAME = 'name',
  EMAIL = 'email',
  STATUS = 'status',
}

export enum ECollaborationSortField {
  STATUS = 'status',
  AGREED_PRICE = 'agreedPrice',
  COMPLETED_AT = 'completedAt',
}

export enum EBankAccountSortField {
  BANK_CODE = 'bankCode',
  BANK_NAME = 'bankName',
  IS_DEFAULT = 'isDefault',
}

export enum EWithdrawalSortField {
  AMOUNT = 'amount',
}
