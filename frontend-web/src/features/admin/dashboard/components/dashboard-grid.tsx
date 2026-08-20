import { MonthlyGoal } from "./monthly-goal";
import { RevenueChart } from "./revenue-chart";
import { StatCard } from "./stat-card";
import { TrafficDonut } from "./traffic-donut";
import { TransactionsTable } from "./transactions-table";
import type { DashboardData } from "@/features/admin/dashboard/types";

/**
 * Bố cục dashboard dùng chung cho mọi workspace.
 *
 * Trang của admin / brand / creator chỉ việc truyền `DashboardData` tương ứng;
 * không workspace nào sở hữu riêng phần hiển thị này.
 */
export function DashboardGrid({ data }: { data: DashboardData }) {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.stats.map((metric) => (
          <StatCard key={metric.id} metric={metric} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart series={data.revenue} />
        </div>
        <TrafficDonut data={data.traffic} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TransactionsTable data={data.transactions} />
        </div>
        <MonthlyGoal goal={data.goal} />
      </div>
    </>
  );
}
