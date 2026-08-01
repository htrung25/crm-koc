import type { RevenueSeries } from "./types";

const WIDTH = 720;
const HEIGHT = 240;
const PAD_TOP = 16;
const PAD_BOTTOM = 24;

type Point = { x: number; y: number };

function toPoints(values: number[], max: number): Point[] {
  const usable = HEIGHT - PAD_TOP - PAD_BOTTOM;

  return values.map((value, index) => ({
    x: (index / (values.length - 1)) * WIDTH,
    y: PAD_TOP + usable - (value / max) * usable,
  }));
}

/**
 * Nối các điểm bằng đường cong Catmull-Rom quy đổi sang cubic Bézier.
 * Nội suy tuyến tính cho ra đường gãy khúc, còn đây bám đúng điểm dữ liệu mà
 * vẫn mượt — quan trọng vì mắt đọc xu hướng theo độ dốc.
 */
function smoothPath(points: Point[]): string {
  if (points.length < 2) return "";

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;

    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }

  return path;
}

export function RevenueChart({ series }: { series: RevenueSeries }) {
  const { months, thisYear, lastYear, caption } = series;
  const max = Math.max(...thisYear, ...lastYear) * 1.12;

  const current = toPoints(thisYear, max);
  const previous = toPoints(lastYear, max);

  const line = smoothPath(current);
  const area = `${line} L ${WIDTH} ${HEIGHT - PAD_BOTTOM} L 0 ${HEIGHT - PAD_BOTTOM} Z`;

  const peakIndex = thisYear.indexOf(Math.max(...thisYear));
  const peak = current[peakIndex];
  const end = current[current.length - 1];

  return (
    <section className="rounded-[26px] glass p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold tracking-tight text-[#2D3B42]">
            Doanh thu theo thời gian
          </h2>
          <p className="text-xs font-medium text-[#8A7768]">{caption}</p>
        </div>

        <div className="flex items-center gap-4 text-[11px] font-bold text-[#5C5049]">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#EF4623]" />
            Năm nay
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-4 rounded-full border-t-2 border-dashed border-[#F49E4C]" />
            Năm ngoái
          </span>
        </div>
      </div>

      {/*
        Giữ tỉ lệ khung hình thay vì preserveAspectRatio="none": co giãn tự do
        sẽ bóp các điểm đánh dấu tròn thành elip. Chiều rộng thẻ quyết định
        chiều cao, biểu đồ vẫn chảy theo layout.
      */}
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="mt-5 aspect-[3/1] w-full"
        role="img"
        aria-label={`Doanh thu tăng từ ${thisYear[0]} lên ${thisYear[thisYear.length - 1]} tỉ đồng trong 12 tháng`}
      >
        <defs>
          <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#EF4623" stopOpacity="0.34" />
            <stop offset="60%" stopColor="#EF4623" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#EF4623" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Lưới ngang */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = PAD_TOP + (HEIGHT - PAD_TOP - PAD_BOTTOM) * ratio;
          return (
            <line
              key={ratio}
              x1="0"
              y1={y}
              x2={WIDTH}
              y2={y}
              stroke="#2D3B42"
              strokeOpacity="0.08"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}

        <path d={area} fill="url(#revenue-fill)" />

        <path
          d={smoothPath(previous)}
          fill="none"
          stroke="#F49E4C"
          strokeWidth="2"
          strokeDasharray="6 6"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />

        <path
          d={line}
          fill="none"
          stroke="#EF4623"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />

        {/* Đỉnh trong năm */}
        <circle
          cx={peak.x}
          cy={peak.y}
          r="5"
          fill="#fff"
          stroke="#EF4623"
          strokeWidth="2.5"
          vectorEffect="non-scaling-stroke"
        />
        {/* Điểm cuối kỳ */}
        <circle cx={end.x} cy={end.y} r="5" fill="#EF4623" />
      </svg>

      <div className="mt-2 flex justify-between font-mono text-[10px] font-medium text-[#8A7768] tnum">
        {months.map((month) => (
          <span key={month}>{month}</span>
        ))}
      </div>
    </section>
  );
}
