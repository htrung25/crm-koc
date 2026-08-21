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
