import { API_ROUTES } from "@/constants/routes";
import { apiFetch, readJson } from "@/lib/api/browser-client";
import type {
  AdminPage,
  AdminQuery,
  AdminResponse,
} from "@/features/admin/ip-whitelist/types";

/**
 * Tài khoản quản trị — nguồn dữ liệu của màn hình IP whitelist.
 *
 * Route Handler đã chuẩn hoá lỗi (businessCode, clientIp) nên ở đây chỉ cần
 * readJson; mọi nhánh xử lý lỗi nằm ở lớp giao diện vì chúng khác nhau theo
 * từng thao tác.
 */
export async function fetchAdmins(
  query?: Partial<AdminQuery>,
  signal?: AbortSignal,
): Promise<AdminPage> {
  const params = new URLSearchParams();
  if (query?.page) params.set("page", String(query.page));
  if (query?.limit) params.set("limit", String(query.limit));
  if (query?.search?.trim()) params.set("search", query.search.trim());
  if (query?.role && query.role !== "all") params.set("role", query.role);

  const url = params.toString()
    ? `${API_ROUTES.admin.accounts}?${params}`
    : API_ROUTES.admin.accounts;

  return readJson<AdminPage>(await apiFetch(url, { signal }));
}

export async function fetchAdmin(id: string): Promise<AdminResponse> {
  return readJson<AdminResponse>(await apiFetch(API_ROUTES.admin.account(id)));
}

export async function updateAdmin(
  id: string,
  payload: Record<string, unknown>,
): Promise<AdminResponse> {
  return readJson<AdminResponse>(
    await apiFetch(API_ROUTES.admin.account(id), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );
}

export async function deleteAdmin(id: string): Promise<void> {
  await readJson(await apiFetch(API_ROUTES.admin.account(id), { method: "DELETE" }));
}
