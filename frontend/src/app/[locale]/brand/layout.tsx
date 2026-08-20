import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";

export default function BrandLayout({ children }: { children: ReactNode }) {
  return <AppShell role="BRAND">{children}</AppShell>;
}
