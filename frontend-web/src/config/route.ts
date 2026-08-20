/**
 * Mọi URL dùng trong code gom về đây.
/** Trang trong ứng dụng. Điều hướng qua Link/redirect của @/i18n/navigation. */
export const APP_ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",

  admin: {
    login: "/admin",
    dashboard: "/admin/dashboard",
    kocs: "/admin/kocs",
    brands: "/admin/brands",
    campaigns: "/admin/campaigns",
    applications: "/admin/applications",
    tasks: "/admin/tasks",
    reports: "/admin/reports",
    profile: "/admin/profile",
    ipWhitelist: "/admin/ip-whitelist",
    settings: "/admin/settings",
    faqConfig: "/admin/faq-config",
  },

  brand: {
    dashboard: "/brand/dashboard",
    campaigns: "/brand/campaigns",
    creators: "/brand/creators",
    contracts: "/brand/contracts",
    reports: "/brand/reports",
  },

  creator: {
    dashboard: "/creator/dashboard",
    campaigns: "/creator/campaigns",
    jobs: "/creator/jobs",
    channels: "/creator/channels",
    wallet: "/creator/wallet",
  },
} as const;

/** Route Handler của Next. Trình duyệt gọi qua apiFetch. */
export const API_ROUTES = {
  auth: {
    login: "/api/auth/login",
    logout: "/api/auth/logout",
    refresh: "/api/auth/refresh",
    verifyOtp: "/api/auth/verify-otp",
    resendOtp: "/api/auth/resend-otp",
  },

  admin: {
    accounts: "/api/admin/accounts",
    account: (id: string) => `/api/admin/accounts/${id}`,
    profile: "/api/admin/profile",
    brands: "/api/admin/brands",
  },
} as const;

/**
 * Endpoint NestJS. CHỈ gọi từ phía server qua apiRequest — gọi thẳng từ trình
 * duyệt sẽ đi vòng qua lớp chuyển tiếp IP, chuẩn hoá lỗi và tự làm mới token.
 */
export const BACKEND_ROUTES = {
  me: "/me",
  logout: "/logout",
  refresh: "/refresh",
  verifyOtp: "/verify-otp",
  resendOtp: "/resend-otp",
  loginAdmin: "/login/admin",
  loginBrandCreator: "/login/brand-creator",

  admin: {
    detail: (id: string) => `/admin/${id}`,
    adminList: "/admin/admin-list",
    brandList: "/admin/brands-list",
    brandDetail: (id: string) => `/admin/brands-list/${id}`,
    creatorList: "/admin/creators-list",
    profileMe: "/admin/profile/me",
  },
} as const;
