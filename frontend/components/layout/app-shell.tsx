"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { WORKSPACES } from "@/config/navigation";
import { requestLogout } from "@/features/auth/session";
import type { UserRole } from "@/features/auth/types";

type AppShellProps = {
  children: ReactNode;
  role: UserRole;
};

export function AppShell({ children, role }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Default Shell for BRAND & CREATOR workspaces
  const workspace = WORKSPACES[role];

  const handleLogout = async () => {
    await requestLogout();
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
