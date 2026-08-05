import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ApiError, apiRequest } from "@/lib/api/client";
import {
  clientIpOf,
  getClientContext,
  type ClientContext,
} from "@/lib/api/client-context";
import { ACCESS_COOKIE } from "@/features/auth/session";
import { MAX_WHITELIST_LENGTH } from "@/features/admin/ip-whitelist/whitelist";
import {
  SUPER_ADMIN_REQUIRED,
  type AdminResponse,
  type WhitelistErrorBody,
} from "@/features/admin/ip-whitelist/types";

/**
 * Sửa whitelist của CHÍNH người đang đăng nhập.
 *
 * Route này KHÔNG nhận `id` từ trình duyệt, và đó là điểm mấu chốt: bất biến
 * chống tự khoá của backend CHỈ áp khi ':id' là chính người gọi. Nếu client
 * truyền được id, nó gửi được id của admin khác — request vẫn hợp lệ với
 * backend nhưng lá chắn tắt lặng lẽ. Vì vậy id luôn được resolve phía server
 * qua `GET /me`, không bao giờ đi qua trình duyệt.
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

  // Fail CLOSED, không fail open: nếu không xác định được IP thật của người
  // gọi thì DỪNG LẠI ở đây, đừng gửi request tới backend. Nếu để lọt qua,
  // bất biến chống tự khoá của backend vẫn "chạy" nhưng so nhầm với IP của
  // server Next — admin có thể lưu whitelist thiếu IP của chính mình mà vẫn
  // nhận 200, rồi bị khoá ở request kế tiếp. Thà chặn thao tác còn hơn để
  // lá chắn trông như hoạt động trong khi đã vô hiệu.
  if (!clientIpOf(clientContext)) {
    return NextResponse.json(
      {
        message:
          "Không xác định được địa chỉ IP của bạn. Không thể thay đổi danh sách IP một cách an toàn.",
      },
      { status: 500 },
    );
  }

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

  // SuperAdminGuard ném `new ForbiddenException('REQUIRES_SUPER_ADMIN')`, tức
  // Nest trả { statusCode: 403, error: 'Forbidden', message: 'REQUIRES_SUPER_ADMIN' }
  // — KHÔNG có field businessCode như các lỗi nghiệp vụ khác của whitelist
  // (vd IP_WHITELIST_WOULD_LOCK_YOU_OUT). Nếu không chuẩn hoá ở đây, lớp UI so
  // body.businessCode === SUPER_ADMIN_REQUIRED sẽ luôn sai lặng lẽ, và người
  // dùng sẽ thấy thẳng chuỗi tiếng Anh "REQUIRES_SUPER_ADMIN".
  if (error.status === 403 && error.message === "REQUIRES_SUPER_ADMIN") {
    const body: WhitelistErrorBody = {
      message: "Chỉ super admin mới thay đổi được danh sách này.",
      businessCode: SUPER_ADMIN_REQUIRED,
    };
    return NextResponse.json(body, { status: error.status });
  }

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
    // Ghi đè cả danh sách. Cùng đường dẫn với DELETE (xoá một phần tử) — hai
    // thao tác trên cùng một sub-resource, khác method.
    const result = await apiRequest<AdminResponse>(
      `/admin/${session.adminId}/ip-whitelist`,
      {
        method: "PATCH",
        body: {
          ipWhitelist: payload.ipWhitelist,
          acknowledgeSelfLockout: payload.acknowledgeSelfLockout === true,
        },
        token: session.token,
        clientContext: session.clientContext,
      },
    );
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
