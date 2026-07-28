"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [lang, setLang] = useState<"vi" | "en">("vi");
  const [email, setEmail] = useState("admin@gmail.com");
  const [password, setPassword] = useState("admin@123");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isVi = lang === "vi";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrPhone: email, password }),
      });
      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(
          result.message ||
          (isVi ? "Đăng nhập không thành công" : "Unable to sign in"),
        );
      }

      router.replace("/admin/dashboard");
      router.refresh();
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : isVi
            ? "Đã xảy ra lỗi khi đăng nhập"
            : "An unexpected sign-in error occurred",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const features = isVi
    ? [
      "Tự động hóa theo dõi hiệu suất và doanh thu KOC",
      "Quản lý hợp đồng, hoa hồng & phê duyệt thương hiệu",
      "Báo cáo phân tích thời gian thực chuẩn xác"
    ]
    : [
      "Automated tracking of KOC performance & revenue",
      "Contract, commission & brand approval management",
      "Real-time analytics and accurate reporting"
    ];

  return (
    <div className="flex min-h-screen font-sans bg-white text-[#1A1830]">
      {/* Left Visual & Hero Panel */}
      <section
        className="hidden lg:flex flex-[1.05] relative overflow-hidden flex-col justify-between p-12 text-white"
        style={{
          background:
            "linear-gradient(150deg, #3A2B9E 0%, #6C4CF1 48%, #B45BE8 100%)"
        }}
      >
        {/* Glow circles */}
        <div
          className="absolute w-[420px] h-[420px] rounded-full -top-[120px] -right-[80px] blur-md animate-pulse"
          style={{
            background:
              "radial-gradient(circle, rgba(255,92,138,.55), transparent 68%)"
          }}
        />
        <div
          className="absolute w-[360px] h-[360px] rounded-full -bottom-[110px] -left-[70px] blur-md animate-pulse"
          style={{
            background:
              "radial-gradient(circle, rgba(22,211,176,.42), transparent 68%)"
          }}
        />

        {/* Top Logo */}
        <div className="relative flex items-center gap-3.5 z-10">
          <div className="grid h-[46px] w-[46px] place-items-center rounded-[14px] bg-white/16 backdrop-blur-md border border-white/25 font-extrabold font-mono text-[22px]">
            K
          </div>
          <div>
            <div className="font-extrabold text-[17px] tracking-tight text-white leading-tight font-mono">
              CRM-KOC
            </div>
            <div className="text-[11.5px] font-semibold text-white/70">
              {isVi ? "Nền tảng quản lý KOC" : "KOC Management Platform"}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative max-w-[460px] my-auto z-10">
          <h1 className="text-[38px] leading-[1.15] font-extrabold tracking-tight text-balance text-white">
            {isVi
              ? "Quản lý KOC & chiến dịch, tất cả trong một nơi."
              : "Manage KOCs & campaigns, all in one place."}
          </h1>

          <div className="flex flex-col gap-3.5 mt-8">
            {features.map((feat, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 text-[15px] font-medium text-white/95"
              >
                <span className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-[8px] bg-white/16 backdrop-blur-sm">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
                <span>{feat}</span>
              </div>
            ))}
          </div>

          {/* Floating Stat Card */}
          <div className="mt-9 bg-white/12 backdrop-blur-md border border-white/20 rounded-[18px] p-[20px_22px] max-w-[320px] shadow-2xl">
            <div className="text-[12.5px] font-semibold text-white/75">
              {isVi ? "Doanh thu tháng này" : "Revenue this month"}
            </div>
            <div className="flex items-baseline gap-2.5 mt-1.5 font-mono">
              <span className="text-[30px] font-bold text-white">
                4.2 {isVi ? "tỷ" : "B"} ₫
              </span>
              <span className="bg-[#16D3B0]/28 text-[#B9FBEB] text-[12px] font-bold px-2 py-0.5 rounded-[8px]">
                ↑ 12.4%
              </span>
            </div>
            <div className="flex items-center mt-3.5">
              <div className="w-[30px] h-[30px] rounded-[9px] bg-gradient-to-br from-[#FF5C8A] to-[#FF9A6C] border-2 border-[#6C4CF1]" />
              <div className="-ml-2.5 w-[30px] h-[30px] rounded-[9px] bg-gradient-to-br from-[#16D3B0] to-[#3BC9F5] border-2 border-[#6C4CF1]" />
              <div className="-ml-2.5 w-[30px] h-[30px] rounded-[9px] bg-gradient-to-br from-[#FFB020] to-[#FF7A59] border-2 border-[#6C4CF1]" />
              <span className="text-[12.5px] font-semibold text-white/85 ml-2.5">
                {isVi ? "248 KOC đang hợp tác" : "248 partnered KOCs"}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative text-[12.5px] text-white/60 z-10">
          © 2026 CRM-KOC. {isVi ? "Bảo lưu mọi quyền." : "All rights reserved."}
        </div>
      </section>

      {/* Right Login Form Section */}
      <section className="flex-1 flex flex-col p-8 lg:p-[32px_40px] bg-white">
        {/* Language Switcher */}
        <div className="flex justify-end">
          <div className="flex bg-[#F4F4F9] border border-[#ECEBF3] rounded-[11px] p-[3px]">
            <button
              type="button"
              onClick={() => setLang("vi")}
              className={`text-xs font-bold px-3 py-1.5 rounded-[8px] transition ${isVi
                ? "bg-[#6C4CF1] text-white shadow-xs"
                : "bg-transparent text-[#9C99B0] hover:text-[#1A1830]"
                }`}
            >
              VI
            </button>
            <button
              type="button"
              onClick={() => setLang("en")}
              className={`text-xs font-bold px-3 py-1.5 rounded-[8px] transition ${!isVi
                ? "bg-[#6C4CF1] text-white shadow-xs"
                : "bg-transparent text-[#9C99B0] hover:text-[#1A1830]"
                }`}
            >
              EN
            </button>
          </div>
        </div>

        {/* Main Form Box */}
        <div className="flex-1 flex flex-col justify-center max-w-[400px] w-full mx-auto my-auto">
          {/* Badge Pill */}
          <span className="inline-flex items-center gap-2 self-start bg-[#EEE9FF] text-[#4A2FD6] text-[12px] font-bold px-3 py-1.5 rounded-full mb-5">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="4" y="11" width="16" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            <span>{isVi ? "Khu vực quản trị" : "Admin Portal"}</span>
          </span>

          <h2 className="text-[28px] font-extrabold tracking-[-0.6px] text-[#1A1830]">
            {isVi ? "Chào mừng trở lại" : "Welcome back"}
          </h2>
          <p className="text-[#9C99B0] text-[14.5px] mt-1.5 font-medium">
            {isVi
              ? "Đăng nhập vào bảng điều khiển quản trị CRM-KOC."
              : "Sign in to your CRM-KOC admin dashboard."}
          </p>

          <form onSubmit={handleLogin} className="flex flex-col gap-4.5 mt-7">
            {/* Email Field */}
            <label className="flex flex-col gap-2">
              <span className="text-[13px] font-bold text-[#3A3852]">
                Email
              </span>
              <span className="flex items-center gap-3 bg-[#F7F7FB] border-[1.5px] border-[#ECEBF3] rounded-[13px] px-3.5 py-3 transition-all focus-within:border-[#6C4CF1] focus-within:bg-white">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#9C99B0"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="5" width="18" height="14" rx="2.5" />
                  <path d="m3 7 9 6 9-6" />
                </svg>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder=""
                  className="bg-transparent text-[14px] w-full text-[#1A1830] outline-none placeholder:text-[#9C99B0]"
                />
              </span>
            </label>

            {/* Password Field */}
            <label className="flex flex-col gap-2">
              <span className="text-[13px] font-bold text-[#3A3852]">
                {isVi ? "Mật khẩu" : "Password"}
              </span>
              <span className="flex items-center gap-3 bg-[#F7F7FB] border-[1.5px] border-[#ECEBF3] rounded-[13px] px-3.5 py-3 transition-all focus-within:border-[#6C4CF1] focus-within:bg-white">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#9C99B0"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="4" y="11" width="16" height="10" rx="2" />
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                </svg>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-transparent text-[14px] w-full text-[#1A1830] outline-none placeholder:text-[#9C99B0]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="grid place-items-center text-[#9C99B0] hover:text-[#6C4CF1] transition"
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
                  >
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </span>
            </label>

            {/* Remember & Forgot Password */}
            <div className="flex items-center justify-between text-[13.5px]">
              <button
                type="button"
                onClick={() => setRemember(!remember)}
                className="flex items-center gap-2.5 font-semibold text-[#4A4762]"
              >
                <span
                  className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition ${remember
                    ? "bg-[#6C4CF1] border-[#6C4CF1] text-white"
                    : "border-[#ECEBF3] bg-[#F7F7FB]"
                    }`}
                >
                  {remember && (
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#fff"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </span>
                <span>{isVi ? "Ghi nhớ đăng nhập" : "Remember me"}</span>
              </button>
              <a
                href="#"
                className="font-bold text-[#6C4CF1] hover:underline"
              >
                {isVi ? "Quên mật khẩu?" : "Forgot password?"}
              </a>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-[11px] border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] font-semibold text-red-600"
              >
                {error}
              </p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#6C4CF1] to-[#9B6CF5] text-white font-bold text-[15px] p-3.5 rounded-[14px] shadow-[0_12px_26px_rgba(108,76,241,.34)] hover:opacity-93 hover:-translate-y-0.5 transition duration-150 mt-1 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              <span>
                {isSubmitting
                  ? isVi
                    ? "Đang đăng nhập..."
                    : "Signing in..."
                  : isVi
                    ? "Đăng nhập"
                    : "Sign in"}
              </span>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14" />
                <path d="m13 6 6 6-6 6" />
              </svg>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 text-[#B0AEC0] text-[12.5px] font-semibold my-1">
              <span className="flex-1 h-px bg-[#ECEBF3]" />
              <span>{isVi ? "HOẶC" : "OR"}</span>
              <span className="flex-1 h-px bg-[#ECEBF3]" />
            </div>

            {/* Enterprise SSO Button */}
            <button
              type="button"
              className="flex items-center justify-center gap-2.5 bg-white border-[1.5px] border-[#ECEBF3] text-[#3A3852] font-bold text-[14px] p-3 rounded-[13px] hover:bg-[#FAFAFD] hover:border-[#DAD8E8] transition"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#6C4CF1"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2a10 10 0 1 0 10 10" />
                <path d="M12 8v4l3 2" />
              </svg>
              <span>
                {isVi
                  ? "Đăng nhập bằng SSO Doanh nghiệp"
                  : "Sign in with Enterprise SSO"}
              </span>
            </button>
          </form>

          {/* Footer Support Link */}
          <p className="text-center text-[13.5px] text-[#9C99B0] mt-6 font-medium">
            {isVi ? "Chưa có tài khoản quản trị? " : "Need an admin account? "}
            <a href="#" className="font-bold text-[#6C4CF1] hover:underline">
              {isVi ? "Liên hệ Hỗ trợ" : "Contact Support"}
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
