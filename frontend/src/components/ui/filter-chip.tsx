import type { ReactNode } from "react";

export function FilterChip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-[15px] py-2 text-[12.5px] font-bold transition ${
        active
          ? "border-[#6C4CF1] bg-[#EEE9FF] text-[#4A2FD6]"
          : "border-[#ECEBF3] bg-white text-[#6E6B85] hover:border-[#CFCBE2] hover:text-[#4A2FD6]"
      }`}
    >
      {children}
    </button>
  );
}
