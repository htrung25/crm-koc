export const USER_ROLES = ["ADMIN", "BRAND", "CREATOR"] as const;

export type UserRole = (typeof USER_ROLES)[number];

// TODO: trỏ lại về /admin/dashboard | /brand/dashboard | /creator/dashboard
// khi các trang dashboard được dựng lại.
export const ROLE_HOME: Record<UserRole, string> = {
  ADMIN: "/",
  BRAND: "/",
  CREATOR: "/",
};

export function isUserRole(value: string | undefined): value is UserRole {
  return USER_ROLES.some((role) => role === value);
}
