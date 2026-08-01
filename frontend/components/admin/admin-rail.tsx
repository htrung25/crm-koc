"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ADMIN_NAV_ITEMS } from "@/config/navigation";
import {
  NAV_ICONS,
  IconHelp,
  IconSettings,
  type NavIconName,
} from "@/components/ui/icons";

/**
 * Thanh điều hướng dạng icon rail bên trái.
 *
 * Nhãn chữ chỉ hiện khi hover (tooltip) để rail giữ được bề ngang ~76px —
 * đổi lại mỗi mục phải có aria-label, nếu không thì với screen reader nó chỉ
 * là một ô trống.
 */
export function AdminRail() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex sticky top-4 h-[calc(100vh-2rem)] w-[76px] shrink-0 flex-col items-center gap-2 rounded-[28px] glass py-5">
      {/* Logo */}
      <Link
        href="/admin/dashboard"
        aria-label="RedSun Admin"
        className="mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-[#EF4623] to-[#F49E4C] shadow-lg shadow-[#EF4623]/30 transition-transform duration-300 hover:scale-105"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" aria-hidden="true">
          <circle cx="12" cy="12" r="4.6" fill="currentColor" />
          <g
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          >
            <path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2" />
            <path d="M5.4 5.4l1.6 1.6M17 17l1.6 1.6M18.6 5.4L17 7M7 17l-1.6 1.6" />
          </g>
        </svg>
      </Link>

      <nav className="flex flex-col items-center gap-1.5" aria-label="Điều hướng quản trị">
        {ADMIN_NAV_ITEMS.map((item) => {
          const Icon = NAV_ICONS[item.iconName as NavIconName] ?? NAV_ICONS.dashboard;
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className={`group relative grid h-12 w-12 place-items-center rounded-2xl transition-all duration-300 ${
                isActive
                  ? "bg-gradient-to-br from-[#EF4623] to-[#D8410F] text-white shadow-lg shadow-[#EF4623]/30"
                  : "text-[#7A6357] hover:bg-white/60 hover:text-[#2D3B42]"
              }`}
            >
              <Icon className="h-[19px] w-[19px]" />

              {/* Tooltip nhãn */}
              <span className="pointer-events-none absolute left-[calc(100%+10px)] z-20 whitespace-nowrap rounded-xl bg-[#2D3B42] px-3 py-1.5 text-[11px] font-bold text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col items-center gap-2">
        <button
          type="button"
          aria-label="Trợ giúp"
          className="grid h-11 w-11 place-items-center rounded-2xl text-[#7A6357] transition-colors hover:bg-white/60 hover:text-[#2D3B42]"
        >
          <IconHelp />
        </button>
        <button
          type="button"
          aria-label="Cài đặt"
          className="grid h-11 w-11 place-items-center rounded-2xl text-[#7A6357] transition-colors hover:bg-white/60 hover:text-[#2D3B42]"
        >
          <IconSettings />
        </button>
      </div>
    </aside>
  );
}
