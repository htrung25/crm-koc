import type { StatMetric } from "@/features/admin/dashboard/types";
import {
  IconDelta,
  IconTarget,
  IconTrendUp,
  IconUsers,
  IconWallet,
} from "@/components/ui/icons";

const ICONS = {
  wallet: IconWallet,
  users: IconUsers,
  trend: IconTrendUp,
  target: IconTarget,
} as const;

/** Đường sparkline: chuẩn hoá dãy số về viewBox 100x32, gốc toạ độ ở trên. */
function sparkPoints(values: number[]): string {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;

  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 100;
      const y = 30 - ((value - min) / span) * 26;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export function StatCard({ metric }: { metric: StatMetric }) {
  const Icon = ICONS[metric.icon];
  const isUp = metric.delta >= 0;
  const points = sparkPoints(metric.spark);

  return (
    <article className="rounded-[26px] glass p-5">
      <div className="flex items-start justify-between gap-3">
        <span
          className="grid h-11 w-11 place-items-center rounded-2xl"
          style={{
            backgroundColor: `${metric.accent}1F`,
            color: metric.accent,
          }}
        >
          <Icon className="h-[19px] w-[19px]" />
        </span>

        <span
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[11px] font-bold tnum ${
            isUp
              ? "bg-emerald-500/12 text-emerald-700"
              : "bg-rose-500/12 text-rose-600"
          }`}
        >
          <IconDelta up={isUp} />
          {isUp ? "+" : ""}
          {metric.delta.toFixed(1)}%
        </span>
      </div>

      <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.14em] text-[#8A7768]">
        {metric.label}
      </p>
      <p className="mt-1 font-mono text-[26px] font-bold leading-tight text-[#2D3B42] tnum">
        {metric.value}
      </p>

      <svg
        viewBox="0 0 100 32"
        preserveAspectRatio="none"
        className="mt-3 h-8 w-full"
        aria-hidden="true"
      >
        <polyline
          points={points}
          fill="none"
          stroke={metric.accent}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </article>
  );
}
