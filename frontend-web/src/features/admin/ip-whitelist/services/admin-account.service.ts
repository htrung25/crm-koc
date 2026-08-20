import { API_ROUTES } from "@/constants/routes";
import { apiFetch, readJson } from "@/lib/api/browser-client";
import type {
  AdminPage,
  AdminResponse,
} from "@/features/admin/ip-whitelist/types";

/**
 * Tài khoản quản trị — nguồn dữ liệu của màn hình IP whitelist.
 *
 * Route Handler đã chuẩn hoá lỗi (businessCode, clientIp) nên ở đây chỉ cần
 * readJson; mọi nhánh xử lý lỗi nằm ở lớp giao diện vì chúng khác nhau theo
 * từng thao tác.
 */
export async function fetchAdmins(): Promise<AdminPage> {
  return readJson<AdminPage>(await apiFetch(API_ROUTES.admin.accounts));
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
