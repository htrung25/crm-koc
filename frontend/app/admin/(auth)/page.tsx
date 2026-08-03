"use client";

import { useState } from "react";
import { useLogin } from "@/features/auth/use-login";

const HIGHLIGHTS = [
  "Theo dõi hiệu suất & doanh thu KOC theo thời gian thực",
  "Duyệt hợp đồng, hoa hồng và chiến dịch của Thương hiệu",
  "Báo cáo vận hành toàn hệ thống trong một bảng điều khiển",
];

export default function AdminLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const {
    step,
    email,
    setEmail,
    password,
    setPassword,
    otp,
    setOtp,
    error,
    notice,
    isSubmitting,
    submitCredentials,
    verifyOtp,
    resendOtp,
    backToCredentials,
  } = useLogin("ADMIN");

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#2D3B42] font-sans selection:bg-[#EF4623] selection:text-white">
      <main className="relative flex-1 flex items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
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
                Cổng vận hành dành riêng cho đội ngũ nội bộ. Đăng nhập quản trị
                có thêm bước xác thực OTP gửi qua email.
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
                    {step === "credentials"
                      ? "Cổng quản trị nội bộ"
                      : "Xác thực hai lớp"}
                  </span>
                  <h2 className="font-serif text-3xl font-normal text-[#2D3B42]">
                    {step === "credentials" ? "Đăng nhập Admin" : "Nhập mã OTP"}
                  </h2>
                </div>
                <span className="font-serif text-4xl leading-none text-[#EF4623]/30 select-none tabular-nums">
                  {step === "credentials" ? "01" : "02"}
                </span>
              </div>

              {notice && (
                <p className="text-xs font-semibold text-[#2D3B42] bg-[#FDF1EE] border border-[#EF4623]/20 rounded-xl px-4 py-3">
                  {notice}
                </p>
              )}

              {error && (
                <p
                  role="alert"
                  className="text-xs font-semibold text-[#EF4623] bg-[#FDF1EE] border border-[#EF4623]/30 rounded-xl px-4 py-3"
                >
                  {error}
                </p>
              )}

              {step === "credentials" ? (
                <form onSubmit={submitCredentials} className="space-y-5">
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

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-6 rounded-[30px] bg-[#EF4623] hover:bg-[#D83B19] text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-[#EF4623]/30 hover:scale-[1.02] active:scale-95 transition-all duration-300 disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Đang kiểm tra…" : "Tiếp tục →"}
                  </button>
                </form>
              ) : (
                <form onSubmit={verifyOtp} className="space-y-5">
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Mã gồm 6 chữ số đã được gửi tới{" "}
                    <span className="font-bold text-[#2D3B42]">{email}</span>.
                  </p>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="admin-otp"
                      className="block text-[11px] font-bold uppercase tracking-wider text-slate-600"
                    >
                      Mã xác thực
                    </label>
                    <input
                      id="admin-otp"
                      name="otp"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      required
                      pattern="\d{6}"
                      maxLength={6}
                      autoFocus
                      value={otp}
                      onChange={(e) =>
                        setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      placeholder="000000"
                      className="w-full px-4 py-3 rounded-2xl bg-[#FDF1EE]/50 focus:bg-white border border-[#2D3B42]/15 text-[#2D3B42] text-center text-2xl font-bold tracking-[0.5em] tabular-nums placeholder:text-slate-300 placeholder:tracking-[0.5em] focus:outline-none focus:border-[#EF4623] focus:ring-4 focus:ring-[#EF4623]/20 transition-all duration-300"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || otp.length !== 6}
                    className="w-full py-3.5 px-6 rounded-[30px] bg-[#EF4623] hover:bg-[#D83B19] text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-[#EF4623]/30 hover:scale-[1.02] active:scale-95 transition-all duration-300 disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Đang xác thực…" : "Vào bảng điều khiển →"}
                  </button>

                  <div className="flex items-center justify-between gap-3 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={backToCredentials}
                      className="text-slate-500 hover:text-[#2D3B42] transition-colors"
                    >
                      ← Đổi tài khoản
                    </button>
                    <button
                      type="button"
                      onClick={resendOtp}
                      disabled={isSubmitting}
                      className="text-[#EF4623] hover:underline disabled:opacity-50 disabled:no-underline"
                    >
                      Gửi lại mã
                    </button>
                  </div>
                </form>
              )}

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
