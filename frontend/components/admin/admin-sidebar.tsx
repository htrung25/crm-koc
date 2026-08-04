"use client";

import Link from "next/link";
import { useId } from "react";
import { usePathname } from "next/navigation";

import {
  ADMIN_NAV_ITEMS,
  ADMIN_SYSTEM_ITEMS,
  type NavigationItem,
} from "@/config/admin/navigation";
import { NAV_ICONS, type NavIconName } from "@/components/ui/icons";

function NavGroup({
  title,
  items,
  pathname,
}: {
  title: string;
  items: NavigationItem[];
  pathname: string;
}) {
  // useId thay vì ghép từ tiêu đề: "Điều hướng" có dấu cách, mà id chứa khoảng
  // trắng là không hợp lệ và aria-labelledby sẽ không trỏ tới được.
  const headingId = useId();

  return (
    <div>
      {/* Tiêu đề nhóm để nav bên dưới tham chiếu tới, thay vì aria-label lặp
          lại đúng chữ đã hiển thị */}
      <h2
        id={headingId}
        className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A7768]"
      >
        {title}
      </h2>

      <nav aria-labelledby={headingId}>
        <ul className="space-y-1">
          {items.map((item) => {
            const Icon =
              NAV_ICONS[item.iconName as NavIconName] ?? NAV_ICONS.dashboard;
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            if (item.disabled) {
              return (
                <li key={item.href}>
                  <span
                    aria-disabled="true"
                    title="Sắp có"
                    className="flex cursor-not-allowed items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-[#B4A091]"
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" />
                    {item.label}
                  </span>
                </li>
              );
            }

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#EF4623]/30 ${isActive
                      ? "bg-gradient-to-br from-[#EF4623] to-[#D8410F] text-white shadow-lg shadow-[#EF4623]/25"
                      : "text-[#5C5049] hover:bg-white/60 hover:text-[#2D3B42]"
                    }`}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

/**
 * Sidebar quản trị: hai nhóm tách bạch, mỗi mục có nhãn chữ.
 *
 * Chỉ hiện icon thì nhanh về diện tích nhưng bắt người dùng phải nhớ nghĩa của
 * từng hình; nhãn chữ bỏ hẳn bước đoán đó. Nhóm "Cấu hình hệ thống" tách khỏi
 * "Điều hướng" vì nó đổi hành vi toàn hệ thống, không phải việc thao tác hằng
 * ngày.
 */
export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-[248px] shrink-0 flex-col gap-6 overflow-y-auto rounded-[28px] glass p-4 md:flex">
      <Link
        href="/admin/dashboard"
        className="flex items-center gap-3 rounded-2xl px-1 py-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#EF4623]/30"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#EF4623] to-[#F49E4C] shadow-lg shadow-[#EF4623]/30">
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" aria-hidden="true">
            <circle cx="12" cy="12" r="4.6" fill="currentColor" />
            <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none">
              <path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2" />
              <path d="M5.4 5.4l1.6 1.6M17 17l1.6 1.6M18.6 5.4L17 7M7 17l-1.6 1.6" />
            </g>
          </svg>
        </span>
        <span className="leading-tight">
          <span className="block text-sm font-extrabold text-[#2D3B42]">
            RedSun
          </span>
          <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-[#EF4623]">
            Admin
          </span>
        </span>
      </Link>

      <NavGroup title="Điều hướng" items={ADMIN_NAV_ITEMS} pathname={pathname} />

      <div className="border-t border-[#2D3B42]/10 pt-5">
        <NavGroup
          title="Cấu hình hệ thống"
          items={ADMIN_SYSTEM_ITEMS}
          pathname={pathname}
        />
      </div>
    </aside>
  );
}
