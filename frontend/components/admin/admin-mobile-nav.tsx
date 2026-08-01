"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ADMIN_NAV_ITEMS } from "@/config/navigation";
import { NAV_ICONS, type NavIconName } from "./admin-icons";

/** Rail bị ẩn dưới md, nên màn nhỏ cần một dải điều hướng cuộn ngang. */
export function AdminMobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Điều hướng quản trị"
      className="md:hidden -mx-1 overflow-x-auto pb-1"
    >
      <ul className="flex min-w-max items-center gap-2 px-1">
        {ADMIN_NAV_ITEMS.map((item) => {
          const Icon = NAV_ICONS[item.iconName as NavIconName] ?? NAV_ICONS.dashboard;
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center gap-2 rounded-2xl px-3.5 py-2.5 text-xs font-bold transition-colors ${
                  isActive
                    ? "bg-gradient-to-br from-[#EF4623] to-[#D8410F] text-white shadow-lg shadow-[#EF4623]/25"
                    : "glass-soft text-[#5C5049]"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
