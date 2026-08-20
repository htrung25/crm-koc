import type { ReactNode } from "react";

export function StatCard({
  value,
  label,
  icon,
  iconClassName,
}: {
  value: number | string;
  label: string;
  icon: ReactNode;
  iconClassName: string;
}) {
  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-[#F0EFF6] bg-white px-5 py-[18px] shadow-[0_1px_3px_rgba(20,18,48,.05)]">
      <span
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-[13px] ${iconClassName}`}
      >
        {icon}
      </span>
      <div>
        <div className="font-mono text-2xl font-bold leading-none text-[#1A1830]">
          {value}
        </div>
        <div className="mt-1 text-[12.5px] font-semibold text-[#9C99B0]">
          {label}
        </div>
      </div>
    </div>
  );
}
