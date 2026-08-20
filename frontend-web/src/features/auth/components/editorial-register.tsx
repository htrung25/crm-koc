"use client";

import { APP_ROUTES } from "@/constants/routes";
import { useTranslations } from "next-intl";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { RedSunNav } from "@/components/layout/red-sun-nav";

export function EditorialRegister() {
  const t = useTranslations("auth.register");
  const [accountType, setAccountType] = useState<"CREATOR" | "BRAND">("CREATOR");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t("passwordMismatch"));
      return;
    }

    if (password.length < 6) {
      setError(t("passwordTooShort"));
      return;
    }

    if (!agreedTerms) {
      setError(t("mustAgree"));
      return;
    }

    setIsSubmitting(true);

    // Giả lập gửi form đăng ký UI
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccess(true);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#2D3B42] font-sans selection:bg-[#EF4623] selection:text-white">
      {/* Shared Universal Header */}
      <RedSunNav tone="light" />

      {/* Main Container: canh giữa theo cả 2 trục */}
      <main className="relative flex-1 flex items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-8 pt-28 pb-12 lg:pt-32 lg:pb-16">
        {/* Ambient Blur Circles — cùng ngôn ngữ nền với hero trang chủ & trang login */}
        <div className="absolute top-10 right-10 w-[450px] h-[450px] bg-[#EF4623]/10 rounded-full blur-[120px] pointer-events-none animate-ambient-blur" />
        <div
          className="absolute bottom-10 left-10 w-[450px] h-[450px] bg-[#EF4623]/10 rounded-full blur-[120px] pointer-events-none animate-ambient-blur"
          style={{ animationDelay: "4s" }}
        />

        <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 rounded-[28px] lg:rounded-[36px] overflow-hidden border border-[#2D3B42]/10 shadow-2xl shadow-[#2D3B42]/15 bg-white">

          {/* Left Editorial Greeting Panel (mobile: order-2, desktop: order-1) */}
          <div className="order-2 lg:order-1 relative bg-[#FDF1EE] text-[#2D3B42] p-8 sm:p-10 lg:p-12 flex flex-col justify-between gap-8 lg:gap-10 border-t lg:border-t-0 lg:border-r border-[#EF4623]/20">
            {/* Soft Coral Radial Glow Background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(239,70,35,0.15),transparent_65%)] pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(239,70,35,0.1),transparent_60%)] pointer-events-none" />

            <div className="relative z-10 space-y-6">
              {/* Kicker */}
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EF4623]" />
                <span className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#EF4623]">
                  Join Red Sun Network
                </span>
              </div>

              {/* Eyebrow & Giant Serif Headline */}
              <div className="space-y-4 max-w-[34ch]">
                <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-[#2D3B42]/55">
                  Vol. 06 · Red Sun 2026 Edition
                </span>

                <h1 className="font-serif font-normal tracking-tight leading-[0.95] text-[clamp(2.75rem,6vw,4rem)] text-[#2D3B42]">
                  Start your <span className="block italic text-[#EF4623]">journey.</span>
                </h1>

                <p className="text-sm sm:text-base text-slate-700 leading-relaxed max-w-[42ch]">
                  {t("heroSubtitle")}
                </p>
              </div>

              {/* Feature Highlights Grid */}
              <div className="pt-2 space-y-3">
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/70 backdrop-blur-sm border border-[#EF4623]/15 shadow-sm">
                  <div className="w-8 h-8 rounded-xl bg-[#EF4623]/10 text-[#EF4623] flex items-center justify-center shrink-0 font-bold text-sm">
                    ✨
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#2D3B42]">{t("feature1Title")}</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">{t("feature1Body")}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/70 backdrop-blur-sm border border-[#EF4623]/15 shadow-sm">
                  <div className="w-8 h-8 rounded-xl bg-[#EF4623]/10 text-[#EF4623] flex items-center justify-center shrink-0 font-bold text-sm">
                    ⚡
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#2D3B42]">{t("feature2Title")}</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">{t("feature2Body")}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/70 backdrop-blur-sm border border-[#EF4623]/15 shadow-sm">
                  <div className="w-8 h-8 rounded-xl bg-[#EF4623]/10 text-[#EF4623] flex items-center justify-center shrink-0 font-bold text-sm">
                    🛡️
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#2D3B42]">{t("feature3Title")}</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">{t("feature3Body")}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonial / Social proof */}
            <figure className="relative z-10 space-y-3 pt-6 border-t border-[#EF4623]/20">
              <blockquote className="relative pl-5 font-serif italic text-xs sm:text-sm leading-relaxed text-[#2D3B42]">
                <span className="absolute left-0 top-0 text-2xl text-[#EF4623] leading-none select-none">
                  “
                </span>
                {t("heroQuote")}
              </blockquote>

              <figcaption className="flex items-center gap-3">
                <div className="w-8 h-8 shrink-0 rounded-full bg-[#EF4623] text-white flex items-center justify-center font-bold text-xs shadow-md">
                  K
                </div>
                <div className="leading-tight">
                  <span className="block text-xs font-extrabold text-[#2D3B42]">
                    Kenji Nguyen
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Top Fashion KOC (850k+ Followers)
                  </span>
                </div>
              </figcaption>
            </figure>
          </div>

          {/* Right Registration Form (mobile: order-1, desktop: order-2) */}
          <div className="order-1 lg:order-2 relative bg-white text-[#2D3B42] p-8 sm:p-10 lg:p-12 flex items-center justify-center">
            {/* Ambient blur in background */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#EF4623]/8 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 w-full max-w-[420px] space-y-5">
              {/* Header Row: Title & Index Numeral '01' */}
              <div className="flex items-start justify-between gap-4 border-b border-[#2D3B42]/10 pb-4">
                <div>
                  <span className="block mb-1 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#EF4623]">
                    {t("eyebrow")}
                  </span>
                  <h2 className="font-serif text-3xl font-normal text-[#2D3B42]">
                    {t("title")}
                  </h2>
                </div>

                <span className="font-serif text-4xl leading-none text-[#EF4623]/30 select-none tabular-nums">
                  01
                </span>
              </div>

              {/* Role Switcher Tabs */}
              <div className="p-1.5 rounded-2xl bg-[#FDF1EE] border border-[#EF4623]/20 grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => setAccountType("CREATOR")}
                  className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all duration-300 flex items-center justify-center gap-1.5 ${
                    accountType === "CREATOR"
                      ? "bg-white text-[#EF4623] shadow-md shadow-[#EF4623]/10"
                      : "text-slate-600 hover:text-[#2D3B42]"
                  }`}
                >
                  <span>✨</span> KOC / Creator
                </button>
                <button
                  type="button"
                  onClick={() => setAccountType("BRAND")}
                  className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all duration-300 flex items-center justify-center gap-1.5 ${
                    accountType === "BRAND"
                      ? "bg-white text-[#EF4623] shadow-md shadow-[#EF4623]/10"
                      : "text-slate-600 hover:text-[#2D3B42]"
                  }`}
                >
                  <span>🏢</span> {t("brand")}
                </button>
              </div>

              {/* Success Message */}
              {success ? (
                <div className="bg-[#FDF1EE] border border-[#EF4623]/30 rounded-2xl p-6 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-[#EF4623] text-white flex items-center justify-center text-xl mx-auto shadow-lg shadow-[#EF4623]/30">
                    ✓
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-serif text-2xl font-normal text-[#2D3B42]">{t("successTitle")}</h3>
                    <p className="text-xs text-slate-600">
                      {t.rich("successBody", {
                        email,
                        strong: (chunks) => (
                          <span className="font-bold text-[#EF4623]">{chunks}</span>
                        ),
                      })}
                    </p>
                  </div>
                  <Link
                    href={APP_ROUTES.login}
                    className="inline-block w-full py-3.5 px-6 rounded-[30px] bg-[#EF4623] hover:bg-[#D83B19] text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-[#EF4623]/30 transition-all duration-300"
                  >
                    {t("signInNow")}
                  </Link>
                </div>
              ) : (
                <>
                  {/* SSO Buttons */}
                  <div className="space-y-2">
                    {/* Google SSO Button */}
                    <button
                      type="button"
                      className="w-full py-3 px-4 rounded-full bg-white hover:bg-[#FDF1EE] border border-[#2D3B42]/15 text-[#2D3B42] font-bold text-xs flex items-center justify-center gap-3 transition-all duration-300 shadow-md hover:scale-[1.01] active:scale-[0.98]"
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

                    {/* TikTok SSO Button (Chỉ hiển thị khi chọn role KOC / Creator) */}
                    {accountType === "CREATOR" && (
                      <button
                        type="button"
                        className="group relative w-full py-3 px-4 rounded-full bg-[#111111] hover:bg-[#FE2C55] text-white font-bold text-xs flex items-center justify-center gap-3 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-md hover:shadow-lg hover:shadow-[#FE2C55]/30 hover:scale-[1.02] active:scale-95"
                      >
                        <svg className="w-4 h-4 shrink-0 fill-current group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.85.12V9.33a6.33 6.33 0 0 0-1-.08 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V9.05a8.3 8.3 0 0 0 4.94 1.6V7.21a4.84 4.84 0 0 1-1.01-.52z"/>
                        </svg>
                        {t("tiktok")}
                      </button>
                    )}
                  </div>

                  {/* Or Divider */}
                  <div className="flex items-center gap-3">
                    <div className="h-px bg-[#2D3B42]/10 flex-1" />
                    <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-bold">
                      {t("orFillIn")}
                    </span>
                    <div className="h-px bg-[#2D3B42]/10 flex-1" />
                  </div>

                  {error && (
                    <p
                      role="alert"
                      className="text-xs font-semibold text-[#EF4623] bg-[#FDF1EE] border border-[#EF4623]/30 rounded-xl px-4 py-2.5"
                    >
                      {error}
                    </p>
                  )}

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-3.5">
                    {/* Full Name */}
                    <div className="space-y-1">
                      <label
                        htmlFor="register-fullname"
                        className="block text-[11px] font-bold uppercase tracking-wider text-slate-600"
                      >
                        {t("fullName")}
                      </label>
                      <input
                        id="register-fullname"
                        name="fullName"
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder={t("fullNamePlaceholder")}
                        className="w-full px-4 py-2.5 rounded-2xl bg-[#FDF1EE]/50 focus:bg-white border border-[#2D3B42]/15 text-[#2D3B42] text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#EF4623] focus:ring-4 focus:ring-[#EF4623]/20 transition-all duration-300"
                      />
                    </div>

                    {/* Email & Phone grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label
                          htmlFor="register-email"
                          className="block text-[11px] font-bold uppercase tracking-wider text-slate-600"
                        >
                          Email
                        </label>
                        <input
                          id="register-email"
                          name="email"
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@example.com"
                          className="w-full px-4 py-2.5 rounded-2xl bg-[#FDF1EE]/50 focus:bg-white border border-[#2D3B42]/15 text-[#2D3B42] text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#EF4623] focus:ring-4 focus:ring-[#EF4623]/20 transition-all duration-300"
                        />
                      </div>

                      <div className="space-y-1">
                        <label
                          htmlFor="register-phone"
                          className="block text-[11px] font-bold uppercase tracking-wider text-slate-600"
                        >
                          {t("phone")}
                        </label>
                        <input
                          id="register-phone"
                          name="phone"
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="0987 654 321"
                          className="w-full px-4 py-2.5 rounded-2xl bg-[#FDF1EE]/50 focus:bg-white border border-[#2D3B42]/15 text-[#2D3B42] text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#EF4623] focus:ring-4 focus:ring-[#EF4623]/20 transition-all duration-300"
                        />
                      </div>
                    </div>

                    {/* Password & Confirm Password grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Password */}
                      <div className="space-y-1">
                        <label
                          htmlFor="register-password"
                          className="block text-[11px] font-bold uppercase tracking-wider text-slate-600"
                        >
                          {t("password")}
                        </label>
                        <div className="relative">
                          <input
                            id="register-password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full px-4 py-2.5 pr-12 rounded-2xl bg-[#FDF1EE]/50 focus:bg-white border border-[#2D3B42]/15 text-[#2D3B42] text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#EF4623] focus:ring-4 focus:ring-[#EF4623]/20 transition-all duration-300"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#2D3B42] text-xs font-semibold px-1 py-0.5"
                          >
                            {showPassword ? t("hide") : t("show")}
                          </button>
                        </div>
                      </div>

                      {/* Confirm Password */}
                      <div className="space-y-1">
                        <label
                          htmlFor="register-confirm-password"
                          className="block text-[11px] font-bold uppercase tracking-wider text-slate-600"
                        >
                          {t("confirmPassword")}
                        </label>
                        <div className="relative">
                          <input
                            id="register-confirm-password"
                            name="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full px-4 py-2.5 pr-12 rounded-2xl bg-[#FDF1EE]/50 focus:bg-white border border-[#2D3B42]/15 text-[#2D3B42] text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#EF4623] focus:ring-4 focus:ring-[#EF4623]/20 transition-all duration-300"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#2D3B42] text-xs font-semibold px-1 py-0.5"
                          >
                            {showConfirmPassword ? t("hide") : t("show")}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Terms agreement checkbox */}
                    <label
                      htmlFor="agree-terms"
                      className="flex items-start gap-2.5 cursor-pointer select-none pt-0.5"
                    >
                      <input
                        id="agree-terms"
                        type="checkbox"
                        checked={agreedTerms}
                        onChange={(e) => setAgreedTerms(e.target.checked)}
                        className="peer sr-only"
                      />
                      <span
                        aria-hidden="true"
                        className={`w-[18px] h-[18px] shrink-0 mt-0.5 rounded-[6px] border flex items-center justify-center transition-colors peer-focus-visible:ring-4 peer-focus-visible:ring-[#EF4623]/30 ${
                          agreedTerms
                            ? "bg-[#EF4623] border-[#EF4623]"
                            : "bg-white border-[#2D3B42]/25"
                        }`}
                      >
                        <svg
                          viewBox="0 0 16 16"
                          className={`w-3 h-3 text-white transition-opacity ${
                            agreedTerms ? "opacity-100" : "opacity-0"
                          }`}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3.5 8.5 6.5 11.5 12.5 4.5" />
                        </svg>
                      </span>
                      <span className="text-xs text-slate-600 leading-snug">
                        {t("agreePrefix")}{" "}
                        <a href="#" className="text-[#EF4623] font-bold hover:underline">
                          {t("terms")}
                        </a>{" "}
                        {t("agreeMiddle")}{" "}
                        <a href="#" className="text-[#EF4623] font-bold hover:underline">
                          {t("privacy")}
                        </a>
                      </span>
                    </label>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 px-6 rounded-[30px] bg-[#EF4623] hover:bg-[#D83B19] text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-[#EF4623]/30 hover:scale-[1.02] active:scale-95 transition-all duration-300 disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed mt-1"
                    >
                      {isSubmitting ? t("creating") : t("createAccount")}
                    </button>
                  </form>
                </>
              )}

              {/* Login link */}
              <div className="pt-3 border-t border-[#2D3B42]/10 text-center">
                <p className="text-xs text-slate-500">
                  {t("haveAccount")}{" "}
                  <Link href={APP_ROUTES.login} className="text-[#EF4623] font-bold hover:underline">
                    {t("signIn")}
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
