import { ROLE_HOME, type UserRole } from "@/features/auth/types";

const COOKIE_OPTIONS = "path=/; SameSite=Lax";

export function createDemoSession(role: UserRole) {
  document.cookie = `token=mock-jwt-token; ${COOKIE_OPTIONS}`;
  document.cookie = `user_role=${role}; ${COOKIE_OPTIONS}`;
}

export function clearSession() {
  document.cookie = `token=; Max-Age=0; ${COOKIE_OPTIONS}`;
  document.cookie = `user_role=; Max-Age=0; ${COOKIE_OPTIONS}`;
}

export function getRoleHome(role: UserRole) {
  return ROLE_HOME[role];
}
