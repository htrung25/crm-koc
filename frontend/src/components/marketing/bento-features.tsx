"use client";

import { useTranslations } from "next-intl";

import { useState } from "react";
import { ScrollReveal } from "@/src/components/ui/scroll-reveal";

export function BentoFeatures() {
  const t = useTranslations("marketing");
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  return (
    <section id="features" className="py-24 relative overflow-hidden bg-[#2D3B42] text-white">
      {/* Background Ambient Blur */}
      <div className="absolute top-1/3 right-10 w-96 h-96 bg-[#EF4623]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-[#EF4623]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Section Header with Scroll Reveal */}
        <ScrollReveal direction="rotate" delay={0}>
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FDF1EE] text-[#EF4623] text-xs font-bold uppercase tracking-widest shadow-sm">
              <span>✨ System Capabilities</span>
            </div>
            <h2
              className="text-4xl md:text-6xl font-normal text-white tracking-tight leading-none"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              {t("features.title")} <br className="hidden sm:block" />
              <span className="italic text-[#EF4623]">{t("features.titleAccent")}</span>
            </h2>
            <p className="text-base md:text-lg text-slate-300 font-sans max-w-xl mx-auto leading-relaxed">
              {t("features.subtitle")}
            </p>
          </div>
        </ScrollReveal>

        {/* 3-Column Bento Grid with 48px (3rem) corner radius */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card Style 1 (Large): Spans 2 columns */}
          <ScrollReveal direction="rotate" delay={150} className="md:col-span-2">
          <div
            onMouseEnter={() => setHoveredCard(1)}
            onMouseLeave={() => setHoveredCard(null)}
            className="md:col-span-2 bg-white text-[#2D3B42] rounded-[3rem] p-8 md:p-12 border border-[#2D3B42]/5 shadow-2xl relative overflow-hidden group transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-2"
          >
            {/* Watermark background icon at 5% opacity */}
            <div className="absolute -right-8 -bottom-8 opacity-5 text-slate-900 pointer-events-none transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110 group-hover:rotate-6">
              <svg width="340" height="340" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>

            <div className="relative z-10 space-y-6 flex flex-col justify-between h-full">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-[#FDF1EE] text-[#EF4623] flex items-center justify-center text-2xl font-bold shadow-sm">
                  🚀
                </div>
                <div className="inline-block px-3 py-1 bg-[#FDF1EE] text-[#EF4623] text-xs font-bold rounded-full">
                  AI Matching Engine 3.0
                </div>
                <h3
                  className="text-3xl md:text-5xl font-normal text-[#2D3B42] leading-tight"
                  style={{ fontFamily: "'Instrument Serif', serif" }}
                >
                  {t("features.aiTitle")} <br />
                  <span className="italic text-[#EF4623]">{t("features.aiTitleAccent")}</span>
                </h3>
                <p className="text-slate-600 font-sans text-base leading-relaxed max-w-xl">
                  {t("features.aiBody")}
                </p>
              </div>

              <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-2xl font-extrabold text-[#2D3B42] block">
                      &gt; 98.4%
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {t("features.aiStat1")}
                    </span>
                  </div>
                  <div className="w-px h-8 bg-slate-200" />
                  <div>
                    <span className="text-2xl font-extrabold text-[#EF4623] block">
                      3.5x
                    </span>
                    <span className="text-xs text-slate-[#EF4623] font-medium">
                      {t("features.aiStat2")}
                    </span>
                  </div>
                </div>

                <button className="px-6 py-3 rounded-[30px] bg-[#2D3B42] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#EF4623] transition-colors duration-300">
                  {t("features.aiCta")}
                </button>
              </div>
            </div>
          </div>
          </ScrollReveal>

          {/* Card Style 2 (Dark) */}
          <ScrollReveal direction="rotate" delay={250}>
          <div
            onMouseEnter={() => setHoveredCard(2)}
            onMouseLeave={() => setHoveredCard(null)}
            className="bg-[#2D3B42] text-white rounded-[3rem] p-8 md:p-10 border border-white/10 shadow-2xl relative overflow-hidden group flex flex-col justify-between transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-2 hover:border-[#EF4623]/40 h-full"
          >
            {/* Ambient Coral blur in card corner */}
            <div className="absolute -top-12 -right-12 w-44 h-44 bg-[#EF4623]/20 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500" />

            <div className="relative z-10 space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-[#EF4623]/20 text-[#EF4623] border border-[#EF4623]/30 flex items-center justify-center text-2xl font-bold">
                ⚡
              </div>
              <div className="space-y-3">
                <span className="text-xs font-bold text-[#EF4623] uppercase tracking-wider block">
                  {t("features.sampleEyebrow")}
                </span>
                <h3
                  className="text-3xl font-normal text-white leading-tight"
                  style={{ fontFamily: "'Instrument Serif', serif" }}
                >
                  {t("features.sampleTitle")} <br />
                  <span className="italic text-[#EF4623]">{t("features.sampleTitleAccent")}</span>
                </h3>
                <p className="text-slate-300 font-sans text-sm leading-relaxed">
                  {t("features.sampleBody")}
                </p>
              </div>
            </div>

            <div className="relative z-10 pt-6 mt-6 border-t border-white/10">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>{t("features.sampleFoot")}</span>
                <span className="text-[#EF4623] font-bold">ViettelPost & GHN</span>
              </div>
            </div>
          </div>
          </ScrollReveal>

          {/* Card Style 3 (Standard) */}
          <ScrollReveal direction="rotate" delay={350}>
          <div
            onMouseEnter={() => setHoveredCard(3)}
            onMouseLeave={() => setHoveredCard(null)}
            className="bg-white text-[#2D3B42] rounded-[3rem] p-8 border border-[#2D3B42]/5 shadow-xl relative overflow-hidden group flex flex-col justify-between transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-2 h-full"
          >
            <div className="space-y-6">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold transition-all duration-300 ${
                  hoveredCard === 3
                    ? "bg-[#EF4623] text-white shadow-lg shadow-[#EF4623]/30"
                    : "bg-[#FDF1EE] text-[#2D3B42]"
                }`}
              >
                📊
              </div>
              <div className="space-y-3">
                <span className="text-xs font-bold text-[#EF4623] uppercase tracking-wider block">
                  {t("features.revenueEyebrow")}
                </span>
                <h3
                  className="text-3xl font-normal text-[#2D3B42] leading-tight"
                  style={{ fontFamily: "'Instrument Serif', serif" }}
                >
                  {t("features.revenueTitle")} <br />
                  <span className="italic text-[#EF4623]">Real-time Analytics</span>
                </h3>
                <p className="text-slate-600 font-sans text-sm leading-relaxed">
                  {t("features.revenueBody")}
                </p>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#2D3B42]">
              <span>{t("features.revenueFoot")}</span>
              <span className="text-[#EF4623] font-sans">{t("features.revenueCta")}</span>
            </div>
          </div>
          </ScrollReveal>

          {/* Card Style 4 (Extra Bento Item) */}
          <ScrollReveal direction="rotate" delay={450} className="md:col-span-2">
          <div
            onMouseEnter={() => setHoveredCard(4)}
            onMouseLeave={() => setHoveredCard(null)}
            className="bg-[#FDF1EE] text-[#2D3B42] rounded-[3rem] p-8 md:p-10 border border-[#EF4623]/20 shadow-xl relative overflow-hidden group flex flex-col sm:flex-row items-center justify-between gap-8 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-2"
          >
            <div className="space-y-4 max-w-md">
              <div className="inline-block px-3 py-1 bg-[#EF4623] text-white text-xs font-bold rounded-full">
                {t("features.securityEyebrow")}
              </div>
              <h3
                className="text-3xl md:text-4xl font-normal text-[#2D3B42]"
                style={{ fontFamily: "'Instrument Serif', serif" }}
              >
                {t("features.securityTitle")} <br />
                <span className="italic text-[#EF4623]">{t("features.securityTitleAccent")}</span>
              </h3>
              <p className="text-slate-700 font-sans text-sm leading-relaxed">
                {t("features.securityBody")}
              </p>
            </div>

            <div className="w-full sm:w-auto shrink-0 bg-white p-6 rounded-3xl shadow-lg border border-[#EF4623]/10 space-y-3 text-center">
              <div className="text-4xl font-bold text-[#EF4623]">{t("features.securityStat")}</div>
              <p className="text-xs font-bold text-[#2D3B42] uppercase tracking-wider">
                {t("features.securityStatLabel")}
              </p>
              <div className="text-[11px] text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full font-semibold">
                {t("features.securityLegal")}
              </div>
            </div>
          </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
