"use client";

import { APP_ROUTES } from "@/constants/routes";
import { useTranslations } from "next-intl";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { RedSunNav } from "@/components/layout/red-sun-nav";
import { useLogin } from "@/features/auth/hooks/use-login";

export function EditorialLogin() {
  const t = useTranslations("auth.login");
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
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
  } = useLogin();

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#2D3B42] font-sans selection:bg-[#EF4623] selection:text-white">
      {/* Shared Universal Header (tone sáng, giống trang chủ) */}
      <RedSunNav />

      {/* Main: canh giữa theo cả 2 trục, chừa chỗ cho fixed header (h ~84px) */}
      <main className="relative flex-1 flex items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-8 pt-28 pb-12 lg:pt-32 lg:pb-16">
        {/* Ambient Blur Circles — cùng ngôn ngữ nền với hero trang chủ */}
        <div className="absolute top-10 right-10 w-[450px] h-[450px] bg-[#EF4623]/10 rounded-full blur-[120px] pointer-events-none animate-ambient-blur" />
        <div
          className="absolute bottom-10 left-10 w-[450px] h-[450px] bg-[#EF4623]/10 rounded-full blur-[120px] pointer-events-none animate-ambient-blur"
          style={{ animationDelay: "4s" }}
        />

        <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 rounded-[28px] lg:rounded-[36px] overflow-hidden border border-[#2D3B42]/10 shadow-2xl shadow-[#2D3B42]/15 bg-white">

          {/* Left Editorial Greeting Panel (mobile: order-2, desktop: order-1) */}
          <div className="order-2 lg:order-1 relative bg-[#FDF1EE] text-[#2D3B42] p-8 sm:p-10 lg:p-12 flex flex-col justify-center gap-8 lg:gap-10 border-t lg:border-t-0 lg:border-r border-[#EF4623]/20">
            {/* Soft Coral Radial Glow Background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(239,70,35,0.15),transparent_65%)] pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(239,70,35,0.1),transparent_60%)] pointer-events-none" />

            {/* Kicker */}
            <div className="relative z-10 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EF4623]" />
              <span className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#EF4623]">
                The KOC Design Platform
              </span>
            </div>

            {/* Eyebrow & Giant Serif Headline */}
            <div className="relative z-10 space-y-4 max-w-[34ch]">
              <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-[#2D3B42]/55">
                Vol. 06 · Red Sun 2026 Edition
              </span>

              <h1 className="font-serif font-normal tracking-tight leading-[0.95] text-[clamp(2.75rem,6vw,4rem)] text-[#2D3B42]">
                Welcome
                <span className="block italic text-[#EF4623]">back.</span>
              </h1>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed max-w-[42ch]">
                {t("heroSubtitle")}
              </p>
            </div>

            {/* Blockquote & Figcaption */}
            <figure className="relative z-10 space-y-4 pt-6 border-t border-[#EF4623]/20">
              <blockquote className="relative pl-6 font-serif italic text-sm sm:text-base leading-relaxed text-[#2D3B42]">
                <span className="absolute left-0 top-0 text-3xl text-[#EF4623] leading-none select-none">
                  “
                </span>
                {t("heroQuote")}
              </blockquote>

              <figcaption className="flex items-center gap-3">
                <div className="w-9 h-9 shrink-0 rounded-full bg-[#EF4623] text-white flex items-center justify-center font-bold text-sm shadow-md">
                  M
                </div>
                <div className="leading-tight">
                  <span className="block text-xs font-extrabold text-[#2D3B42]">
                    Mara Velez
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Product Director, Northbound Studio
                  </span>
                </div>
              </figcaption>
            </figure>
          </div>

          {/* Right Sign-In Form (mobile: order-1, desktop: order-2) */}
          <div className="order-1 lg:order-2 relative bg-white text-[#2D3B42] p-8 sm:p-10 lg:p-12 flex items-center justify-center">
            {/* Ambient blur in background */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#EF4623]/8 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 w-full max-w-[400px] space-y-6">
              {/* Header Row: Title & Index Numeral '01' */}
              <div className="flex items-start justify-between gap-4 border-b border-[#2D3B42]/10 pb-5">
                <div>
                  <span className="block mb-1 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#EF4623]">
                    {step === "credentials"
                      ? t("eyebrowCredentials")
                      : t("eyebrowOtp")}
                  </span>
                  <h2 className="font-serif text-3xl font-normal text-[#2D3B42]">
                    {step === "credentials" ? t("titleCredentials") : t("titleOtp")}
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

              {/* Google SSO Button */}
              {step === "credentials" && (
              <button
                type="button"
                className="w-full py-3.5 px-4 rounded-full bg-white hover:bg-[#FDF1EE] border border-[#2D3B42]/15 text-[#2D3B42] font-bold text-xs flex items-center justify-center gap-3 transition-all duration-300 shadow-md active:scale-[0.98]"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                {t("google")}
              </button>
              )}

              {/* Or with Email Divider */}
              {step === "credentials" && (
              <div className="flex items-center gap-3">
                <div className="h-px bg-[#2D3B42]/10 flex-1" />
                <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-bold">
                  {t("orEmail")}
                </span>
                <div className="h-px bg-[#2D3B42]/10 flex-1" />
              </div>
              )}

              {/* Form Input Fields */}
              {step === "credentials" ? (
              <form onSubmit={submitCredentials} className="space-y-5">
                {/* Email Field */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="login-email"
                    className="block text-[11px] font-bold uppercase tracking-wider text-slate-600"
                  >
                    {t("email")}
                  </label>
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full px-4 py-3 rounded-2xl bg-[#FDF1EE]/50 focus:bg-white border border-[#2D3B42]/15 text-[#2D3B42] text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#EF4623] focus:ring-4 focus:ring-[#EF4623]/20 transition-all duration-300"
                  />
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <label
                      htmlFor="login-password"
                      className="block text-[11px] font-bold uppercase tracking-wider text-slate-600"
                    >
                      {t("password")}
                    </label>
                    <Link
                      href={APP_ROUTES.forgotPassword}
                      className="text-xs font-semibold text-[#EF4623] hover:underline"
                    >
                      {t("forgot")}
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      id="login-password"
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
                      aria-label={showPassword ? t("hidePassword") : t("showPassword")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#2D3B42] text-xs font-semibold px-1.5 py-1 rounded-md transition-colors"
                    >
                      {showPassword ? t("hide") : t("show")}
                    </button>
                  </div>
                </div>

                {/* Keep signed in */}
                <label
                  htmlFor="keep-signed-in"
                  className="flex items-center gap-3 cursor-pointer select-none w-fit"
                >
                  <input
                    id="keep-signed-in"
                    type="checkbox"
                    checked={keepSignedIn}
                    onChange={(e) => setKeepSignedIn(e.target.checked)}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className={`w-[18px] h-[18px] shrink-0 rounded-[6px] border flex items-center justify-center transition-colors peer-focus-visible:ring-4 peer-focus-visible:ring-[#EF4623]/30 ${keepSignedIn
                        ? "bg-[#EF4623] border-[#EF4623]"
                        : "bg-white border-[#2D3B42]/25"
                      }`}
                  >
                    <svg
                      viewBox="0 0 16 16"
                      className={`w-3 h-3 text-white transition-opacity ${keepSignedIn ? "opacity-100" : "opacity-0"}`}
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
                    {t("remember")}
                  </span>
                </label>

                {/* Primary Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 rounded-[30px] bg-[#EF4623] hover:bg-[#D83B19] text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-[#EF4623]/30 hover:scale-[1.02] active:scale-95 transition-all duration-300 disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? t("checking") : t("signIn")}
                </button>
              </form>
              ) : (
              <form onSubmit={verifyOtp} className="space-y-5">
                <p className="text-xs text-slate-500 leading-relaxed">
                  {t.rich("otpSent", {
                    email,
                    strong: (chunks) => (
                      <span className="font-bold text-[#2D3B42]">{chunks}</span>
                    ),
                  })}
                </p>

                <div className="space-y-1.5">
                  <label
                    htmlFor="login-otp"
                    className="block text-[11px] font-bold uppercase tracking-wider text-slate-600"
                  >
                    {t("verificationCode")}
                  </label>
                  <input
                    id="login-otp"
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
                  {isSubmitting ? t("verifying") : t("verifyAndSignIn")}
                </button>

                <div className="flex items-center justify-between gap-3 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={backToCredentials}
                    className="text-slate-500 hover:text-[#2D3B42] transition-colors"
                  >
                    {t("changeAccount")}
                  </button>
                  <button
                    type="button"
                    onClick={resendOtp}
                    disabled={isSubmitting}
                    className="text-[#EF4623] hover:underline disabled:opacity-50 disabled:no-underline"
                  >
                    {t("resend")}
                  </button>
                </div>
              </form>
              )}

              {/* Đăng ký */}
              <div className="pt-5 border-t border-[#2D3B42]/10 text-center">
                <p className="text-xs text-slate-500">
                  {t("noAccount")}{" "}
                  <Link href={APP_ROUTES.register} className="text-[#EF4623] font-bold hover:underline">
                    {t("registerNow")}
                  </Link>
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
