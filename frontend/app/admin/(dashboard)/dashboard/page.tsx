"use client";

import Link from "next/link";
import {
  MOCK_ACTIVITIES_EXACT,
  MOCK_BARS_EXACT,
  MOCK_LEADERBOARD_EXACT
} from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils/format";
import { PageHeading, StatCard } from "@/components/ui";

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeading
        title="Tổng quan hệ thống"
        description="Báo cáo số liệu kinh doanh thời gian thực, hoạt động KOC và chiến dịch đang diễn ra."
      />

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Doanh thu tháng"
          value="4.2 tỷ ₫"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6C4CF1" strokeWidth="2">
              <path d="M12 1v22" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
          iconClassName="bg-[#EEE9FF]"
        />
        <StatCard
          label="KOC đang hợp tác"
          value="248"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF5C8A" strokeWidth="2">
              <circle cx="9" cy="8" r="3.2" />
              <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
            </svg>
          }
          iconClassName="bg-[#FFE9F1]"
        />
        <StatCard
          label="Chiến dịch đang chạy"
          value="32"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#12B892" strokeWidth="2">
              <path d="m3 11 18-5v12L3 14v-3z" />
            </svg>
          }
          iconClassName="bg-[#DDF7F1]"
        />
        <StatCard
          label="Tương tác trung bình"
          value="7.6%"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2">
              <path d="m22 7-8.5 8.5-5-5L2 17" />
              <path d="M16 7h6v6" />
            </svg>
          }
          iconClassName="bg-[#FFF1DA]"
        />
      </div>

      {/* Main Charts & Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Revenue Chart */}
        <div className="lg:col-span-2 rounded-[20px] border border-[#F0EFF6] bg-white p-6 shadow-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-[#1A1830]">Doanh thu theo tháng</h2>
              <p className="text-xs font-semibold text-[#9C99B0]">Biểu đồ phát triển doanh số 6 tháng gần nhất</p>
            </div>
            <span className="text-xs font-bold text-[#6C4CF1] bg-[#EEE9FF] px-3 py-1 rounded-full">
              2026
            </span>
          </div>

          <div className="h-[220px] flex items-end justify-between gap-3 pt-6 border-b border-[#F4F4F9]">
            {MOCK_BARS_EXACT.map((bar, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                <span className="text-[11px] font-bold text-[#9C99B0] opacity-0 group-hover:opacity-100 transition">
                  {bar.val}
                </span>
                <div
                  className="w-full max-w-[42px] rounded-t-xl transition-all duration-300 group-hover:brightness-95"
                  style={{ height: `${bar.h}%`, background: bar.fill }}
                />
                <span className="text-xs font-bold text-[#4A4762]">{bar.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Top Leaderboard */}
        <div className="rounded-[20px] border border-[#F0EFF6] bg-white p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#1A1830]">Top KOC Doanh Thu</h2>
            <Link href="/admin/kocs" className="text-xs font-bold text-[#6C4CF1] hover:underline">
              Xem tất cả
            </Link>
          </div>

          <div className="divide-y divide-[#F4F4F9]">
            {MOCK_LEADERBOARD_EXACT.map((koc) => (
              <div key={koc.rank} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl grid place-items-center text-white font-bold text-xs bg-gradient-to-br ${koc.avatarBg} shrink-0`}
                  >
                    {koc.initials}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-[#1A1830]">{koc.name}</div>
                    <div className="text-[11px] font-semibold text-[#9C99B0]">{koc.handle}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm font-bold text-[#1A1830]">{formatCurrency(koc.revenue)}</div>
                  <div className="text-[11px] font-bold text-[#10B981]">+{koc.pct}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="rounded-[20px] border border-[#F0EFF6] bg-white p-6 shadow-card">
        <h2 className="text-base font-bold text-[#1A1830] mb-4">Hoạt động mới nhất</h2>
        <div className="divide-y divide-[#F4F4F9]">
          {MOCK_ACTIVITIES_EXACT.map((act, idx) => (
            <div key={idx} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-[#6C4CF1]" />
                <span className="text-sm font-semibold text-[#3A3852]">{act.vi}</span>
              </div>
              <span className="text-xs font-semibold text-[#9C99B0]">{act.tvi}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
