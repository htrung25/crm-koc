import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { AdminProfilePanel } from "@/features/admin/profile/components/profile-panel";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.profilePage");
  return { title: t("title") };
}

export default async function AdminProfilePage() {
  const t = await getTranslations("admin.profilePage");

  return (
    <AdminPageShell title={t("title")} greeting={t("greeting")}>
      <AdminProfilePanel />
    </AdminPageShell>
  );
}
