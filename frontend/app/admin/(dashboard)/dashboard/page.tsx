import type { Metadata } from "next";

import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { MonthlyGoal } from "@/components/admin/monthly-goal";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { StatCard } from "@/components/admin/stat-card";
import { TrafficDonut } from "@/components/admin/traffic-donut";
import { TransactionsTable } from "@/components/admin/transactions-table";
import { DASHBOARD_STATS } from "@/lib/mock/dashboard";

export const metadata: Metadata = {
  title: "Tổng quan",
};

export default function AdminDashboardPage() {
  return (
    <>
      <AdminTopbar
        title="Tổng quan"
        greeting="Chào buổi sáng — đây là tình hình hệ thống hôm nay."
      />

      <AdminMobileNav />

      {/* KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {DASHBOARD_STATS.map((metric) => (
          <StatCard key={metric.id} metric={metric} />
        ))}
      </div>

      {/* Biểu đồ doanh thu + nguồn traffic */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <TrafficDonut />
      </div>

      {/* Bảng hoa hồng + mục tiêu tháng */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TransactionsTable />
        </div>
        <MonthlyGoal />
      </div>
    </>
  );
}
