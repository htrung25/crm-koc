"use client";

import { useTranslations } from "next-intl";
import { LocaleToggle } from "@/components/ui/locale-toggle";

import { Link, useRouter } from "@/i18n/navigation";
import { requestLogout } from "@/features/auth/session";
import {
  IconBell,
  IconLogout,
  IconSearch,
} from "@/components/ui/icons";

type AdminTopbarProps = {
  title: string;
  greeting: string;
};

export function AdminTopbar({ title, greeting }: AdminTopbarProps) {
  const router = useRouter();
  const t = useTranslations("admin.topbar");

  const handleLogout = async () => {
    await requestLogout();
    router.replace("/admin");
    router.refresh();
  };

  return (
    <header className="sticky top-4 z-30 flex flex-wrap items-center justify-between gap-4 rounded-[24px] glass px-5 py-3.5">
      <div className="min-w-0">
        <h1 className="text-xl font-extrabold tracking-tight text-[#2D3B42]">
          {title}
        </h1>
        <p className="truncate text-xs font-medium text-[#8A7768]">{greeting}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {/* Ô tìm kiếm */}
        <div className="hidden h-11 items-center gap-2.5 rounded-2xl glass-soft px-3.5 lg:flex">
          <IconSearch className="h-4 w-4 text-[#8A7768]" />
          <input
            type="search"
            placeholder={t("searchPlaceholder")}
            aria-label={t("search")}
            className="w-56 bg-transparent text-sm font-medium text-[#2D3B42] placeholder:text-[#A89685] focus:outline-none"
          />
          <kbd className="rounded-lg bg-white/70 px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#8A7768] ring-1 ring-white/80">
            ⌘K
          </kbd>
        </div>

        <LocaleToggle />

        {/* Thông báo */}
        <button
          type="button"
          aria-label={t("notifications")}
          className="relative grid h-11 w-11 place-items-center rounded-2xl glass-soft text-[#2D3B42] transition-colors hover:bg-white/70"
        >
          <IconBell className="h-[18px] w-[18px]" />
          <span
            aria-hidden="true"
            className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[#EF4623] ring-2 ring-white/80"
          />
        </button>

        {/* Tài khoản */}
        <div className="flex h-11 items-center gap-2.5 rounded-2xl glass-soft pl-1.5 pr-3">
          <Link
            href="/admin/profile"
            aria-label={t("openProfile")}
            className="flex items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#EF4623]/25"
          >
            <span
              aria-hidden="true"
              className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-[#EF4623] to-[#F49E4C] text-[11px] font-extrabold text-white"
            >
              AD
            </span>
            <span className="hidden leading-tight sm:block">
              <span className="block text-xs font-extrabold text-[#2D3B42]">
                {t("administrator")}
              </span>
              <span className="block text-[10px] font-semibold text-[#8A7768]">
                RedSun Admin
              </span>
            </span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            aria-label={t("logout")}
            className="ml-1 grid h-8 w-8 place-items-center rounded-xl text-[#8A7768] transition-colors hover:bg-[#EF4623]/10 hover:text-[#EF4623]"
          >
            <IconLogout className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
