import { NextResponse } from "next/server";

import { ApiError, apiRequest } from "@/lib/api/client";
import { applySession } from "./session";
import {
  isUserRole,
  toUserRole,
  ROLE_HOME,
  type LoginTokenResponse,
  type LoginResult,
  type UserRole,
} from "./types";

/** `expectedRole` từ body request — bỏ qua giá trị rác thay vì tin mù. */
export function parseExpectedRole(value: unknown): UserRole | undefined {
  return typeof value === "string" && isUserRole(value) ? value : undefined;
}

/**
 * Đổi kết quả có token của backend thành phiên đăng nhập.
 *
 * `expectedRole` là cổng đăng nhập đang dùng: /admin chỉ nhận tài khoản admin.
 * Sai vai trò thì token vừa cấp bị thu hồi ngay và KHÔNG có cookie nào được
 * ghi — nếu chỉ trả lỗi mà bỏ mặc token, nó vẫn sống tới khi hết hạn.
 */
export async function establishSession(
  result: LoginTokenResponse,
  expectedRole?: UserRole,
): Promise<NextResponse> {
  const role = toUserRole(result.account.accountRole);

  if (!role) {
    await revokeToken(result.access_token);
    return NextResponse.json(
      { message: `Vai trò không được hỗ trợ: ${result.account.accountRole}` },
      { status: 502 },
    );
  }

  if (expectedRole && role !== expectedRole) {
    await revokeToken(result.access_token);
    return NextResponse.json(
      { message: "Tài khoản này không có quyền truy cập cổng đăng nhập này" },
      { status: 403 },
    );
  }

  return applySession(
    NextResponse.json<LoginResult>({
      status: "authenticated",
      role,
      redirectTo: ROLE_HOME[role],
    }),
    result.access_token,
    role,
  );
}

async function revokeToken(token: string): Promise<void> {
  try {
    await apiRequest("/logout", { method: "POST", token });
  } catch (error) {
    // Thu hồi hỏng cũng không được phép biến thành đăng nhập thành công.
    if (!(error instanceof ApiError)) throw error;
  }
}
