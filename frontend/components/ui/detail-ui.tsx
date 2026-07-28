import type { ReactNode } from "react";

export function DetailBackButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-[18px] inline-flex items-center gap-2 text-[13px] font-bold text-[#6C4CF1] transition hover:text-[#4A2FD6]"
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m15 18-6-6 6-6" />
      </svg>
      {label}
    </button>
  );
}

export function DetailCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[18px] border border-[#F0EFF6] bg-white p-5 shadow-[0_1px_3px_rgba(20,18,48,.05)] md:p-6 ${className}`}
    >
      <h3 className="mb-[18px] text-base font-bold text-[#1A1830]">{title}</h3>
      {children}
    </section>
  );
}

export function DetailMetric({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[#F0EFF6] bg-white p-5 shadow-[0_1px_3px_rgba(20,18,48,.05)]">
      <div className="mb-2 text-[12.5px] font-semibold text-[#9C99B0]">
        {label}
      </div>
      <div
        className={`font-mono text-[25px] font-bold ${
          accent ? "text-[#0E9F6E]" : "text-[#1A1830]"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

export function InfoRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-[#F4F4F9] py-3.5 first:pt-0 last:border-b-0 last:pb-0">
      <span className="text-[12.5px] font-semibold text-[#9C99B0]">{label}</span>
      <div className="max-w-[65%] text-right text-[13.5px] font-bold text-[#3A3852]">
        {children}
      </div>
    </div>
  );
}
