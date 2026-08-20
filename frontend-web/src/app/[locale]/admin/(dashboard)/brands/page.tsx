import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { AdminBrandList } from "@/features/admin/brands/components/brand-list";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.brands");
  return { title: t("title") };
}

export default async function AdminBrandsPage() {
  const t = await getTranslations("admin.brands");

  return (
    <AdminPageShell title={t("title")} greeting={t("greeting")}>
      <AdminBrandList />
    </AdminPageShell>
  );
}
