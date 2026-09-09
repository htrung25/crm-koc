/** Khớp ERole / EAccountStatus của API — giữ tay, không sinh tự động. */
export const ROLES = ['ADMIN', 'BRAND', 'CREATOR'] as const;
export type Role = (typeof ROLES)[number];

export const ACCOUNT_STATUSES = ['ACTIVE', 'PENDING', 'SUSPENDED', 'BANNED'] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export type Account = {
  id: string;
  email: string;
  name: string;
  /** null khi đăng nhập Google mà chưa chọn vai trò. */
  accountRole: Role | null;
  status: AccountStatus;
};

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

export type LoginResponse = TokenPair & {
  account: Account;
};

/** Login không trả token: API luôn bắt qua bước OTP. */
export type OtpChallenge = {
  requireOtp: boolean;
  message: string;
};
