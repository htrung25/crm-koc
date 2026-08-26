import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { AdminIpWhitelist } from "@/features/admin/ip-whitelist/components/ip-whitelist-panel";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.ipWhitelistPage");
  return { title: t("title") };
}

export default async function AdminSecurityPage() {
  const t = await getTranslations("admin.ipWhitelistPage");

  return (
    <AdminPageShell title={t("title")} greeting={t("greeting")}>
      <AdminIpWhitelist />
    </AdminPageShell>
  );
}
