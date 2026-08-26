export const LOCALES = ["vi", "en"] as const;

export type AppLocale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "vi";

/** Ngôn ngữ nằm ở cookie chứ không ở URL, nên client và server đọc chung khoá này. */
export const LOCALE_COOKIE = "NEXT_LOCALE";

export function isAppLocale(value: string | undefined): value is AppLocale {
  return LOCALES.some((locale) => locale === value);
}
