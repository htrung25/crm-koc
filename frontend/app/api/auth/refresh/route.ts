import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ApiError, apiRequest } from "@/lib/api/client";
import { getClientContext } from "@/lib/api/client-context";
import {
  applySession,
  clearSessionCookies,
  REFRESH_COOKIE,
  ROLE_COOKIE,
} from "@/features/auth/session";
import { isUserRole } from "@/features/auth/types";

type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

/**
 * Đổi refresh token lấy cặp token mới.
 *
 * Backend xoay vòng: token cũ vô hiệu ngay khi gọi, và dùng lại token đã xoay
 * bị coi là dấu hiệu bị đánh cắp — cả phiên sẽ bị huỷ. Vì vậy cặp mới phải
 * được ghi đè vào cookie ngay trong cùng response, và mọi thất bại đều phải
 * xoá sạch cookie thay vì giữ lại một refresh token đã chết.
 *
 * Chỉ nhận IP/UA từ request gốc: backend đối chiếu chúng với lúc đăng nhập để
 * ghi nhận phiên bất thường.
 */
export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;
  const role = cookieStore.get(ROLE_COOKIE)?.value;

  if (!refreshToken || !isUserRole(role)) {
    return clearSessionCookies(
      NextResponse.json({ message: "Phiên đã kết thúc", businessCode: "SESSION_EXPIRED" }, { status: 401 }),
    );
  }

  try {
    const tokens = await apiRequest<TokenPair>("/refresh", {
      method: "POST",
      body: { refreshToken },
      clientContext: await getClientContext(),
    });

    return applySession(NextResponse.json({ status: "refreshed" }), tokens, role);
  } catch (error) {
    if (error instanceof ApiError) {
      return clearSessionCookies(
        NextResponse.json({ message: error.message }, { status: 401 }),
      );
    }
    throw error;
  }
}
