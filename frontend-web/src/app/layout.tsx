import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";

import "@/app/globals.css";
import { Providers } from "@/app/providers";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("marketing");

  return {
    title: { default: "CRM-KOC", template: "%s | CRM-KOC" },
    description: t("siteDescription"),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Ngôn ngữ đến từ cookie (xem i18n/request.ts), không còn từ đoạn URL.
  const locale = await getLocale();

  return (
    <html lang={locale} className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
