import type { UserRole } from "@/features/auth/types";
import { APP_ROUTES } from "@/config/route";

export type NavigationItem = {
  labelKey: string;
  href: string;
  disabled?: boolean;
  iconName?: string;
};

/** Nhóm "Điều hướng": các khu vực nghiệp vụ hằng ngày. */
export const ADMIN_NAV_ITEMS: NavigationItem[] = [
  { labelKey: "overview", href: APP_ROUTES.admin.dashboard, iconName: "dashboard" },
  { labelKey: "kocs", href: APP_ROUTES.admin.kocs, iconName: "users" },
  { labelKey: "brands", href: APP_ROUTES.admin.brands, iconName: "building" },
  { labelKey: "campaigns", href: APP_ROUTES.admin.campaigns, iconName: "megaphone" },
  {
    labelKey: "applications",
    href: APP_ROUTES.admin.applications,
    iconName: "fileCheck",
  },
  { labelKey: "tasks", href: APP_ROUTES.admin.tasks, iconName: "clipboardList" },
  { labelKey: "reports", href: APP_ROUTES.admin.reports, iconName: "barChart" },
];

/**
 * Nhóm "Cấu hình hệ thống": thiết lập ít đụng tới nhưng ảnh hưởng toàn hệ
 * thống. Tách khỏi điều hướng nghiệp vụ để không ai vào nhầm khi đang thao tác
 * hằng ngày.
 */
export const ADMIN_SYSTEM_ITEMS: NavigationItem[] = [
  {
    labelKey: "profile",
    href: APP_ROUTES.admin.profile,
    iconName: "user",
  },
  {
    labelKey: "ipWhitelist",
    href: APP_ROUTES.admin.ipWhitelist,
    iconName: "shield",
  },
  {
    labelKey: "settings",
    href: APP_ROUTES.admin.settings,
    iconName: "settings",
    disabled: true,
  },
  {
    labelKey: "faq",
    href: APP_ROUTES.admin.faqConfig,
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
      { labelKey: "brandHome", href: APP_ROUTES.brand.dashboard },
      { labelKey: "brandCampaigns", href: APP_ROUTES.brand.campaigns, disabled: true },
      { labelKey: "findKocs", href: APP_ROUTES.brand.creators, disabled: true },
      { labelKey: "contracts", href: APP_ROUTES.brand.contracts, disabled: true },
      { labelKey: "campaignReports", href: APP_ROUTES.brand.reports, disabled: true },
    ],
  },
  CREATOR: {
    name: "CREATOR SPACE",
    eyebrowKey: "workspace.creatorEyebrow",
    accountLabelKey: "workspace.creatorAccount",
    accentClassName: "from-violet-400 to-pink-400",
    statusClassName: "bg-violet-500",
    navigation: [
      { labelKey: "creatorHome", href: APP_ROUTES.creator.dashboard },
      { labelKey: "findCampaigns", href: APP_ROUTES.creator.campaigns, disabled: true },
      { labelKey: "acceptedJobs", href: APP_ROUTES.creator.jobs, disabled: true },
      {
        labelKey: "connectedChannels",
        href: APP_ROUTES.creator.channels,
        disabled: true,
      },
      { labelKey: "wallet", href: APP_ROUTES.creator.wallet, disabled: true },
    ],
  },
};
