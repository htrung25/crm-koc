/**
 * API client mô phỏng cho CRM-KOC Frontend (Chế độ UI Only / Mock Data)
 * Đã gỡ kết nối với Backend API thực tế
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiClient<T = unknown>(
  endpoint: string,
  _config: RequestInit = {}
): Promise<T | null> {
  // Chế độ UI Only: Mô phỏng gọi API và trả về thành công/null để bảo vệ giao diện
  console.log(`[UI Only Mode] Simulation request to: ${endpoint}`);
  return null;
}

