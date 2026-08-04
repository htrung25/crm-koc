import type { Metadata } from "next";

import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { IpWhitelistManager } from "@/components/admin/ip-whitelist-manager";
import { clientIpOf, getClientContext } from "@/lib/api/client-context";
import { IP_WHITELIST } from "@/lib/mock/admin/ip-whitelist";

export const metadata: Metadata = {
  title: "Bảo mật",
};

export default async function AdminSecurityPage() {
  // Cùng nguồn IP mà route đăng nhập chuyển tiếp cho backend, nên con số hiển
  // thị ở đây đúng bằng thứ IpWhitelistGuard sẽ đem đi so khớp.
  const currentIp = clientIpOf(await getClientContext());

  return (
    <>
      <AdminTopbar
        title="Bảo mật"
        greeting="Kiểm soát địa chỉ được phép truy cập khu vực quản trị."
      />

      <AdminMobileNav />

      <IpWhitelistManager
        defaultEntries={IP_WHITELIST}
        currentIp={currentIp}
      />
    </>
  );
}
