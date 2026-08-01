/** Dữ liệu mock cho dashboard quản trị. Thay bằng API thật khi backend sẵn sàng. */

export type StatMetric = {
  id: string;
  label: string;
  value: string;
  delta: number;
  icon: "wallet" | "users" | "trend" | "target";
  accent: string;
  spark: number[];
};

export const DASHBOARD_STATS: StatMetric[] = [
  {
    id: "gmv",
    label: "Doanh số Affiliate",
    value: "2,14 tỷ",
    delta: 12.4,
    icon: "wallet",
    accent: "#EF4623",
    spark: [18, 22, 19, 27, 24, 31, 29, 36, 34, 42, 45, 52],
  },
  {
    id: "kocs",
    label: "KOC đang hoạt động",
    value: "1.284",
    delta: 8.2,
    icon: "users",
    accent: "#F49E4C",
    spark: [30, 28, 33, 31, 36, 34, 39, 41, 38, 44, 47, 49],
  },
  {
    id: "conversion",
    label: "Tỉ lệ chốt đơn",
    value: "3,94%",
    delta: -0.6,
    icon: "trend",
    accent: "#E97680",
    spark: [42, 44, 41, 45, 43, 40, 42, 39, 41, 38, 37, 36],
  },
  {
    id: "aov",
    label: "Giá trị đơn trung bình",
    value: "428K",
    delta: 4.1,
    icon: "target",
    accent: "#2D3B42",
    spark: [24, 26, 25, 29, 28, 31, 30, 33, 35, 34, 38, 40],
  },
];

/** 12 tháng doanh thu (tỉ VNĐ) — năm nay và năm ngoái để so sánh. */
export const REVENUE_SERIES = {
  months: ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"],
  thisYear: [82, 94, 88, 112, 126, 118, 141, 156, 148, 172, 189, 214],
  lastYear: [64, 71, 69, 78, 86, 92, 88, 101, 108, 112, 124, 131],
};

export type TrafficSlice = {
  label: string;
  percent: number;
  color: string;
};

export const TRAFFIC_SOURCES: TrafficSlice[] = [
  { label: "TikTok Shop", percent: 48, color: "#EF4623" },
  { label: "Facebook", percent: 27, color: "#F49E4C" },
  { label: "Instagram", percent: 15, color: "#E97680" },
  { label: "Website", percent: 10, color: "#C8A98F" },
];

export const TRAFFIC_TOTAL = "48,2K";

export type TransactionStatus = "completed" | "processing" | "pending";

export type Transaction = {
  id: string;
  name: string;
  email: string;
  initials: string;
  campaign: string;
  date: string;
  status: TransactionStatus;
  amount: string;
};

export const RECENT_TRANSACTIONS: Transaction[] = [
  {
    id: "tx-01",
    name: "Trần Mai Anh",
    email: "maianh.beauty@gmail.com",
    initials: "MA",
    campaign: "Summer Glow",
    date: "01/08/2026",
    status: "completed",
    amount: "12.400.000",
  },
  {
    id: "tx-02",
    name: "Nguyễn Hoàng Long",
    email: "longnh.review@gmail.com",
    initials: "HL",
    campaign: "Tech Unbox",
    date: "31/07/2026",
    status: "processing",
    amount: "8.750.000",
  },
  {
    id: "tx-03",
    name: "Phạm Thu Trang",
    email: "trangpham.style@gmail.com",
    initials: "TT",
    campaign: "Back to School",
    date: "30/07/2026",
    status: "completed",
    amount: "15.200.000",
  },
  {
    id: "tx-04",
    name: "Lê Quốc Bảo",
    email: "baolq.fitness@gmail.com",
    initials: "QB",
    campaign: "Healthy Living",
    date: "29/07/2026",
    status: "pending",
    amount: "4.900.000",
  },
  {
    id: "tx-05",
    name: "Vũ Khánh Linh",
    email: "linhvk.home@gmail.com",
    initials: "KL",
    campaign: "Home Refresh",
    date: "28/07/2026",
    status: "completed",
    amount: "9.630.000",
  },
  {
    id: "tx-06",
    name: "Đỗ Minh Khoa",
    email: "khoadm.gaming@gmail.com",
    initials: "MK",
    campaign: "Gaming Gear",
    date: "27/07/2026",
    status: "processing",
    amount: "6.180.000",
  },
];

export const MONTHLY_GOAL = {
  percent: 78,
  current: "2,14 tỷ",
  target: "2,75 tỷ",
  breakdown: [
    { label: "KOC tuyển mới", percent: 85 },
    { label: "Doanh thu mở rộng", percent: 62 },
    { label: "Tỉ lệ giữ chân", percent: 94 },
  ],
};
