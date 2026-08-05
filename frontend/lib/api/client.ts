import { clientIpOf, type ClientContext } from "./client-context";

/**
 * HTTP client tới backend NestJS (CRM-KOC API).
 *
 * Chỉ dùng ở phía server (Route Handler / Server Component). Trình duyệt không
 * gọi thẳng backend để access token còn nằm được trong cookie httpOnly.
 */

const API_BASE_URL = process.env.API_URL ?? "http://localhost:3000";

if (!process.env.API_URL && process.env.NODE_ENV === "production") {
  // Thiếu biến ở production mà vẫn chạy nghĩa là mọi request lặng lẽ đi tới
  // localhost và hỏng theo kiểu khó truy nguyên. Chết sớm dễ sửa hơn.
  throw new Error("Thiếu biến môi trường API_URL");
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    /**
     * Body lỗi đã parse. Backend trả HAI hình dạng:
     *   { message, businessCode }                  <- lỗi nghiệp vụ
     *   { message, error, statusCode }             <- Nest mặc định
     * Giữ nguyên bản thô vì chỉ `message` + `status` là không đủ: dialog tự
     * khoá cần `clientIp`, và highlight chip sai cần `businessCode`.
     */
    public readonly body: unknown = null,
  ) {
    super(message);
    this.name = "ApiError";
  }

  private field(key: string): string | undefined {
    if (typeof this.body !== "object" || this.body === null) return undefined;
    const value = (this.body as Record<string, unknown>)[key];
    return typeof value === "string" ? value : undefined;
  }

  get businessCode(): string | undefined {
    return this.field("businessCode");
  }

  /** Có ở 422 IP_WHITELIST_WOULD_LOCK_YOU_OUT, đã chuẩn hoá về IPv4. */
  get clientIp(): string | undefined {
    return this.field("clientIp");
  }
}

/** Nest trả message dạng string hoặc string[] (ValidationPipe). */
function extractMessage(body: unknown, fallback: string): string {
  if (typeof body === "object" && body !== null && "message" in body) {
    const message = (body as { message: unknown }).message;
    if (typeof message === "string") return message;
    if (Array.isArray(message) && typeof message[0] === "string") {
      return message.join(", ");
    }
  }
  return fallback;
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string;
  /**
   * IP + User-Agent của người dùng cuối. Bắt buộc với các endpoint mà backend
   * xét nguồn: /login/admin (IP whitelist), /login, /verify-otp (throttle theo
   * email+IP) và /refresh (đối chiếu IP/UA với lúc đăng nhập).
   */
  clientContext?: ClientContext;
};

function buildHeaders({
  body,
  token,
  clientContext,
}: RequestOptions): HeadersInit {
  const headers: Record<string, string> = {};

  if (body) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  if (clientContext?.forwardedFor) {
    // Giữ nguyên cả chuỗi: phần tử đầu là client, các phần sau là proxy trung
    // gian — backend cần đủ chuỗi để tự quyết định tin tới đâu.
    headers["x-forwarded-for"] = clientContext.forwardedFor;

    const ip = clientIpOf(clientContext);
    if (ip) headers["x-real-ip"] = ip;
  }

  if (clientContext?.userAgent) {
    headers["user-agent"] = clientContext.userAgent;
  }

  return headers;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body } = options;
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: buildHeaders(options),
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
  } catch {
    // Backend chưa chạy / sai host: phân biệt rõ với lỗi nghiệp vụ 4xx.
    throw new ApiError("Không kết nối được tới máy chủ. Vui lòng thử lại.", 503);
  }

  const raw = await response.text();

  let data: unknown = null;
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      // Gateway/proxy chết thường trả HTML. Ném ApiError để route trả lỗi sạch
      // thay vì để SyntaxError lọt ra thành 500 kèm stack.
      throw new ApiError(
        response.ok
          ? "Máy chủ trả về dữ liệu không hợp lệ."
          : `Máy chủ gặp sự cố (${response.status}).`,
        response.ok ? 502 : response.status,
      );
    }
  }

  if (!response.ok) {
    throw new ApiError(
      extractMessage(data, `Yêu cầu thất bại (${response.status})`),
      response.status,
      data,
    );
  }

  return data as T;
}
