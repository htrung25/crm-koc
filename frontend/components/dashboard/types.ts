/**
 * Hợp đồng dữ liệu của các khối dashboard.
 *
 * Type nằm cạnh component chứ không nằm trong lib/mock: component là bên đặt
 * ra yêu cầu, mock chỉ là một nguồn cung hôm nay. Khi API thật thay chỗ mock,
 * file này không đổi và không component nào phải sửa.
 *
 * Mọi workspace (admin / brand / creator) đều cấp một `DashboardData`, nên
 * cùng bộ component dựng được cả ba khu vực.
 */

export type StatMetric = {
  id: string;
  label: string;
  value: string;
  /** Phần trăm biến động; âm là giảm. */
  delta: number;
  icon: "wallet" | "users" | "trend" | "target";
  accent: string;
  spark: number[];
};

export type RevenueSeries = {
  months: string[];
  thisYear: number[];
  lastYear: number[];
  /** Chú thích dưới tiêu đề — mỗi workspace đo một chỉ số khác nhau. */
  caption: string;
};

export type TrafficSlice = {
  label: string;
  percent: number;
  color: string;
};

export type TrafficData = {
  total: string;
  caption: string;
  slices: TrafficSlice[];
};

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

export type TransactionsData = {
  title: string;
  caption: string;
  /** Cột đầu tiên: admin xem theo KOC, brand xem theo chiến dịch… */
  subjectLabel: string;
  amountLabel: string;
  viewAllHref: string;
  items: Transaction[];
};

export type GoalData = {
  percent: number;
  current: string;
  target: string;
  breakdown: { label: string; percent: number }[];
};

export type DashboardData = {
  stats: StatMetric[];
  revenue: RevenueSeries;
  traffic: TrafficData;
  transactions: TransactionsData;
  goal: GoalData;
};
