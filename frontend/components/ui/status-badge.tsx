export type StatusTone =
  | "violet"
  | "green"
  | "yellow"
  | "red"
  | "pink"
  | "blue"
  | "gray";

const toneStyles: Record<StatusTone, string> = {
  violet: "bg-[#EEE9FF] text-[#4A2FD6]",
  green: "bg-[#DEF7EC] text-[#0E9F6E]",
  yellow: "bg-[#FDF6B2] text-[#96700A]",
  red: "bg-[#FDE2E2] text-[#E02424]",
  pink: "bg-[#FCE7F3] text-[#BE185D]",
  blue: "bg-[#E7F0FF] text-[#2563EB]",
  gray: "bg-[#F1F0F4] text-[#6E6B85]",
};

export function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: StatusTone;
}) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-[11px] py-1 text-[11.5px] font-bold ${toneStyles[tone]}`}
    >
      {label}
    </span>
  );
}
