import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { AdminBrandList } from "@/src/components/admin/admin-brand-list";
import { AdminMobileNav } from "@/src/components/admin/admin-mobile-nav";
import { AdminTopbar } from "@/src/components/admin/admin-topbar";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.brands");
  return { title: t("title") };
}

export default async function AdminBrandsPage() {
  const t = await getTranslations("admin.brands");

  return (
    <>
      <AdminTopbar title={t("title")} greeting={t("greeting")} />

      <AdminMobileNav />

      <AdminBrandList />
    </>
  );
}
