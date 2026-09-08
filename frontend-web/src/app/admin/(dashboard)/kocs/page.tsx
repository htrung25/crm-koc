import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { AdminKocList } from "@/features/admin/kocs/components/koc-list";
import { KocSkeleton } from "@/features/admin/kocs/components/koc-skeleton";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.kocs");
  return { title: t("title") };
}

export default async function AdminKocsPage() {
  const t = await getTranslations("admin.kocs");

  return (
    <AdminPageShell title={t("title")} greeting={t("greeting")}>
      <Suspense fallback={<KocSkeleton />}>
        <AdminKocList />
      </Suspense>
    </AdminPageShell>
  );
}
