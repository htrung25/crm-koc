"use client";

import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { ADMIN_NAV_ITEMS, ADMIN_SYSTEM_ITEMS } from "@/constants/navigation";
import { NAV_ICONS, type NavIconName } from "@/components/ui/icons";

/**
 * Sidebar bị ẩn dưới md, nên màn nhỏ cần một dải cuộn ngang.
 * Nhóm cấu hình hệ thống nằm sau một vạch ngăn để giữ đúng phân tách của
 * sidebar, thay vì trộn lẫn vào các mục nghiệp vụ.
 */
export function AdminMobileNav() {
  const pathname = usePathname();
  const t = useTranslations("navigation");
  const items = [...ADMIN_NAV_ITEMS, ...ADMIN_SYSTEM_ITEMS];

  return (
    <nav
      aria-label={t("adminNavigation")}
      className="md:hidden -mx-1 overflow-x-auto pb-1"
    >
      <ul className="flex min-w-max items-center gap-2 px-1">
        {items.map((item, index) => {
          const Icon = NAV_ICONS[item.iconName as NavIconName] ?? NAV_ICONS.dashboard;
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          const startsSystemGroup = index === ADMIN_NAV_ITEMS.length;

          if (item.disabled) {
            return null;
          }

          return (
            <li
              key={item.href}
              className={
                startsSystemGroup
                  ? "ml-1 border-l border-[#2D3B42]/15 pl-3"
                  : undefined
              }
            >
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center gap-2 rounded-2xl px-3.5 py-2.5 text-xs font-bold transition-colors ${isActive
                    ? "bg-gradient-to-br from-[#EF4623] to-[#D8410F] text-white shadow-lg shadow-[#EF4623]/25"
                    : "glass-soft text-[#5C5049]"
                  }`}
              >
                <Icon className="h-4 w-4" />
                {t(item.labelKey)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
