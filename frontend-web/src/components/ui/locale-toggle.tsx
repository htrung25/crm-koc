"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { LOCALES, type AppLocale } from "@/i18n/routing";
import { setLocaleCookie } from "@/i18n/set-locale";

type LocaleToggleProps = {
  /** Nền tối (hero marketing) cần tương phản ngược lại. */
  dark?: boolean;
};

/**
 * Chuyển ngôn ngữ dạng hai nút liền nhau, dùng ở thanh đầu trang.
 * Ô chọn dạng <select> vẫn giữ ở form hồ sơ, nơi nó phải khớp các trường khác.
 */
export function LocaleToggle({ dark = false }: LocaleToggleProps) {
  const t = useTranslations("localeSwitcher");
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div
      role="group"
      aria-label={t("label")}
      className={`inline-flex h-11 items-center gap-1 rounded-2xl p-1 ${
        dark ? "bg-white/10" : "bg-[#2D3B42]/8"
      }`}
    >
      {LOCALES.map((item) => {
        const active = item === locale;

        return (
          <button
            key={item}
            type="button"
            disabled={pending}
            aria-pressed={active}
            // Nhãn đầy đủ cho trình đọc màn hình; trên màn hình chỉ hiện VI/EN.
            aria-label={t(item)}
            onClick={() => {
              if (active) return;
              // URL không đổi nữa: ghi cookie rồi refresh để server render lại
              // với bộ chuỗi mới.
              setLocaleCookie(item as AppLocale);
              startTransition(() => router.refresh());
            }}
            className={`h-9 rounded-xl px-3.5 text-sm font-extrabold uppercase transition-colors disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#EF4623]/30 ${
              active
                ? "bg-[#EF4623] text-white shadow-sm"
                : dark
                  ? "text-white/60 hover:text-white"
                  : "text-[#8A7768] hover:text-[#2D3B42]"
            }`}
          >
            {item}
          </button>
        );
      })}
    </div>
  );
}
