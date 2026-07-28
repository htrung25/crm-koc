import { MOCK_KOCS, MOCK_BRANDS, KOCItem, BrandItem } from "./mock";
import { formatFollowers, formatCurrency } from "./utils/format";

export * from "./mock";
export * from "./utils/format";

// Alias mappings for existing page references
export const MOCK_KOCS_EXACT = MOCK_KOCS.map((item) => ({
  ...item,
  n: item.name,
  h: item.handle,
  f: item.followers,
  followersFmt: formatFollowers(item.followers),
  e: item.engagementRate,
  engagement: `${item.engagementRate}%`,
  c: item.category,
  s: item.status,
  cam: item.campaignCount,
  rev: item.revenue,
  revenueFmt: formatCurrency(item.revenue),
  plats: item.platforms,
  platforms: item.platforms.map((p) => ({
    name: p,
    style:
      p === "TikTok"
        ? "bg-[#111] text-white"
        : p === "Instagram"
          ? "bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white"
          : "bg-[#FF0000] text-white",
  })),
}));

export const MOCK_BRANDS_EXACT = MOCK_BRANDS.map((b) => ({
  ...b,
  n: b.name,
  c: b.category,
  cam: b.campaignCount,
  koc: b.kocCount,
  s: b.status,
}));

export const kocDataList = MOCK_KOCS_EXACT;
export const brandDataList = MOCK_BRANDS_EXACT;

export const MOCK_KOC_HISTORY_EXACT = [
  {
    nameVi: "Môi xinh đón hè 2026",
    nameEn: "Summer Lips 2026",
    brand: "Sunplay Vietnam",
    period: "01/05 - 30/06/2026",
    rev: "₫240M",
    s: "active",
    statusLabelVi: "Đang chạy",
    statusLabelEn: "Running"
  },
  {
    nameVi: "Sunscreen Review Spree",
    nameEn: "Sunscreen Review Spree",
    brand: "Sunplay Vietnam",
    period: "15/03 - 15/04/2026",
    rev: "₫180M",
    s: "paused",
    statusLabelVi: "Đã hoàn thành",
    statusLabelEn: "Completed"
  }
];

export type KOCData = (typeof MOCK_KOCS_EXACT)[number];
export type BrandData = (typeof MOCK_BRANDS_EXACT)[number];
