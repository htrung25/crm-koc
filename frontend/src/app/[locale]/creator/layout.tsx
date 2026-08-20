import type { ReactNode } from "react";

import { AppShell } from "@/src/components/layout/app-shell";

export default function CreatorLayout({ children }: { children: ReactNode }) {
  return <AppShell role="CREATOR">{children}</AppShell>;
}
