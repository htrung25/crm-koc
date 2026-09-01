import { LOCALE_COOKIE, type AppLocale } from "./routing";

/** Một năm: đủ lâu để lựa chọn dính, đủ ngắn để không phải cookie vĩnh viễn. */
const MAX_AGE = 60 * 60 * 24 * 365;

/**
 * Ghi lựa chọn ngôn ngữ. Không dùng httpOnly: chính client đặt, còn server đọc
 * lại trong i18n/request.ts để chọn bộ chuỗi.
 */
export function setLocaleCookie(locale: AppLocale) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=${MAX_AGE}; SameSite=Lax${secure}`;
}
