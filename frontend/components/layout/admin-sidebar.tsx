"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV_ITEMS } from "@/config/navigation";

type AdminSidebarProps = {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobile?: boolean;
  onCloseMobile?: () => void;
};

const navIconMap: Record<string, React.ReactNode> = {
  dashboard: (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  users: (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
      <path d="M16 6.2a3 3 0 0 1 0 5.6" />
      <path d="M18.5 20a5 5 0 0 0-3-4.6" />
    </svg>
  ),
  building: (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21V7l9-4 9 4v14" />
      <path d="M3 21h18" />
      <rect x="9" y="13" width="6" height="8" />
    </svg>
  ),
  megaphone: (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 11 18-5v12L3 14v-3z" />
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </svg>
  ),
  fileCheck: (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12l2 2 4-4" />
      <rect x="4" y="4" width="16" height="18" rx="2" />
      <path d="M9 2h6v3H9z" />
    </svg>
  ),
  clipboardList: (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 11 3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
  barChart: (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20V4" />
      <path d="M4 20h16" />
      <rect x="7" y="11" width="3" height="6" />
      <rect x="12" y="7" width="3" height="10" />
      <rect x="17" y="13" width="3" height="4" />
    </svg>
  )
};

export function AdminSidebar({
  isCollapsed = false,
  onToggleCollapse,
  isMobile = false,
  onCloseMobile
}: AdminSidebarProps) {
  const pathname = usePathname();

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between p-[22px_14px] text-white">
      <div className="flex min-h-0 flex-1 flex-col">
        {/* Brand Header */}
        <div className={`flex items-center gap-3 px-2 py-1 mb-2 ${isCollapsed ? "justify-center" : ""}`}>
          <div
            className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-[13px] text-white font-extrabold text-xl font-mono shadow-md"
            style={{
              background: "linear-gradient(135deg, #6C4CF1, #FF5C8A)",
              boxShadow: "0 6px 16px rgba(108,76,241,.4)"
            }}
          >
            K
          </div>
          {!isCollapsed && (
            <div className="flex-1 overflow-hidden">
              <div className="font-extrabold text-base tracking-tight text-white leading-tight font-sans truncate">
                CRM-KOC
              </div>
              <div className="text-[11px] font-semibold text-white/50 truncate">
                Nền tảng KOC
              </div>
            </div>
          )}
          {isMobile && onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white"
              aria-label="Close menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Section Label */}
        {!isCollapsed && (
          <div className="text-[10.5px] font-bold tracking-[1px] uppercase text-white/40 my-4 px-2">
            ĐIỀU HƯỚNG
          </div>
        )}

        {/* Navigation Items */}
        <nav className="space-y-1.5 mt-2" aria-label="Admin navigation">
          {ADMIN_NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const icon = (item.iconName && navIconMap[item.iconName]) || navIconMap.dashboard;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={isMobile ? onCloseMobile : undefined}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center gap-3 rounded-xl py-2.5 text-sm font-semibold transition-all ${
                  isCollapsed ? "justify-center px-0" : "px-3.5"
                } ${
                  isActive
                    ? "bg-white/13 text-white border border-white/10 font-bold shadow-xs"
                    : "text-white/65 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="shrink-0">{icon}</span>
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Desktop Collapse Toggle */}
      {!isMobile && onToggleCollapse && (
        <div className="border-t border-white/10 pt-3 mt-2">
          <button
            type="button"
            onClick={onToggleCollapse}
            className={`flex w-full items-center gap-3 rounded-xl py-2 text-xs font-semibold text-white/60 hover:bg-white/10 hover:text-white transition ${
              isCollapsed ? "justify-center" : "px-3"
            }`}
            title={isCollapsed ? "Mở rộng menu" : "Thu gọn menu"}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform duration-200 ${isCollapsed ? "rotate-180" : ""}`}
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            {!isCollapsed && <span>Thu gọn Sidebar</span>}
          </button>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <aside
        className="fixed inset-y-0 left-0 z-50 w-[280px] shadow-2xl overflow-y-auto"
        style={{ background: "linear-gradient(185deg, #241D54, #191340)" }}
      >
        {sidebarContent}
      </aside>
    );
  }

  return (
    <aside
      className={`sticky top-0 hidden md:flex h-dvh shrink-0 flex-col shadow-xl overflow-y-auto transition-all duration-300 ${
        isCollapsed ? "w-[76px]" : "w-[264px]"
      }`}
      style={{ background: "linear-gradient(185deg, #241D54, #191340)" }}
    >
      {sidebarContent}
    </aside>
  );
}
