"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { WORKSPACES } from "@/config/navigation";
import { clearSession } from "@/lib/auth/session";
import type { UserRole } from "@/types/auth";
import { AdminHeader } from "./admin-header";
import { AdminSidebar } from "./admin-sidebar";

type AppShellProps = {
  children: ReactNode;
  role: UserRole;
  onSearch?: (query: string) => void;
};

export function AppShell({ children, role, onSearch }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (role === "ADMIN") {
    return (
      <div className="flex h-dvh overflow-hidden bg-[#F6F7FB] text-[#1A1830]">
        {/* Desktop Sidebar */}
        <AdminSidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* Mobile Drawer Overlay */}
        {isMobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <AdminSidebar
              isMobile
              onCloseMobile={() => setIsMobileMenuOpen(false)}
            />
          </>
        )}

        <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
          <AdminHeader
            onSearch={onSearch}
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">{children}</main>
        </div>
      </div>
    );
  }

  // Default Shell for BRAND & CREATOR workspaces
  const workspace = WORKSPACES[role];

  const handleLogout = () => {
    clearSession();
    router.replace("/login");
    router.refresh();
  };

  return (
    <div className="flex min-h-dvh bg-slate-950 text-white">
      <aside className="sticky top-0 flex h-dvh w-64 shrink-0 flex-col justify-between border-r border-slate-800 bg-slate-900">
        <div>
          <div className="p-6">
            <Link
              href={workspace.navigation[0].href}
              className={`bg-gradient-to-r ${workspace.accentClassName} bg-clip-text text-xl font-bold text-transparent`}
            >
              {workspace.name}
            </Link>
          </div>

          <nav className="space-y-1 px-4" aria-label="Điều hướng chính">
            {workspace.navigation.map((item) => {
              if (item.disabled) {
                return (
                  <span
                    key={item.href}
                    className="block cursor-not-allowed rounded-xl px-4 py-3 text-sm font-medium text-slate-600"
                    aria-disabled="true"
                  >
                    {item.label}
                  </span>
                );
              }

              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`block rounded-xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-slate-800 text-white"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-slate-800 p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold transition hover:bg-red-950 hover:text-red-300"
          >
            Đăng xuất
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900/80 px-8 backdrop-blur">
          <h1 className="text-sm font-semibold text-slate-400">
            {workspace.eyebrow}
          </h1>
          <div className="flex items-center gap-3">
            <span
              className={`h-2.5 w-2.5 animate-pulse rounded-full ${workspace.statusClassName}`}
              aria-hidden="true"
            />
            <span className="text-sm font-bold text-slate-300">
              {workspace.accountLabel}
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
