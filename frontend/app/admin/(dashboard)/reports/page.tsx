"use client";

import {
  MOCK_BARS_EXACT,
  MOCK_CATEGORY_DIST_EXACT,
  type BarData,
  type CategoryDistItem
} from "@/lib/mock-data";
import { PageHeading, StatCard } from "@/components/ui";

export default function AdminReportsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeading
        title="Báo cáo & Thống kê"
        description="Phân tích chi tiết hiệu suất doanh thu, phân bổ ngành hàng và chỉ số chuyển đổi KOC."
      />

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Tổng doanh thu chiến dịch"
          value="14.8 tỷ ₫"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6C4CF1" strokeWidth="2">
              <path d="M12 1v22" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
          iconClassName="bg-[#EEE9FF]"
        />
        <StatCard
          label="Tổng số lượt chuyển đổi"
          value="142.5K"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
              <path d="m22 7-8.5 8.5-5-5L2 17" />
              <path d="M16 7h6v6" />
            </svg>
          }
          iconClassName="bg-[#DEF7EC]"
        />
        <StatCard
          label="Chi phí trung bình / đơn"
          value="85.000 ₫"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF5C8A" strokeWidth="2">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" />
            </svg>
          }
          iconClassName="bg-[#FCE7F3]"
        />
        <StatCard
          label="Tỷ lệ giữ chân thương hiệu"
          value="94.2%"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          }
          iconClassName="bg-[#FFF1DA]"
        />
      </div>

      {/* Main Grid: Revenue Bar Chart & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Monthly Revenue Chart */}
        <div className="lg:col-span-7 bg-white rounded-[20px] p-6 border border-[#F0EFF6] shadow-card">
          <h2 className="text-base font-bold text-[#1A1830] mb-6">Doanh thu theo tháng</h2>
          <div className="flex items-end gap-3 h-[200px] pt-4 px-2 border-b border-[#F4F4F9]">
            {MOCK_BARS_EXACT.map((bar: BarData, idx: number) => (
              <div
                key={idx}
                className="flex-1 flex flex-col items-center justify-end gap-2 h-full group"
              >
                <span className="text-[11px] font-bold text-[#9C99B0] opacity-0 group-hover:opacity-100 transition">
                  {bar.val}
                </span>
                <div
                  className="w-full max-w-[32px] rounded-t-xl transition-all duration-300 group-hover:brightness-95"
                  style={{
                    background: bar.fill,
                    height: `${bar.h}%`
                  }}
                />
                <span className="text-xs font-bold text-[#4A4762]">{bar.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Category Distribution */}
        <div className="lg:col-span-5 bg-white rounded-[20px] p-6 border border-[#F0EFF6] shadow-card">
          <h2 className="text-base font-bold text-[#1A1830] mb-6">Phân bổ theo lĩnh vực</h2>
          <div className="space-y-4">
            {MOCK_CATEGORY_DIST_EXACT.map((c: CategoryDistItem, idx: number) => (
              <div key={idx}>
                <div className="flex justify-between text-xs mb-1.5 font-semibold text-[#3A3852]">
                  <span>{c.labelVi}</span>
                  <span className="font-mono font-bold">{c.pct}%</span>
                </div>
                <div className="h-2 bg-[#F0EFF6] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${c.pct}%`,
                      background: c.color
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
