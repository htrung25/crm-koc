import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { DashboardGrid } from "@/features/admin/dashboard/components/dashboard-grid";
import { ADMIN_DASHBOARD } from "@/features/admin/dashboard/mock-data";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.dashboard");
  return { title: t("title") };
}

export default async function AdminDashboardPage() {
  const t = await getTranslations("admin.dashboard");

  return (
    <AdminPageShell title={t("title")} greeting={t("greeting")}>
      <DashboardGrid data={ADMIN_DASHBOARD} />
    </AdminPageShell>
  );
}
