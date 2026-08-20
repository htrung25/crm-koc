import type { UserRole } from "@/features/auth/types";

export type NavigationItem = {
  labelKey: string;
  href: string;
  disabled?: boolean;
  iconName?: string;
};

/** Nhóm "Điều hướng": các khu vực nghiệp vụ hằng ngày. */
export const ADMIN_NAV_ITEMS: NavigationItem[] = [
  { labelKey: "overview", href: "/admin/dashboard", iconName: "dashboard" },
  { labelKey: "kocs", href: "/admin/kocs", iconName: "users" },
  { labelKey: "brands", href: "/admin/brands", iconName: "building" },
  { labelKey: "campaigns", href: "/admin/campaigns", iconName: "megaphone" },
  { labelKey: "applications", href: "/admin/applications", iconName: "fileCheck" },
  { labelKey: "tasks", href: "/admin/tasks", iconName: "clipboardList" },
  { labelKey: "reports", href: "/admin/reports", iconName: "barChart" },
];

/**
 * Nhóm "Cấu hình hệ thống": thiết lập ít đụng tới nhưng ảnh hưởng toàn hệ
 * thống. Tách khỏi điều hướng nghiệp vụ để không ai vào nhầm khi đang thao tác
 * hằng ngày.
 */
export const ADMIN_SYSTEM_ITEMS: NavigationItem[] = [
  {
    labelKey: "profile",
    href: "/admin/profile",
    iconName: "user",
  },
  {
    labelKey: "ipWhitelist",
    href: "/admin/ip-whitelist",
    iconName: "shield",
  },
  {
    labelKey: "settings",
    href: "/admin/settings",
    iconName: "settings",
    disabled: true,
  },
  {
    labelKey: "faq",
    href: "/admin/faq-config",
    iconName: "help",
    disabled: true,
  },
];

export type WorkspaceConfig = {
  name: string;
  eyebrowKey: string;
  accountLabelKey: string;
  accentClassName: string;
  statusClassName: string;
  navigation: NavigationItem[];
};

export const WORKSPACES: Record<UserRole, WorkspaceConfig> = {
  ADMIN: {
    name: "CRM-KOC",
    eyebrowKey: "workspace.adminEyebrow",
    accountLabelKey: "workspace.adminAccount",
    accentClassName: "from-purple-400 to-pink-400",
    statusClassName: "bg-emerald-500",
    navigation: ADMIN_NAV_ITEMS,
  },
  BRAND: {
    name: "BRAND PORTAL",
    eyebrowKey: "workspace.brandEyebrow",
    accountLabelKey: "workspace.brandAccount",
    accentClassName: "from-pink-400 to-amber-400",
    statusClassName: "bg-pink-500",
    navigation: [
      { labelKey: "brandHome", href: "/brand/dashboard" },
      { labelKey: "brandCampaigns", href: "/brand/campaigns", disabled: true },
      { labelKey: "findKocs", href: "/brand/creators", disabled: true },
      { labelKey: "contracts", href: "/brand/contracts", disabled: true },
      { labelKey: "campaignReports", href: "/brand/reports", disabled: true },
    ],
  },
  CREATOR: {
    name: "CREATOR SPACE",
    eyebrowKey: "workspace.creatorEyebrow",
    accountLabelKey: "workspace.creatorAccount",
    accentClassName: "from-violet-400 to-pink-400",
    statusClassName: "bg-violet-500",
    navigation: [
      { labelKey: "creatorHome", href: "/creator/dashboard" },
      { labelKey: "findCampaigns", href: "/creator/campaigns", disabled: true },
      { labelKey: "acceptedJobs", href: "/creator/jobs", disabled: true },
      { labelKey: "connectedChannels", href: "/creator/channels", disabled: true },
      { labelKey: "wallet", href: "/creator/wallet", disabled: true },
    ],
  },
};
