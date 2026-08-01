/**
 * HTTP client tới backend NestJS (CRM-KOC API).
 *
 * Chỉ dùng ở phía server (Route Handler / Server Component). Trình duyệt không
 * gọi thẳng backend để access token còn nằm được trong cookie httpOnly.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
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
};

export async function apiRequest<T>(
  endpoint: string,
  { method = "GET", body, token }: RequestOptions = {},
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
  } catch {
    // Backend chưa chạy / sai host: phân biệt rõ với lỗi nghiệp vụ 4xx.
    throw new ApiError("Không kết nối được tới máy chủ. Vui lòng thử lại.", 503);
  }

  const raw = await response.text();
  const data: unknown = raw ? JSON.parse(raw) : null;

  if (!response.ok) {
    throw new ApiError(
      extractMessage(data, `Yêu cầu thất bại (${response.status})`),
      response.status,
    );
  }

  return data as T;
}
