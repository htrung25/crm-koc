import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { IpWhitelistManager } from "@/components/admin/ip-whitelist-manager";
import { ACCESS_COOKIE } from "@/features/auth/session";
import type { AdminResponse } from "@/features/admin/ip-whitelist/types";
import { normalizeClientIp } from "@/features/admin/ip-whitelist/whitelist";
import { ApiError, apiRequest } from "@/lib/api/client";
import { clientIpOf, getClientContext } from "@/lib/api/client-context";

export const metadata: Metadata = {
  title: "Bảo mật",
};

export default async function AdminSecurityPage() {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;

  const clientContext = await getClientContext();
  const currentIp = normalizeClientIp(clientIpOf(clientContext));

  if (!token) redirect("/admin");

  let admin: AdminResponse;
  try {
    const me = await apiRequest<{ id: string }>("/me", { token, clientContext });
    admin = await apiRequest<AdminResponse>(`/admin/${me.id}/ip-whitelist`, {
      token,
      clientContext,
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect("/admin");
    throw error;
  }

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
