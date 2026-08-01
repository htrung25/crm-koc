"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createDemoSession } from "@/features/auth/session";
import { ROLE_HOME } from "@/features/auth/types";
import { RedSunNav } from "@/components/layout/red-sun-nav";

const HIGHLIGHTS = [
  "Theo dõi hiệu suất & doanh thu KOC theo thời gian thực",
  "Duyệt hợp đồng, hoa hồng và chiến dịch của Thương hiệu",
  "Báo cáo vận hành toàn hệ thống trong một bảng điều khiển",
];

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@gmail.com");
  const [password, setPassword] = useState("admin@123");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      createDemoSession("ADMIN");
      router.replace(ROLE_HOME.ADMIN);
      router.refresh();
    } catch {
      setError("Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#2D3B42] font-sans selection:bg-[#EF4623] selection:text-white">
      <RedSunNav />

      <main className="relative flex-1 flex items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-8 pt-28 pb-12 lg:pt-32 lg:pb-16">
        {/* Ambient Blur Circles — cùng ngôn ngữ nền với hero trang chủ */}
        <div className="absolute top-10 right-10 w-[450px] h-[450px] bg-[#EF4623]/10 rounded-full blur-[120px] pointer-events-none animate-ambient-blur" />
        <div
          className="absolute bottom-10 left-10 w-[450px] h-[450px] bg-[#EF4623]/10 rounded-full blur-[120px] pointer-events-none animate-ambient-blur"
          style={{ animationDelay: "4s" }}
        />

        <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] rounded-[28px] lg:rounded-[36px] overflow-hidden border border-[#2D3B42]/10 shadow-2xl shadow-[#2D3B42]/15 bg-white">

          {/* Panel giới thiệu nội bộ */}
          <div className="order-2 lg:order-1 relative bg-[#2D3B42] text-white p-8 sm:p-10 lg:p-12 flex flex-col justify-center gap-8">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(239,70,35,0.28),transparent_65%)] pointer-events-none" />

            <div className="relative z-10 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EF4623]" />
              <span className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#EF4623]">
                Khu vực quản trị
              </span>
            </div>

            <div className="relative z-10 space-y-4">
              <h1 className="font-serif font-normal tracking-tight leading-[1.05] text-[clamp(2.25rem,4.5vw,3.25rem)]">
                Bảng điều khiển
                <span className="block italic text-[#EF4623]">RedSun Admin.</span>
              </h1>
              <p className="text-sm text-white/70 leading-relaxed max-w-[40ch]">
                Cổng vận hành dành riêng cho đội ngũ nội bộ. Vui lòng đăng nhập bằng tài khoản quản trị đã được cấp.
              </p>
            </div>

            <ul className="relative z-10 space-y-3.5">
              {HIGHLIGHTS.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-white/85">
                  <span className="mt-0.5 w-5 h-5 shrink-0 rounded-full bg-[#EF4623]/20 text-[#EF4623] flex items-center justify-center text-[11px] font-bold">
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Form đăng nhập */}
          <div className="order-1 lg:order-2 bg-white p-8 sm:p-10 lg:p-12 flex items-center justify-center">
            <div className="w-full max-w-[400px] space-y-6">
              <div className="flex items-start justify-between gap-4 border-b border-[#2D3B42]/10 pb-5">
                <div>
                  <span className="block mb-1 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#EF4623]">
                    Cổng quản trị nội bộ
                  </span>
                  <h2 className="font-serif text-3xl font-normal text-[#2D3B42]">
                    Đăng nhập Admin
                  </h2>
                </div>
                <span className="font-serif text-4xl leading-none text-[#EF4623]/30 select-none tabular-nums">
                  A
                </span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label
                    htmlFor="admin-email"
                    className="block text-[11px] font-bold uppercase tracking-wider text-slate-600"
                  >
                    Email quản trị
                  </label>
                  <input
                    id="admin-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@company.com"
                    className="w-full px-4 py-3 rounded-2xl bg-[#FDF1EE]/50 focus:bg-white border border-[#2D3B42]/15 text-[#2D3B42] text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#EF4623] focus:ring-4 focus:ring-[#EF4623]/20 transition-all duration-300"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="admin-password"
                    className="block text-[11px] font-bold uppercase tracking-wider text-slate-600"
                  >
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <input
                      id="admin-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 pr-14 rounded-2xl bg-[#FDF1EE]/50 focus:bg-white border border-[#2D3B42]/15 text-[#2D3B42] text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#EF4623] focus:ring-4 focus:ring-[#EF4623]/20 transition-all duration-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#2D3B42] text-xs font-semibold px-1.5 py-1 rounded-md transition-colors"
                    >
                      {showPassword ? "Ẩn" : "Hiện"}
                    </button>
                  </div>
                </div>

                <label
                  htmlFor="admin-remember"
                  className="flex items-center gap-3 cursor-pointer select-none w-fit"
                >
                  <input
                    id="admin-remember"
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className={`w-[18px] h-[18px] shrink-0 rounded-[6px] border flex items-center justify-center transition-colors peer-focus-visible:ring-4 peer-focus-visible:ring-[#EF4623]/30 ${remember
                        ? "bg-[#EF4623] border-[#EF4623]"
                        : "bg-white border-[#2D3B42]/25"
                      }`}
                  >
                    <svg
                      viewBox="0 0 16 16"
                      className={`w-3 h-3 text-white transition-opacity ${remember ? "opacity-100" : "opacity-0"}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3.5 8.5 6.5 11.5 12.5 4.5" />
                    </svg>
                  </span>
                  <span className="text-xs text-slate-600 font-medium">
                    Duy trì phiên quản trị trong 30 ngày
                  </span>
                </label>

                {error && (
                  <p
                    role="alert"
                    className="text-xs font-semibold text-[#EF4623] bg-[#FDF1EE] border border-[#EF4623]/20 rounded-xl px-4 py-3"
                  >
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 rounded-[30px] bg-[#EF4623] hover:bg-[#D83B19] text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-[#EF4623]/30 hover:scale-[1.02] active:scale-95 transition-all duration-300 disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Đang đăng nhập…" : "Vào bảng điều khiển →"}
                </button>
              </form>

              <p className="pt-5 border-t border-[#2D3B42]/10 text-center text-xs text-slate-500">
                Tài khoản quản trị do hệ thống cấp. Cần hỗ trợ? Liên hệ đội vận hành RedSun.
              </p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
