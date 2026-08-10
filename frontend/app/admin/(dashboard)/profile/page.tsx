import type { Metadata } from "next";

import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";
import { AdminProfilePanel } from "@/components/admin/admin-profile-panel";
import { AdminTopbar } from "@/components/admin/admin-topbar";

export const metadata: Metadata = {
  title: "Hồ sơ admin",
};

export default function AdminProfilePage() {
  return (
    <>
      <AdminTopbar
        title="Hồ sơ admin"
        greeting="Quản lý thông tin hiển thị và thiết lập cá nhân."
      />

      <AdminMobileNav />

      <AdminProfilePanel />
    </>
  );
}
