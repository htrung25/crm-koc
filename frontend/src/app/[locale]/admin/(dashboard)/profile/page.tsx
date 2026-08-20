import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { AdminMobileNav } from "@/src/components/admin/admin-mobile-nav";
import { AdminProfilePanel } from "@/src/components/admin/admin-profile-panel";
import { AdminTopbar } from "@/src/components/admin/admin-topbar";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.profilePage");
  return { title: t("title") };
}

export default async function AdminProfilePage() {
  const t = await getTranslations("admin.profilePage");
  return (
    <>
      <AdminTopbar
        title={t("title")}
        greeting={t("greeting")}
      />

      <AdminMobileNav />

      <AdminProfilePanel />
    </>
  );
}
