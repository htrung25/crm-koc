"use client";

import { useTranslations } from "next-intl";

export function ViewButton({
  label,
  onClick,
}: {
  label?: string;
  onClick?: () => void;
}) {
  const t = useTranslations("marketing");
  const text = label ?? t("viewDetail");

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={text}
      title={text}
      className="grid h-8 w-8 place-items-center rounded-[9px] text-[#6C4CF1] transition hover:bg-[#EEE9FF]"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    </button>
  );
}
