export const USER_ROLES = ["ADMIN", "BRAND", "CREATOR"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const ROLE_HOME: Record<UserRole, string> = {
  ADMIN: "/admin/dashboard",
  BRAND: "/brand/dashboard",
  CREATOR: "/creator/dashboard",
};

export function isUserRole(value: string | undefined): value is UserRole {
  return USER_ROLES.some((role) => role === value);
}
