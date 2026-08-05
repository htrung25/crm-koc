import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ApiError, apiRequest } from "@/lib/api/client";
import { getClientContext, type ClientContext } from "@/lib/api/client-context";
import { ACCESS_COOKIE } from "@/features/auth/session";
import { MAX_WHITELIST_LENGTH } from "@/features/admin/ip-whitelist/whitelist";
import type {
  AdminResponse,
  WhitelistErrorBody,
} from "@/features/admin/ip-whitelist/types";

/**
 * Sửa whitelist của CHÍNH người đang đăng nhập.
 *
 * Đường dẫn cố ý là '/me' chứ không phải '/[id]': bất biến chống tự khoá của
 * backend CHỈ áp khi ':id' là chính người gọi. Nếu trình duyệt truyền được id,
 * nó gửi được id của admin khác — request vẫn hợp lệ nhưng lá chắn tắt lặng lẽ.
 * Resolve id ở server thì id không bao giờ đi qua trình duyệt.
 */

type Session = {
  token: string;
  adminId: string;
  clientContext: ClientContext;
};

async function resolveSession(): Promise<Session | NextResponse> {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: "Phiên đã kết thúc" }, { status: 401 });
  }

  // clientContext phải đi kèm MỌI lời gọi: thiếu nó backend thấy IP của server
  // Next, bất biến chống tự khoá vẫn chạy nhưng so sai IP.
  const clientContext = await getClientContext();

  try {
    const me = await apiRequest<{ id: string }>("/me", {
      token,
      clientContext,
    });
    return { token, adminId: me.id, clientContext };
  } catch (error) {
    return toErrorResponse(error);
  }
}

function toErrorResponse(error: unknown): NextResponse {
  if (!(error instanceof ApiError)) throw error;

  const body: WhitelistErrorBody = { message: error.message };
  if (error.businessCode) body.businessCode = error.businessCode;
  if (error.clientIp) body.clientIp = error.clientIp;

  return NextResponse.json(body, { status: error.status });
}

export async function PATCH(request: Request) {
  const session = await resolveSession();
  if (session instanceof NextResponse) return session;

  let payload: { ipWhitelist?: unknown; acknowledgeSelfLockout?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Body không hợp lệ" }, { status: 400 });
  }

  // Chuỗi rỗng là giá trị HỢP LỆ (= cho phép mọi IP), nên phải kiểm kiểu chứ
  // không kiểm truthy.
  if (typeof payload.ipWhitelist !== "string") {
    return NextResponse.json(
      { message: "Thiếu trường ipWhitelist" },
      { status: 400 },
    );
  }

  if (payload.ipWhitelist.length > MAX_WHITELIST_LENGTH) {
    return NextResponse.json(
      { message: `Danh sách vượt quá ${MAX_WHITELIST_LENGTH} ký tự` },
      { status: 400 },
    );
  }

  try {
    const result = await apiRequest<AdminResponse>(`/admin/${session.adminId}`, {
      method: "PATCH",
      body: {
        ipWhitelist: payload.ipWhitelist,
        acknowledgeSelfLockout: payload.acknowledgeSelfLockout === true,
      },
      token: session.token,
      clientContext: session.clientContext,
    });
    return NextResponse.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  const session = await resolveSession();
  if (session instanceof NextResponse) return session;

  const params = new URL(request.url).searchParams;
  const entry = params.get("entry")?.trim();
  if (!entry) {
    return NextResponse.json({ message: "Thiếu tham số entry" }, { status: 400 });
  }

  // encodeURIComponent vì CIDR chứa dấu '/'.
  const query = new URLSearchParams({
    entry,
    acknowledgeSelfLockout: String(
      params.get("acknowledgeSelfLockout") === "true",
    ),
  });

  try {
    const result = await apiRequest<AdminResponse>(
      `/admin/${session.adminId}/ip-whitelist?${query}`,
      {
        method: "DELETE",
        token: session.token,
        clientContext: session.clientContext,
      },
    );
    return NextResponse.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
