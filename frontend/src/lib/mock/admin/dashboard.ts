import type { DashboardData } from "@/src/components/dashboard/types";

/**
 * Dữ liệu dashboard của workspace ADMIN.
 *
 * Mỗi workspace có một file tương tự (brand/, creator/) cùng trả về
 * `DashboardData`, nên trang dashboard và các khối hiển thị dùng chung được.
 * Khi backend sẵn sàng, thay hằng này bằng lời gọi API — kiểu dữ liệu giữ
 * nguyên nên không component nào phải sửa.
 */
const stats: DashboardData["stats"] = [
  {
    id: "gmv",
    label: "Doanh số campaign",
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
    label: "ROI",
    value: "3,94%",
    delta: -0.6,
    icon: "trend",
    accent: "#E97680",
    spark: [42, 44, 41, 45, 43, 40, 42, 39, 41, 38, 37, 36],
  },
  {
    id: "aov",
    label: "Giá trị campaign trung bình",
    value: "428K",
    delta: 4.1,
    icon: "target",
    accent: "#2D3B42",
    spark: [24, 26, 25, 29, 28, 31, 30, 33, 35, 34, 38, 40],
  },
];

/** 12 tháng doanh thu (tỉ VNĐ) — năm nay và năm ngoái để so sánh. */
const revenue: DashboardData["revenue"] = {
  months: [
    "T1",
    "T2",
    "T3",
    "T4",
    "T5",
    "T6",
    "T7",
    "T8",
    "T9",
    "T10",
    "T11",
    "T12",
  ],
  thisYear: [82, 94, 88, 112, 126, 118, 141, 156, 148, 172, 189, 214],
  lastYear: [64, 71, 69, 78, 86, 92, 88, 101, 108, 112, 124, 131],
  caption: "Tổng GMV toàn hệ thống, 12 tháng gần nhất",
};

const trafficSlices: DashboardData["traffic"]["slices"] = [
  { label: "TikTok Shop", percent: 48, color: "#EF4623" },
  { label: "Facebook", percent: 27, color: "#F49E4C" },
  { label: "Instagram", percent: 15, color: "#E97680" },
  { label: "Website", percent: 10, color: "#C8A98F" },
];

const transactionItems: DashboardData["transactions"]["items"] = [
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

const goal: DashboardData["goal"] = {
  percent: 78,
  current: "2,14 tỷ",
  target: "2,75 tỷ",
  breakdown: [
    { label: "KOC tuyển mới", percent: 85 },
    { label: "Doanh thu mở rộng", percent: 62 },
    { label: "Tỉ lệ giữ chân", percent: 94 },
  ],
};

export const ADMIN_DASHBOARD: DashboardData = {
  stats,
  revenue,
  traffic: {
    total: "48,2K",
    caption: "Lượt truy cập qua link Affiliate",
    slices: trafficSlices,
  },
  transactions: {
    title: "Hoạt động gần đây",
    caption: "6 giao dịch mới nhất trong hệ thống",
    subjectLabel: "KOC",
    amountLabel: "Thu nhập",
    viewAllHref: "/admin/reports",
    items: transactionItems,
  },
  goal,
};
