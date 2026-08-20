import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ACCESS_COOKIE } from "@/features/auth/session";
import { ApiError } from "@/lib/api/server-client";
import { getClientContext, type ClientContext } from "@/lib/api/client-context";

/**
 * Phần chung của mọi Route Handler gọi backend thay người dùng: lấy access
 * token trong cookie httpOnly và IP/UA của request gốc.
 *
 * Không có token thì trả luôn 401 với cùng một hình dạng lỗi — lớp trình duyệt
 * chỉ cần biết một mã SESSION_EXPIRED thay vì mỗi route một kiểu.
 */
export async function requireSession(): Promise<
  | { ok: true; token: string; clientContext: ClientContext }
  | { ok: false; response: NextResponse }
> {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;

  if (!token) {
    return {
      ok: false,
      response: NextResponse.json(
        { message: "Phiên đã kết thúc", businessCode: "SESSION_EXPIRED" },
        { status: 401 },
      ),
    };
  }

  return { ok: true, token, clientContext: await getClientContext() };
}

/**
 * Đổi ApiError của backend thành response cho trình duyệt. Lỗi không phải
 * ApiError được ném tiếp: đó là bug của chính Next, không phải lỗi nghiệp vụ.
 */
export function errorResponse(error: unknown): NextResponse {
  if (error instanceof SyntaxError) {
    return NextResponse.json(
      { message: "Body không hợp lệ", businessCode: "INVALID_BODY" },
      { status: 400 },
    );
  }

  if (!(error instanceof ApiError)) throw error;

  return NextResponse.json(
    {
      message: error.message,
      businessCode: error.businessCode,
      clientIp: error.clientIp,
    },
    { status: error.status },
  );
}
