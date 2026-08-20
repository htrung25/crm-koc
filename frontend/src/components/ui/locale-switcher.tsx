"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition, type ComponentProps } from "react";

import { usePathname, useRouter } from "@/src/i18n/navigation";
import { routing, type AppLocale } from "@/src/i18n/routing";

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
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <select
      {...props}
      value={locale}
      disabled={disabled || pending}
      aria-label={props["aria-label"] ?? t("label")}
      onChange={(event) => {
        const nextLocale = event.target.value as AppLocale;
        startTransition(() => router.replace(pathname, { locale: nextLocale }));
      }}
      className={className}
    >
      {routing.locales.map((item) => (
        <option key={item} value={item}>
          {t(item)}
        </option>
      ))}
    </select>
  );
}
