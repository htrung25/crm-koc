import type { Metadata } from "next";

import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { AdminSecurityManager } from "@/components/admin/admin-security-manager";

export const metadata: Metadata = {
  title: "Bảo mật",
};

export default async function AdminSecurityPage() {
  return (
    <>
      <AdminTopbar
        title="Bảo mật"
        greeting="Quản lý tài khoản admin và địa chỉ IP được phép truy cập."
      />

      <AdminMobileNav />

      <AdminSecurityManager />
    </>
  );
}
