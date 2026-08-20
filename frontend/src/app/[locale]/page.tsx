"use client";

import { useTranslations } from "next-intl";

import { Link } from "@/src/i18n/navigation";
import { RedSunNav } from "@/src/components/layout/red-sun-nav";
import { UiSimulator } from "@/src/components/marketing/ui-simulator";
import { BentoFeatures } from "@/src/components/marketing/bento-features";
import { MarqueeCards } from "@/src/components/marketing/marquee-cards";
import { PricingSection } from "@/src/components/marketing/pricing-section";
import { ScrollReveal } from "@/src/components/ui/scroll-reveal";

export default function Home() {
  const t = useTranslations("marketing");
  return (
    <div className="min-h-screen bg-[#2D3B42] text-white font-sans selection:bg-[#EF4623] selection:text-white">
      {/* Top Glassmorphism Navigation */}
      <RedSunNav />

      {/* Hero Section */}
      <section id="hero" className="relative pt-36 pb-24 md:pt-44 md:pb-32 overflow-hidden bg-white text-[#2D3B42]">
        {/* Large Ambient Blur Circles */}
        <div className="absolute top-10 right-10 w-[450px] h-[450px] bg-[#EF4623]/10 rounded-full blur-[120px] pointer-events-none animate-ambient-blur" />
        <div className="absolute bottom-10 left-10 w-[450px] h-[450px] bg-[#EF4623]/10 rounded-full blur-[120px] pointer-events-none animate-ambient-blur" style={{ animationDelay: "4s" }} />

        <div className="max-w-7xl mx-auto px-6 md:px-12 text-center relative z-10 space-y-8 animate-fade-up">
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#FDF1EE] border border-[#EF4623]/20 shadow-xs">
            <span className="text-[#EF4623] text-sm">✨</span>
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#EF4623]">
              Red Sun Design System • CRM-KOC Platform 3.0
            </span>
          </div>

          {/* Headline - Instrument Serif 60px to 160px */}
          <h1
            className="text-5xl sm:text-7xl md:text-[9rem] leading-[0.9] font-normal tracking-tight text-[#2D3B42]"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            {t("hero.title")} <br />
            <span className="italic text-[#EF4623] block mt-1">{t("hero.titleAccent")}</span>
          </h1>

          {/* Subtext */}
          <p className="max-w-2xl mx-auto text-base sm:text-xl text-[#2D3B42]/70 font-sans font-medium leading-relaxed">
            {t("hero.subtitle")}
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-5 pt-4">
            {/* Primary Pill Button with shadow-2xl */}
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-9 py-4 rounded-[30px] bg-[#EF4623] text-white font-bold text-sm uppercase tracking-wider shadow-2xl shadow-[#EF4623]/35 hover:bg-[#D83B19] hover:scale-105 active:scale-95 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
            >
              {t("hero.cta")}
            </Link>

            {/* Secondary Ghost Button */}
            <a
              href="#value-prop"
              className="inline-flex items-center justify-center px-8 py-4 rounded-[30px] border-2 border-[#2D3B42]/15 text-[#2D3B42] font-extrabold text-sm uppercase tracking-wider hover:bg-[#2D3B42] hover:text-white transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
            >
              Xem Demo UI
            </a>
          </div>

          {/* Hero Metrics Strip */}
          <div className="pt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto border-t border-slate-100">
            <div>
              <span
                className="text-4xl md:text-5xl font-normal text-[#2D3B42] block"
                style={{ fontFamily: "'Instrument Serif', serif" }}
              >
                15,000+
              </span>
              <span className="text-xs font-semibold text-slate-500">{t("hero.stat1")}</span>
            </div>
            <div>
              <span
                className="text-4xl md:text-5xl font-normal text-[#EF4623] italic block"
                style={{ fontFamily: "'Instrument Serif', serif" }}
              >
                1,200+
              </span>
              <span className="text-xs font-semibold text-slate-500">{t("hero.stat2")}</span>
            </div>
            <div>
              <span
                className="text-4xl md:text-5xl font-normal text-[#2D3B42] block"
                style={{ fontFamily: "'Instrument Serif', serif" }}
              >
                $45M+
              </span>
              <span className="text-xs font-semibold text-slate-500">{t("hero.stat3")}</span>
            </div>
            <div>
              <span
                className="text-4xl md:text-5xl font-normal text-[#EF4623] italic block"
                style={{ fontFamily: "'Instrument Serif', serif" }}
              >
                99.8%
              </span>
              <span className="text-xs font-semibold text-slate-500">{t("hero.stat4")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition (Bento Section with UI Simulator) */}
      <section id="value-prop" className="py-24 bg-[#FDF1EE] text-[#2D3B42] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left: Text-heavy with large Serif H2 and vertical feature list */}
            <ScrollReveal direction="left" delay={100} className="lg:col-span-6 space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white text-[#EF4623] text-xs font-bold uppercase tracking-wider shadow-xs">
                <span>🔥 Red Sun Innovation</span>
              </div>

              <h2
                className="text-4xl sm:text-6xl font-normal tracking-tight text-[#2D3B42] leading-[1.05]"
                style={{ fontFamily: "'Instrument Serif', serif" }}
              >
                {t("experience.title")} <br />
                <span className="italic text-[#EF4623]">{t("experience.titleAccent")}</span>
              </h2>

              <p className="text-base sm:text-lg text-slate-700 font-sans leading-relaxed">
                {t("experience.subtitle")}
              </p>

              {/* Vertical Feature List using 56px rounded-2xl icon containers */}
              <div className="space-y-6">
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-[#EF4623] text-white flex items-center justify-center text-xl font-bold shrink-0 shadow-md shadow-[#EF4623]/30">
                    ⚡
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#2D3B42]">
                      {t("experience.item1Title")}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed mt-1">
                      {t("experience.item1Body")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-[#2D3B42] text-white flex items-center justify-center text-xl font-bold shrink-0 shadow-md">
                    🎯
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#2D3B42]">
                      {t("experience.item2Title")}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed mt-1">
                      {t("experience.item2Body")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-white text-[#EF4623] border border-[#EF4623]/20 flex items-center justify-center text-xl font-bold shrink-0 shadow-xs">
                    🤝
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#2D3B42]">
                      {t("experience.item3Title")}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed mt-1">
                      {t("experience.item3Body")}
                    </p>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Right: UI Simulator Component */}
            <ScrollReveal direction="right" delay={250} className="lg:col-span-6">
              <UiSimulator />
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <BentoFeatures />

      {/* Infinite Card Marquee with Alpha Mask */}
      <MarqueeCards />

      {/* Pricing & Dynamic Usage Calculator Section */}
      <PricingSection />

      {/* Call to Action Section - Solid #EF4623 64px (4rem) rounded container */}
      <section id="cta" className="py-20 px-4 sm:px-8 bg-[#2D3B42]">
        <ScrollReveal direction="rotate" delay={100}>
          <div className="max-w-7xl mx-auto bg-[#EF4623] rounded-[4rem] p-10 sm:p-16 md:p-24 relative overflow-hidden text-white shadow-2xl bg-dot-grid">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-block px-5 py-2 bg-white/15 backdrop-blur-md rounded-full text-white text-xs font-extrabold uppercase tracking-widest border border-white/20">
              {t("cta.eyebrow")}
            </div>

            <h2
              className="text-5xl sm:text-7xl md:text-8xl font-normal leading-none tracking-tight text-white"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              {t("cta.title")} <br />
              <span className="italic underline underline-offset-8 decoration-white/40">
                {t("cta.titleAccent")}
              </span>
            </h2>

            <p className="text-base sm:text-xl text-white/90 font-sans max-w-2xl mx-auto leading-relaxed">
              {t("cta.subtitle")}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-5 pt-4">
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-10 py-4 rounded-[30px] bg-white text-[#EF4623] font-extrabold text-sm uppercase tracking-wider shadow-2xl hover:bg-[#FDF1EE] hover:scale-105 active:scale-95 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
              >
                {t("cta.primary")}
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-8 py-4 rounded-[30px] border-2 border-white/40 text-white font-extrabold text-sm uppercase tracking-wider hover:bg-white hover:text-[#EF4623] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
              >
                {t("cta.secondary")}
              </Link>
            </div>

            {/* Trust-bar Footer */}
            <div className="pt-12 border-t border-white/20 text-xs uppercase tracking-widest font-bold text-white/80">
              {t("cta.trusted")}
            </div>
          </div>
        </div>
        </ScrollReveal>
      </section>

      {/* Deep Ink Footer */}
      <footer className="bg-[#1E282D] text-slate-400 py-16 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-5 gap-10">
          {/* Column 1: Logo & Socials */}
          <div className="md:col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#EF4623] rounded-lg flex items-center justify-center transform rotate-3 shadow-md shadow-[#EF4623]/30">
                <span
                  className="text-white font-bold italic text-xl select-none"
                  style={{ fontFamily: "'Instrument Serif', serif" }}
                >
                  R
                </span>
              </div>
              <span
                className="text-2xl font-bold tracking-tight text-white"
                style={{ fontFamily: "'Instrument Serif', serif" }}
              >
                RedSun <span className="text-[#EF4623] italic">CRM</span>
              </span>
            </div>

            <p className="text-sm text-slate-400 font-sans max-w-sm leading-relaxed">
              {t("footer.about")}
            </p>

            <div className="flex items-center gap-3">
              {["FB", "TT", "YT", "LI"].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="w-9 h-9 rounded-full border border-white/10 hover:border-[#EF4623] hover:text-[#EF4623] flex items-center justify-center text-xs font-bold transition-colors"
                >
                  {social}
                </a>
              ))}
            </div>
          </div>

          {/* Column 2: Product */}
          <div className="space-y-4">
            <h4
              className="text-xl font-normal text-white"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              {t("footer.product")}
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <a href="#value-prop" className="hover:text-white transition-colors">
                  AI Matching Engine
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  {t("footer.samples")}
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  {t("footer.commission")}
                </a>
              </li>
              <li>
                <a href="#value-prop" className="hover:text-white transition-colors">
                  {t("footer.contracts")}
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Portals */}
          <div className="space-y-4">
            <h4
              className="text-xl font-normal text-white"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              {t("footer.portals")}
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/login" className="hover:text-[#EF4623] transition-colors">
                  {t("footer.adminPortal")}
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-[#EF4623] transition-colors">
                  {t("footer.brandPortal")}
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-[#EF4623] transition-colors">
                  {t("footer.creatorPortal")}
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-[#EF4623] transition-colors">
                  {t("footer.allPortals")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal & Contact */}
          <div className="space-y-4">
            <h4
              className="text-xl font-normal text-white"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              {t("footer.contact")}
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>Hotline: 1900 6868</li>
              <li>Email: contact@redsun-koc.vn</li>
              <li>{t("footer.address")}</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="max-w-7xl mx-auto px-6 md:px-12 mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>© 2026 Red Sun CRM-KOC System. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-white transition-colors">
              {t("footer.terms")}
            </a>
            <a href="#" className="hover:text-white transition-colors">
              {t("footer.privacy")}
            </a>
            <a href="#" className="hover:text-white transition-colors">
              {t("footer.sitemap")}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
