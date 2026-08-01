"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface RedSunNavProps {
  activeSection?: string;
}

export function RedSunNav({ activeSection }: RedSunNavProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        scrolled
          ? "py-3 bg-white/85 dark:bg-[#2D3B42]/90 backdrop-blur-xl border-b border-[#2D3B42]/10 dark:border-white/10 shadow-lg shadow-black/5"
          : "py-6 bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
        {/* Left: Rotating Logo Brand Mark */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-9 h-9 bg-[#EF4623] rounded-lg flex items-center justify-center transform rotate-3 group-hover:rotate-12 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-md shadow-[#EF4623]/30">
            <span
              className="text-white font-bold italic text-xl select-none"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              R
            </span>
          </div>
          <div className="flex flex-col">
            <span
              className="text-xl font-bold tracking-tight text-[#2D3B42] dark:text-white"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              RedSun <span className="text-[#EF4623] italic">CRM</span>
            </span>
          </div>
        </Link>

        {/* Center: Manrope Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 font-sans">
          <a
            href="#hero"
            className="text-sm font-semibold text-[#2D3B42]/80 dark:text-white/80 hover:text-[#EF4623] dark:hover:text-[#EF4623] transition-colors"
          >
            Tổng quan
          </a>
          <a
            href="#value-prop"
            className="text-sm font-semibold text-[#2D3B42]/80 dark:text-white/80 hover:text-[#EF4623] dark:hover:text-[#EF4623] transition-colors"
          >
            Mô phỏng UI
          </a>
          <a
            href="#features"
            className="text-sm font-semibold text-[#2D3B42]/80 dark:text-white/80 hover:text-[#EF4623] dark:hover:text-[#EF4623] transition-colors"
          >
            Tính năng
          </a>
          <a
            href="#pricing"
            className="text-sm font-semibold text-[#2D3B42]/80 dark:text-white/80 hover:text-[#EF4623] dark:hover:text-[#EF4623] transition-colors"
          >
            Bảng giá
          </a>
          <a
            href="#cta"
            className="text-sm font-semibold text-[#2D3B42]/80 dark:text-white/80 hover:text-[#EF4623] dark:hover:text-[#EF4623] transition-colors"
          >
            Giải pháp KOC
          </a>
        </nav>

        {/* Right CTAs */}
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="hidden sm:inline-block text-xs font-bold uppercase tracking-wider text-[#2D3B42] dark:text-white hover:text-[#EF4623] transition-colors px-3 py-2"
          >
            Đăng nhập
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-[30px] bg-[#EF4623] text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#EF4623]/25 hover:bg-[#D83B19] hover:scale-105 active:scale-95 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
          >
            Bắt đầu ngay
          </Link>
        </div>
      </div>
    </header>
  );
}
