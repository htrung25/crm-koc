import type { LeaderboardKOC } from "./types";

export interface BarData {
  label: string;
  val: string;
  h: number;
  fill: string;
}

export interface CategoryDistItem {
  labelVi: string;
  labelEn: string;
  pct: number;
  color: string;
}

export interface ActivityItem {
  vi: string;
  en: string;
  tvi: string;
  ten: string;
  color: string;
}

export const MOCK_BARS_EXACT: BarData[] = [
  { label: "T2", val: "320M", h: 40, fill: "linear-gradient(180deg,#6C4CF1,#9B6CF5)" },
  { label: "T3", val: "540M", h: 65, fill: "linear-gradient(180deg,#6C4CF1,#9B6CF5)" },
  { label: "T4", val: "480M", h: 58, fill: "linear-gradient(180deg,#6C4CF1,#9B6CF5)" },
  { label: "T5", val: "720M", h: 85, fill: "linear-gradient(180deg,#6C4CF1,#9B6CF5)" },
  { label: "T6", val: "610M", h: 72, fill: "linear-gradient(180deg,#6C4CF1,#9B6CF5)" },
  { label: "T7", val: "890M", h: 100, fill: "linear-gradient(180deg,#FF5C8A,#FF9A6C)" }
];

export const MOCK_LEADERBOARD_EXACT: LeaderboardKOC[] = [
  { rank: 1, name: "Đặng Hoàng Nam", handle: "@nam_foodaholic", initials: "HN", avatarBg: "from-[#FFB020] to-[#FF7A59]", revenue: 890, pct: 15.2 },
  { rank: 2, name: "Trần Minh Quân", handle: "@quan_techreview", initials: "MQ", avatarBg: "from-[#6C4CF1] to-[#9B6CF5]", revenue: 620, pct: 12.4 },
  { rank: 3, name: "Lê Hà Phương", handle: "@phuongle_beauty", initials: "HP", avatarBg: "from-[#FF5C8A] to-[#FF9A6C]", revenue: 480, pct: 8.9 }
];

export const MOCK_ACTIVITIES_EXACT: ActivityItem[] = [
  { vi: "KOC Lê Hà Phương vừa nộp video nháp cho chiến dịch Môi xinh đón hè", en: "KOC Le Ha Phuong submitted draft video", tvi: "5 phút trước", ten: "5 mins ago", color: "#6C4CF1" },
  { vi: "Thương hiệu Anker phê duyệt hợp đồng ₫280M với KOC Trần Minh Quân", en: "Brand Anker approved contract", tvi: "24 phút trước", ten: "24 mins ago", color: "#10B981" },
  { vi: "Chiến dịch BST Hè Năng Động đạt mốc 1M lượt xem trên TikTok", en: "Campaign reached 1M views", tvi: "1 giờ trước", ten: "1 hour ago", color: "#FF5C8A" }
];

export const MOCK_CATEGORY_DIST_EXACT: CategoryDistItem[] = [
  { labelVi: "Làm đẹp & Skincare", labelEn: "Beauty & Skincare", pct: 38, color: "#6C4CF1" },
  { labelVi: "Công nghệ & Setup", labelEn: "Tech & Gadgets", pct: 26, color: "#FF5C8A" },
  { labelVi: "Thời trang & MixMatch", labelEn: "Fashion & Style", pct: 20, color: "#16D3B0" },
  { labelVi: "Ẩm thực & Review", labelEn: "Food & Dining", pct: 16, color: "#FFB020" }
];
