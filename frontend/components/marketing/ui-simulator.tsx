"use client";

import { useTranslations } from "next-intl";

import { useState } from "react";

export function UiSimulator() {
  const t = useTranslations("marketing");
  const [activeTab, setActiveTab] = useState<"campaigns" | "koc_analytics" | "automations">("campaigns");
  const [isSimulating, setIsSimulating] = useState(false);

  const triggerSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => setIsSimulating(false), 1200);
  };

  return (
    <div className="relative group w-full max-w-xl mx-auto">
      {/* Ambient background glow */}
      <div className="absolute -inset-4 bg-[#EF4623]/20 rounded-[48px] blur-2xl group-hover:bg-[#EF4623]/30 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]" />

      {/* Main Container - Deep Ink #2D3B42 with 40px radius */}
      <div className="relative bg-[#2D3B42] p-5 sm:p-7 rounded-[40px] shadow-2xl border border-white/10 overflow-hidden text-slate-800">
        {/* Inner White Container - rounded-3xl */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-inner space-y-5">
          {/* Top Browser Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            {/* 3 Colored Dots */}
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#EF4623]" />
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
            </div>

            {/* Skeleton Address Bar */}
            <div className="flex-1 mx-4 max-w-xs bg-slate-100 rounded-full px-4 py-1 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="truncate">https://app.redsun-koc.vn/dashboard</span>
              <span className="text-emerald-500 font-bold">🔒 LIVE</span>
            </div>

            <button
              onClick={triggerSimulation}
              className="text-[11px] font-bold px-3 py-1 bg-[#FDF1EE] text-[#EF4623] hover:bg-[#EF4623] hover:text-white rounded-full transition-colors duration-300"
            >
              {isSimulating ? "Syncing..." : "Run AI Sync"}
            </button>
          </div>

          {/* Tab Selector inside UI Simulator */}
          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab("campaigns")}
              className={`flex-1 py-1.5 rounded-xl transition-all ${
                activeTab === "campaigns"
                  ? "bg-white text-[#2D3B42] shadow-sm font-bold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {t("simulator.campaign")}
            </button>
            <button
              onClick={() => setActiveTab("koc_analytics")}
              className={`flex-1 py-1.5 rounded-xl transition-all ${
                activeTab === "koc_analytics"
                  ? "bg-[#2D3B42] text-white shadow-sm font-bold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Creator Index
            </button>
            <button
              onClick={() => setActiveTab("automations")}
              className={`flex-1 py-1.5 rounded-xl transition-all ${
                activeTab === "automations"
                  ? "bg-white text-[#2D3B42] shadow-sm font-bold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {t("simulator.automation")}
            </button>
          </div>

          {/* Section 1: Thin Skeleton Header / Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#FDF1EE] p-3 rounded-2xl border border-[#EF4623]/20">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">
                Doanh thu GMV
              </span>
              <span className="text-sm font-extrabold text-[#2D3B42]">
                {t("simulator.revenue")}
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
                {t("simulator.revenueDelta")}
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">
                KOC Tham gia
              </span>
              <span className="text-sm font-extrabold text-[#2D3B42]">
                184 Creators
              </span>
              <span className="text-[10px] text-[#EF4623] font-semibold block mt-0.5">
                🔥 12 TikTok Live
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">
                {t("simulator.conversion")}
              </span>
              <span className="text-sm font-extrabold text-[#2D3B42]">
                4.85%
              </span>
              <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                {t("simulator.benchmark")}
              </span>
            </div>
          </div>

          {/* Section 2: 2-Column Grid (Peach block + Grey block) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Peach Block (#FDF1EE) */}
            <div className="bg-[#FDF1EE] p-4 rounded-2xl border border-[#EF4623]/20 space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#2D3B42]">
                  Top KOC Performance
                </span>
                <span className="w-2 h-2 rounded-full bg-[#EF4623] animate-ping" />
              </div>
              <div className="space-y-2">
                <div className="bg-white p-2.5 rounded-xl shadow-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#EF4623] text-white flex items-center justify-center font-bold text-xs">
                      A
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#2D3B42]">
                        {t("simulator.sampleKoc")}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        TikTok 850K Followers
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-[#EF4623]">
                    340M
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-xl shadow-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#2D3B42] text-white flex items-center justify-center font-bold text-xs">
                      M
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#2D3B42]">
                        Minh Review Tech
                      </p>
                      <p className="text-[10px] text-slate-400">
                        YouTube 420K Subs
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-[#2D3B42]">
                    210M
                  </span>
                </div>
              </div>
            </div>

            {/* Grey Block */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#2D3B42]">
                  {t("simulator.approvalTitle")}
                </span>
                <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded-full font-bold text-slate-600">
                  {t("simulator.approvalAuto")}
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-100">
                  <span className="text-slate-600 font-medium">{t("simulator.step1")}</span>
                  <span className="text-emerald-600 font-bold">{t("simulator.step1Status")}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-100">
                  <span className="text-slate-600 font-medium">{t("simulator.step2")}</span>
                  <span className="text-[#EF4623] font-bold">{t("simulator.step2Status")}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-100">
                  <span className="text-slate-600 font-medium">{t("simulator.step3")}</span>
                  <span className="text-slate-400 font-medium">{t("simulator.step3Status")}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Bottom Text / Data Stream Block */}
          <div className="bg-slate-900 rounded-2xl p-3.5 text-white font-mono text-[11px] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[#EF4623] font-bold">&gt;&gt;</span>
              <span className="text-slate-300 truncate">
                AI Agent matched 32 high-converting Beauty KOCs for Q3 Launch
              </span>
            </div>
            <span className="text-emerald-400 text-[10px] bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800 shrink-0">
              99.4% Fit
            </span>
          </div>
        </div>

        {/* Footer: Glassmorphism status bar with green check-circle & code tags */}
        <div className="mt-4 pt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-white/80 border-t border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
              ✓
            </div>
            <span className="font-semibold text-white">System Status: Code & Match Engine Operational</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-black/40 text-slate-300 font-mono text-[11px] px-2.5 py-1 rounded-lg border border-white/10">
              koc_ai_v3.ts
            </span>
            <span className="bg-black/40 text-[#EF4623] font-mono text-[11px] px-2.5 py-1 rounded-lg border border-white/10 font-bold">
              status: #ACTIVE
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
