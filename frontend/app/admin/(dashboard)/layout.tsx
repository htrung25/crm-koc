import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  return <AppShell role="ADMIN">{children}</AppShell>;
}
