"use client";

import { useTranslations } from "next-intl";

interface CardData {
  id: string;
  name: string;
  tag: string;
  platform: string;
  avatarColor: string;
  theme: "dark" | "peach" | "white" | "coral";
}

const marqueeCardsRow1: CardData[] = [
  {
    id: "1",
    name: "An Nhiên Beauty",
    tag: "🔥 Hot Creator",
    platform: "TikTok Shop",
    avatarColor: "bg-[#EF4623]",
    theme: "coral"
  },
  {
    id: "2",
    name: "Coolmate Official",
    tag: "🏢 Brand Partner",
    platform: "Shopee Affiliate",
    avatarColor: "bg-[#2D3B42]",
    theme: "peach"
  },
  {
    id: "3",
    name: "Minh Tech Review",
    tag: "⚡ Tech Creator",
    platform: "YouTube Shorts",
    avatarColor: "bg-amber-500",
    theme: "dark"
  },
  {
    id: "4",
    name: "Lemonade Cosmetics",
    tag: "✨ Premium Brand",
    platform: "Multi-Platform",
    avatarColor: "bg-[#EF4623]",
    theme: "white"
  }
];

const marqueeCardsRow2: CardData[] = [
  {
    id: "5",
    name: "Hà Linh Skincare",
    tag: "👑 Top Star",
    platform: "TikTok Live",
    avatarColor: "bg-[#2D3B42]",
    theme: "dark"
  },
  {
    id: "6",
    name: "Sunhouse Appliances",
    tag: "🏆 Enterprise Brand",
    platform: "Omnichannel",
    avatarColor: "bg-[#EF4623]",
    theme: "peach"
  },
  {
    id: "7",
    name: "Quỳnh Anh Lifestyle",
    tag: "💖 Verified KOC",
    platform: "Facebook Reels",
    avatarColor: "bg-emerald-500",
    theme: "white"
  },
  {
    id: "8",
    name: "Baseus Vietnam",
    tag: "🚀 Tech Partner",
    platform: "Shopee & TikTok",
    avatarColor: "bg-[#2D3B42]",
    theme: "coral"
  }
];

export function MarqueeCards() {
  const t = useTranslations("marketing");
  // Duplicate arrays to create continuous infinite marquee loop
  const row1Duplicated = [...marqueeCardsRow1, ...marqueeCardsRow1, ...marqueeCardsRow1];
  const row2Duplicated = [...marqueeCardsRow2, ...marqueeCardsRow2, ...marqueeCardsRow2];

  const getThemeClasses = (theme: CardData["theme"]) => {
    switch (theme) {
      case "coral":
        return "bg-[#EF4623] text-white border-white/20 shadow-2xl shadow-[#EF4623]/30";
      case "dark":
        return "bg-[#2D3B42] text-white border-white/10 shadow-2xl shadow-black/30";
      case "peach":
        return "bg-[#FDF1EE] text-[#2D3B42] border-[#EF4623]/20 shadow-xl";
      case "white":
      default:
        return "bg-white text-[#2D3B42] border-slate-100 shadow-xl";
    }
  };

  return (
    <section className="py-20 bg-[#1E282D] relative overflow-hidden">
      {/* Background Section Header */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 text-center space-y-4 mb-14">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#EF4623]/15 text-[#EF4623] text-xs font-bold uppercase tracking-widest border border-[#EF4623]/30">
          <span>🔄 Infinite Stream</span>
        </div>
        <h2
          className="text-4xl md:text-6xl font-normal text-white tracking-tight"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          {t("social.title")} <br />
          <span className="italic text-[#EF4623]">{t("social.titleAccent")}</span>
        </h2>
        <p className="text-sm md:text-base text-slate-300 max-w-xl mx-auto font-sans">
          {t("social.subtitle")}
        </p>
      </div>

      {/* Marquee Wrapper with ALPHA MASK GRADIENT at left/right edges */}
      <div className="relative w-full overflow-hidden alpha-mask-horizontal space-y-8 py-4">
        {/* Row 1: Slow Left Scroll */}
        <div className="animate-marquee flex gap-6 items-center">
          {row1Duplicated.map((card, idx) => (
            <div
              key={`row1-${card.id}-${idx}`}
              className={`w-[360px] sm:w-[400px] shrink-0 rounded-[30px] p-6 sm:p-7 border transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.03] ${getThemeClasses(
                card.theme
              )}`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-black/10 dark:bg-white/10">
                  {card.tag}
                </span>
                <span className="text-xs font-mono font-bold opacity-80">
                  {card.platform}
                </span>
              </div>

              <blockquote className="text-sm sm:text-base font-medium leading-relaxed mb-6 italic opacity-95">
                &ldquo;{t(`testimonials.${card.id}.quote`)}&rdquo;
              </blockquote>

              <div className="pt-4 border-t border-current/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full ${card.avatarColor} text-white flex items-center justify-center font-bold text-sm shadow-md`}
                  >
                    {card.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold leading-tight">{card.name}</h4>
                    <p className="text-[11px] opacity-75">{t(`testimonials.${card.id}.role`)}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className="text-xl font-normal block leading-none"
                    style={{ fontFamily: "'Instrument Serif', serif" }}
                  >
                    {t(`testimonials.${card.id}.stats`)}
                  </span>
                  <span className="text-[10px] uppercase font-bold opacity-70">
                    {t(`testimonials.${card.id}.statsLabel`)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Row 2: Slow Right Scroll (Marquee Reverse) */}
        <div className="animate-marquee-reverse flex gap-6 items-center">
          {row2Duplicated.map((card, idx) => (
            <div
              key={`row2-${card.id}-${idx}`}
              className={`w-[360px] sm:w-[400px] shrink-0 rounded-[30px] p-6 sm:p-7 border transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.03] ${getThemeClasses(
                card.theme
              )}`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-black/10 dark:bg-white/10">
                  {card.tag}
                </span>
                <span className="text-xs font-mono font-bold opacity-80">
                  {card.platform}
                </span>
              </div>

              <blockquote className="text-sm sm:text-base font-medium leading-relaxed mb-6 italic opacity-95">
                &ldquo;{t(`testimonials.${card.id}.quote`)}&rdquo;
              </blockquote>

              <div className="pt-4 border-t border-current/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full ${card.avatarColor} text-white flex items-center justify-center font-bold text-sm shadow-md`}
                  >
                    {card.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold leading-tight">{card.name}</h4>
                    <p className="text-[11px] opacity-75">{t(`testimonials.${card.id}.role`)}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className="text-xl font-normal block leading-none"
                    style={{ fontFamily: "'Instrument Serif', serif" }}
                  >
                    {t(`testimonials.${card.id}.stats`)}
                  </span>
                  <span className="text-[10px] uppercase font-bold opacity-70">
                    {t(`testimonials.${card.id}.statsLabel`)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
