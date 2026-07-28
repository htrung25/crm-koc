/**
 * API client cơ bản cho CRM-KOC Frontend
 * Tự động gắn Bearer Token và quản lý header JSON
 */

import { clearSession } from "@/lib/auth/session";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://localhost:3000";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function getCookie(name: string): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return undefined;
}

export async function apiClient<T = unknown>(
  endpoint: string,
  { method = 'GET', body, headers = {}, ...customConfig }: RequestInit = {}
): Promise<T | null> {
  const token = getCookie('token');
  const isFormData = body instanceof FormData;

  const defaultHeaders: HeadersInit = {
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  };

  const config: RequestInit = {
    method,
    headers: defaultHeaders,
    ...(body ? { body: isFormData || typeof body === "string" ? body : JSON.stringify(body) } : {}),
    ...customConfig,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    let errorMessage = 'Đã có lỗi xảy ra từ máy chủ';
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      // Bỏ qua lỗi parse JSON
    }
    
    // Nếu token hết hạn hoặc lỗi unauth
    if (response.status === 401 && typeof window !== 'undefined') {
      clearSession();
      window.location.href = '/login';
    }

    throw new ApiError(errorMessage, response.status);
  }

  // Nếu request thành công và có nội dung trả về
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json() as Promise<T>;
  }
  return null;
}
