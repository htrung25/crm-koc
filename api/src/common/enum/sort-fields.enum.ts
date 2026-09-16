export enum ESortField {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  NAME = 'name',
  EMAIL = 'email',
  STATUS = 'status',
  AGREED_PRICE = 'agreedPrice',
  COMPLETED_AT = 'completedAt',
}
export enum ESortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export const ACCOUNT_SORT_FIELDS = [
  ESortField.CREATED_AT,
  ESortField.UPDATED_AT,
  ESortField.NAME,
  ESortField.EMAIL,
  ESortField.STATUS,
] as const;
