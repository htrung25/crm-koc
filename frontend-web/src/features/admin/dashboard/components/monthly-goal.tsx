import type { GoalData } from "@/features/admin/dashboard/types";

const RADIUS = 58;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function MonthlyGoal({ goal }: { goal: GoalData }) {
  const { percent, current, target, breakdown } = goal;
  const filled = (percent / 100) * CIRCUMFERENCE;

  return (
    <section className="flex flex-col rounded-[26px] glass p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold tracking-tight text-[#2D3B42]">
            Mục tiêu tháng
          </h2>
          <p className="font-mono text-xs font-medium text-[#8A7768] tnum">
            {current} / {target}
          </p>
        </div>
        <span className="rounded-full bg-[#EF4623]/12 px-2.5 py-1 font-mono text-[11px] font-bold text-[#EF4623] tnum">
          {percent}%
        </span>
      </div>

      <div className="relative mx-auto my-6 h-[156px] w-[156px]">
        <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
          <defs>
            <linearGradient id="goal-arc" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#EF4623" />
              <stop offset="100%" stopColor="#F49E4C" />
            </linearGradient>
          </defs>

          <circle
            cx="70"
            cy="70"
            r={RADIUS}
            fill="none"
            stroke="#fff"
            strokeOpacity="0.6"
            strokeWidth="14"
          />
          <circle
            cx="70"
            cy="70"
            r={RADIUS}
            fill="none"
            stroke="url(#goal-arc)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${CIRCUMFERENCE - filled}`}
          />
        </svg>

        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="font-mono text-[30px] font-bold leading-none text-[#2D3B42] tnum">
              {percent}%
            </p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600">
              Đúng tiến độ
            </p>
          </div>
        </div>
      </div>

      <ul className="mt-auto space-y-4">
        {breakdown.map((item) => (
          <li key={item.label}>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-[#5C5049]">
                {item.label}
              </span>
              <span className="font-mono text-xs font-bold text-[#2D3B42] tnum">
                {item.percent}%
              </span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/70">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#EF4623] to-[#F49E4C]"
                style={{ width: `${item.percent}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
