import type { Metadata } from "next";

import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { DashboardGrid } from "@/components/dashboard/dashboard-grid";
import { ADMIN_DASHBOARD } from "@/lib/mock/admin/dashboard";

export const metadata: Metadata = {
  title: "Tổng quan",
};

export default function AdminDashboardPage() {
  return (
    <>
      <AdminTopbar
        title="Tổng quan"
        greeting="Chào buổi sáng — đây là tình hình hệ thống hôm nay."
      />

      <AdminMobileNav />

      <DashboardGrid data={ADMIN_DASHBOARD} />
    </>
  );
}
