import { LOCALE_COOKIE, type AppLocale } from './routing';

const MAX_AGE = 60 * 60 * 24 * 365;
export function setLocaleCookie(locale: AppLocale) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=${MAX_AGE}; SameSite=Lax${secure}`;
}
