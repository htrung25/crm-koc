import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { IpWhitelistManager } from "@/components/admin/ip-whitelist-manager";
import { ACCESS_COOKIE } from "@/features/auth/session";
import type { AdminResponse } from "@/features/admin/ip-whitelist/types";
import { ApiError, apiRequest } from "@/lib/api/client";
import { clientIpOf, getClientContext } from "@/lib/api/client-context";

export const metadata: Metadata = {
  title: "Bảo mật",
};

export default async function AdminSecurityPage() {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;

  // Cùng nguồn IP mà route đăng nhập chuyển tiếp cho backend, nên con số hiển
  // thị ở đây đúng bằng thứ IpWhitelistGuard sẽ đem đi so khớp.
  const clientContext = await getClientContext();
  const currentIp = clientIpOf(clientContext);

  if (!token) redirect("/admin");

  let admin: AdminResponse;
  try {
    const me = await apiRequest<{ id: string }>("/me", { token, clientContext });
    admin = await apiRequest<AdminResponse>(`/admin/${me.id}`, {
      token,
      clientContext,
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect("/admin");
    throw error;
  }

  // Fail-safe: thiếu adminRole (backend chưa expose) thì coi như không có
  // quyền sửa. Thà super admin phải hỏi vì sao không sửa được, còn hơn admin
  // thường bấm nút rồi ăn 403 khó hiểu.
  const canEdit = admin.adminRole === "super_admin";

  return (
    <>
      <AdminTopbar
        title="Bảo mật"
        greeting="Kiểm soát địa chỉ được phép truy cập khu vực quản trị."
      />

      <AdminMobileNav />

      <IpWhitelistManager
        initialWhitelist={admin.ipWhitelist}
        currentIp={currentIp}
        canEdit={canEdit}
      />
    </>
  );
}
