export type AdminProfile = {
  accountId: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  timezone: string;
  updatedAt: string;
};

export type UpdateAdminProfile = {
  name?: string | null;
  email?: string;
  avatarUrl?: string | null;
  timezone?: string;
};
