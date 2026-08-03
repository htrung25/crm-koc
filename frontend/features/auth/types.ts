export const USER_ROLES = ["ADMIN", "BRAND", "CREATOR"] as const;

export type UserRole = (typeof USER_ROLES)[number];

// TODO: trỏ BRAND/CREATOR về dashboard riêng khi các trang đó được dựng lại.
export const ROLE_HOME: Record<UserRole, string> = {
  ADMIN: "/admin/dashboard",
  BRAND: "/",
  CREATOR: "/",
};

export function isUserRole(value: string | undefined): value is UserRole {
  return USER_ROLES.some((role) => role === value);
}

/** Backend (EAccountRole) dùng chữ thường: admin | brand | creator. */
export function toUserRole(accountRole: string): UserRole | undefined {
  const upper = accountRole.toUpperCase();
  return isUserRole(upper) ? upper : undefined;
}

/* ---------- Contract với backend NestJS ---------- */

export type AccountSummary = {
  id: string;
  email: string;
  name?: string;
  accountRole: string;
  status: string;
};

/**
 * POST /login/brand, POST /login/creator, POST /verify-otp.
 *
 * Backend dùng camelCase (LoginResponseDto). Trước đây khai `access_token`
 * nên giá trị đọc ra luôn undefined và cookie phiên được ghi bằng undefined.
 */
export type LoginTokenResponse = {
  accessToken: string;
  refreshToken: string;
  account: AccountSummary;
};

/** POST /login/admin — chỉ báo đã gửi OTP, chưa có token. */
export type LoginPendingResponse = {
  requireOtp: true;
  message: string;
};

export type LoginResponse = LoginTokenResponse | LoginPendingResponse;

export function isPendingOtp(res: LoginResponse): res is LoginPendingResponse {
  return "requireOtp" in res && res.requireOtp === true;
}

/* ---------- Contract giữa trình duyệt và Route Handler của Next ---------- */

export type LoginResult =
  | { status: "otp_required"; message: string }
  | { status: "authenticated"; role: UserRole; redirectTo: string };

export type ErrorResult = { message: string };
