import type { TrafficData, TrafficSlice } from "@/features/admin/dashboard/types";

const RADIUS = 62;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP = 1.6; // khe hở giữa các cung, tính theo phần trăm

/**
 * Vị trí bắt đầu của mỗi cung = tổng phần trăm các cung đứng trước.
 * Hàm thuần, gọi trong render vẫn an toàn vì không mutate gì bên ngoài.
 */
function toSegments(slices: TrafficSlice[]) {
  return slices.map((slice, index) => {
    const startPercent = slices
      .slice(0, index)
      .reduce((sum, previous) => sum + previous.percent, 0);

    return {
      ...slice,
      length: ((slice.percent - GAP) / 100) * CIRCUMFERENCE,
      dashOffset: -(startPercent / 100) * CIRCUMFERENCE,
    };
  });
}

export function TrafficDonut({ data }: { data: TrafficData }) {
  const segments = toSegments(data.slices);

  return (
    <section className="flex flex-col rounded-[26px] glass p-5 sm:p-6">
      <div>
        <h2 className="text-base font-extrabold tracking-tight text-[#2D3B42]">
          Nguồn traffic
        </h2>
        <p className="text-xs font-medium text-[#8A7768]">{data.caption}</p>
      </div>

      <div className="relative mx-auto my-6 h-[168px] w-[168px]">
        <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
          <circle
            cx="80"
            cy="80"
            r={RADIUS}
            fill="none"
            stroke="#fff"
            strokeOpacity="0.55"
            strokeWidth="24"
          />

          {segments.map((slice) => (
            <circle
              key={slice.label}
              cx="80"
              cy="80"
              r={RADIUS}
              fill="none"
              stroke={slice.color}
              strokeWidth="24"
              strokeLinecap="round"
              strokeDasharray={`${slice.length} ${CIRCUMFERENCE - slice.length}`}
              strokeDashoffset={slice.dashOffset}
            />
          ))}
        </svg>

        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="font-mono text-2xl font-bold text-[#2D3B42] tnum">
              {data.total}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A7768]">
              Lượt truy cập
            </p>
          </div>
        </div>
      </div>

      <ul className="mt-auto space-y-2.5">
        {data.slices.map((slice) => (
          <li key={slice.label} className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: slice.color }}
            />
            <span className="text-sm font-semibold text-[#5C5049]">
              {slice.label}
            </span>
            <span className="ml-auto font-mono text-sm font-bold text-[#2D3B42] tnum">
              {slice.percent}%
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
