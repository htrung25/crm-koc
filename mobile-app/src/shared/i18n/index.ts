import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { secureStorage } from '@/shared/storage/secure-storage';

import en from './locales/en.json';
import vi from './locales/vi.json';

const LANGUAGE_KEY = 'app.language';

export const SUPPORTED_LANGUAGES = ['vi', 'en'] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = 'vi';

function isSupported(value: string | null | undefined): value is Language {
  return SUPPORTED_LANGUAGES.includes(value as Language);
}

function deviceLanguage(): Language {
  const code = Localization.getLocales()[0]?.languageCode;
  return isSupported(code) ? code : DEFAULT_LANGUAGE;
}

/** Gọi một lần lúc khởi động, trước khi render cây có dùng `useTranslation`. */
export async function initI18n(): Promise<void> {
  if (i18n.isInitialized) return;

  const stored = await secureStorage.get(LANGUAGE_KEY);
  const language = isSupported(stored) ? stored : deviceLanguage();

  await i18n.use(initReactI18next).init({
    resources: { en: { translation: en }, vi: { translation: vi } },
    lng: language,
    fallbackLng: DEFAULT_LANGUAGE,
    interpolation: { escapeValue: false },
    // RN không có Intl.PluralRules đầy đủ trên mọi máy Android cũ
    compatibilityJSON: 'v4',
  });
}

export async function setLanguage(language: Language): Promise<void> {
  await i18n.changeLanguage(language);
  await secureStorage.set(LANGUAGE_KEY, language);
}

export { i18n };
