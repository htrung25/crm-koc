"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearSession } from "@/features/auth/session";

type AdminHeaderProps = {
  onSearch?: (query: string) => void;
  onOpenMobileMenu?: () => void;
};

export function AdminHeader({ onSearch, onOpenMobileMenu }: AdminHeaderProps) {
  const router = useRouter();
  const [lang, setLang] = useState<"vi" | "en">("vi");
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    clearSession();
    router.replace("/login");
    router.refresh();
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  // Keyboard and Click Outside handler for Dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const isVi = lang === "vi";

  return (
    <header className="sticky top-0 z-30 flex h-[74px] shrink-0 items-center justify-between border-b border-[#ECEBF3] bg-white px-4 md:px-8">
      {/* Left Group: Mobile Menu Button & Search Input */}
      <div className="flex items-center gap-3 w-full md:w-auto">
        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="md:hidden grid h-10 w-10 place-items-center rounded-xl border border-[#ECEBF3] bg-[#F4F4F9] text-[#1A1830] hover:bg-[#EEE9FF] transition"
          aria-label="Open mobile menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Search Input */}
        <div className="flex flex-1 md:w-[360px] max-w-full items-center gap-3 rounded-[13px] border border-[#ECEBF3] bg-[#F4F4F9] px-3.5 py-2.5 transition focus-within:border-[#6C4CF1] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#6C4CF1]/20">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#9C99B0"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3-3" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder={
              isVi
                ? "Tìm KOC, thương hiệu, chiến dịch..."
                : "Search KOCs, brands, campaigns..."
            }
            className="w-full bg-transparent text-[13.5px] text-[#1A1830] outline-none placeholder:text-[#9C99B0]"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 md:gap-4.5">
        {/* Language Switcher */}
        <div className="hidden sm:flex items-center rounded-[11px] border border-[#ECEBF3] bg-[#F4F4F9] p-[3px]">
          <button
            type="button"
            onClick={() => setLang("vi")}
            className={`rounded-[8px] px-2.5 py-1 text-xs font-bold transition ${
              isVi
                ? "bg-[#6C4CF1] text-white shadow-xs"
                : "bg-transparent text-[#9C99B0] hover:text-[#1A1830]"
            }`}
          >
            VI
          </button>
          <button
            type="button"
            onClick={() => setLang("en")}
            className={`rounded-[8px] px-2.5 py-1 text-xs font-bold transition ${
              !isVi
                ? "bg-[#6C4CF1] text-white shadow-xs"
                : "bg-transparent text-[#9C99B0] hover:text-[#1A1830]"
            }`}
          >
            EN
          </button>
        </div>

        {/* Notification Button */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative grid h-[42px] w-[42px] place-items-center rounded-[12px] border border-[#ECEBF3] bg-[#F4F4F9] transition hover:bg-[#EEE9FF] focus-visible:ring-2 focus-visible:ring-[#6C4CF1]"
        >
          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#4A4762"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.7 21a2 2 0 0 1-3.4 0" />
          </svg>
          <span className="absolute top-[9px] right-[10px] h-[8px] w-[8px] rounded-full border-2 border-[#F4F4F9] bg-[#FF5C8A]" />
        </button>

        <div className="hidden sm:block h-[30px] w-px bg-[#ECEBF3]" />

        {/* User Account Dropdown Container */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-haspopup="true"
            className="flex items-center gap-2.5 rounded-[13px] p-[5px_8px_5px_5px] transition hover:bg-[#F4F4F9] focus-visible:ring-2 focus-visible:ring-[#6C4CF1]"
          >
            <div
              className="grid h-10 w-10 place-items-center rounded-[12px] text-white font-bold text-[15px]"
              style={{
                background: "linear-gradient(135deg,#6C4CF1,#9B6CF5)"
              }}
            >
              MA
            </div>
            <div className="text-left hidden lg:block">
              <div className="font-bold text-[13.5px] leading-tight text-[#1A1830]">
                {isVi ? "Nguyễn Minh Anh" : "Minh Anh Nguyen"}
              </div>
              <div className="font-medium text-[11.5px] text-[#9C99B0]">
                {isVi ? "Quản trị viên" : "Administrator"}
              </div>
            </div>
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#9C99B0"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          {/* User Menu Popup */}
          {menuOpen && (
            <div className="absolute right-0 top-[56px] w-[210px] rounded-[15px] border border-[#ECEBF3] bg-white p-[8px] shadow-[0_18px_45px_rgba(20,18,48,.16)] animate-in fade-in zoom-in-95 duration-150 z-50">
              <div className="border-b border-[#F0EFF6] px-3 pt-2 pb-3 mb-1.5">
                <div className="font-bold text-[13.5px] text-[#1A1830]">
                  {isVi ? "Nguyễn Minh Anh" : "Minh Anh Nguyen"}
                </div>
                <div className="text-[11.5px] text-[#9C99B0]">
                  admin@crm-koc.vn
                </div>
              </div>
              <Link
                href="/admin/profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-[13px] font-semibold text-[#4A4762] hover:bg-[#F4F4F9]"
              >
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21a8 8 0 0 1 16 0" />
                </svg>
                {isVi ? "Hồ sơ" : "Profile"}
              </Link>
              <Link
                href="/admin/settings"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-[13px] font-semibold text-[#4A4762] hover:bg-[#F4F4F9]"
              >
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 6.6 19l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1-2.7H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 5 6.6l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 2.7-1H10a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1 2.7" />
                </svg>
                {isVi ? "Cài đặt" : "Settings"}
              </Link>
              <div className="my-1.5 h-px bg-[#F0EFF6]" />
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-[13px] font-semibold text-[#E02424] hover:bg-[#FDECEC]"
              >
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <path d="M16 17l5-5-5-5" />
                  <path d="M21 12H9" />
                </svg>
                {isVi ? "Đăng xuất" : "Log out"}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
