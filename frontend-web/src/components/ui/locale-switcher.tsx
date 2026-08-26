"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition, type ComponentProps } from "react";

import { LOCALES, type AppLocale } from "@/i18n/routing";
import { setLocaleCookie } from "@/i18n/set-locale";

export type LocaleSwitcherProps = Omit<
  ComponentProps<"select">,
  "value" | "onChange" | "children"
>;

export function LocaleSwitcher({
  className,
  disabled,
  ...props
}: LocaleSwitcherProps) {
  const t = useTranslations("localeSwitcher");
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <select
      {...props}
      value={locale}
      disabled={disabled || pending}
      aria-label={props["aria-label"] ?? t("label")}
      onChange={(event) => {
        // URL không đổi nữa: ghi cookie rồi refresh để server render lại.
        setLocaleCookie(event.target.value as AppLocale);
        startTransition(() => router.refresh());
      }}
      className={className}
    >
      {LOCALES.map((item) => (
        <option key={item} value={item}>
          {t(item)}
        </option>
      ))}
    </select>
  );
}
