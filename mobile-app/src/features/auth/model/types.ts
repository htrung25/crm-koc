/** Khớp ERole / EAccountStatus của API — giữ tay, không sinh tự động. */
export const ROLES = ['admin', 'brand', 'creator'] as const;
export type Role = (typeof ROLES)[number];

export const ACCOUNT_STATUSES = [1, 2, 3, 4] as const;
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

/** Vai trò nằm trong đường dẫn: POST /register/brand | /register/creator. */
export type RegisterRole = 'brand' | 'creator';

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  phone?: string;
};
