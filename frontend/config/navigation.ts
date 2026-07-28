import type { UserRole } from "@/types/auth";

export type NavigationItem = {
  label: string;
  href: string;
  disabled?: boolean;
  iconName?: string;
};

export const ADMIN_NAV_ITEMS: NavigationItem[] = [
  { label: "Tổng quan", href: "/admin/dashboard", iconName: "dashboard" },
  { label: "Danh sách KOC", href: "/admin/kocs", iconName: "users" },
  { label: "Thương hiệu", href: "/admin/brands", iconName: "building" },
  { label: "Chiến dịch", href: "/admin/campaigns", iconName: "megaphone" },
  { label: "Đơn đăng ký", href: "/admin/applications", iconName: "fileCheck" },
  { label: "Nhiệm vụ", href: "/admin/tasks", iconName: "clipboardList" },
  { label: "Báo cáo", href: "/admin/reports", iconName: "barChart" },
];

export type WorkspaceConfig = {
  name: string;
  eyebrow: string;
  accountLabel: string;
  accentClassName: string;
  statusClassName: string;
  navigation: NavigationItem[];
};

export const WORKSPACES: Record<UserRole, WorkspaceConfig> = {
  ADMIN: {
    name: "CRM-KOC",
    eyebrow: "Hệ thống quản lý Admin",
    accountLabel: "Admin Platform",
    accentClassName: "from-purple-400 to-pink-400",
    statusClassName: "bg-emerald-500",
    navigation: ADMIN_NAV_ITEMS,
  },
  BRAND: {
    name: "BRAND PORTAL",
    eyebrow: "Cổng thông tin doanh nghiệp",
    accountLabel: "Brand Space",
    accentClassName: "from-pink-400 to-amber-400",
    statusClassName: "bg-pink-500",
    navigation: [
      { label: "Trang chủ", href: "/brand/dashboard" },
      { label: "Chiến dịch của tôi", href: "/brand/campaigns", disabled: true },
      { label: "Tìm kiếm KOC", href: "/brand/creators", disabled: true },
      { label: "Quản lý hợp đồng", href: "/brand/contracts", disabled: true },
      { label: "Báo cáo chiến dịch", href: "/brand/reports", disabled: true },
    ],
  },
  CREATOR: {
    name: "CREATOR SPACE",
    eyebrow: "Không gian làm việc Creator",
    accountLabel: "Creator Account",
    accentClassName: "from-violet-400 to-pink-400",
    statusClassName: "bg-violet-500",
    navigation: [
      { label: "Trang chủ", href: "/creator/dashboard" },
      { label: "Tìm chiến dịch", href: "/creator/campaigns", disabled: true },
      { label: "Công việc đã nhận", href: "/creator/jobs", disabled: true },
      { label: "Kênh liên kết", href: "/creator/channels", disabled: true },
      { label: "Ví & thu nhập", href: "/creator/wallet", disabled: true },
    ],
  },
};
