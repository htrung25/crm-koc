import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { AdminMobileNav } from "@/src/components/admin/admin-mobile-nav";
import { AdminTopbar } from "@/src/components/admin/admin-topbar";
import { AdminIpWhitelist } from "@/src/components/admin/admin-ip-whitelist";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.ipWhitelistPage");
  return { title: t("title") };
}

export default async function AdminSecurityPage() {
  const t = await getTranslations("admin.ipWhitelistPage");
  return (
    <>
      <AdminTopbar
        title={t("title")}
        greeting={t("greeting")}
      />

      <AdminMobileNav />

      <AdminIpWhitelist />
    </>
  );
}
