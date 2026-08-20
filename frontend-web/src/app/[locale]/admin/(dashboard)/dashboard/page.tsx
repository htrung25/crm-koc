import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { DashboardGrid } from "@/components/dashboard/dashboard-grid";
import { ADMIN_DASHBOARD } from "@/lib/mock/admin/dashboard";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.dashboard");
  return { title: t("title") };
}

export default async function AdminDashboardPage() {
  const t = await getTranslations("admin.dashboard");
  return (
    <>
      <AdminTopbar
        title={t("title")}
        greeting={t("greeting")}
      />

      <AdminMobileNav />

      <DashboardGrid data={ADMIN_DASHBOARD} />
    </>
  );
}
