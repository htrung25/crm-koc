import { AuthEntity } from 'src/module/auth/entities/auth.entity';

export const BRAND_LIST_FIELDS = [
  'id',
  'name',
  'email',
  'phone',
  'accountRole',
  'status',
  'createdAt',
] as const;

/** Chi tiết brand: đúng bằng các cột đã select, không kèm brand_profiles. */
export const BRAND_DETAIL_COLUMNS = {
  id: true,
  name: true,
  email: true,
  phone: true,
  accountRole: true,
  status: true,
  emailVerifiedAt: true,
  createdAt: true,
} as const;

export const CREATOR_LIST_FIELDS = [
  'id',
  'name',
  'email',
  'phone',
  'accountRole',
  'status',
  'createdAt',
] as const;

/** Chi tiết creator: đúng bằng các cột đã select, không kèm creator_profiles. */
export const CREATOR_DETAIL_COLUMNS = {
  id: true,
  name: true,
  email: true,
  phone: true,
  accountRole: true,
  status: true,
  emailVerifiedAt: true,
  createdAt: true,
} as const;

/** Kiểu của một dòng trong danh sách: đúng bằng các cột đã select. */
export type BrandListItem = Pick<
  AuthEntity,
  (typeof BRAND_LIST_FIELDS)[number]
>;

export type BrandDetail = Pick<AuthEntity, keyof typeof BRAND_DETAIL_COLUMNS>;

/** Kiểu của một dòng trong danh sách: đúng bằng các cột đã select. */
export type CreatorListItem = Pick<
  AuthEntity,
  (typeof CREATOR_LIST_FIELDS)[number]
>;

export type CreatorDetail = Pick<
  AuthEntity,
  keyof typeof CREATOR_DETAIL_COLUMNS
>;
