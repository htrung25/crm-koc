'use client';

import type { CampaignStats as StatsType } from '../types';

export function CampaignStatsCards({ stats }: { stats: StatsType }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Tổng chiến dịch */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
        <div className="w-12 h-12 rounded-2xl bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center shrink-0">
          {/* Megaphone icon */}
          <svg
            className="w-6 h-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m3 11 15-6.5v15L3 13z" />
            <path d="M3 11H2.5a1.5 1.5 0 0 0 0 3H3z" />
            <path d="M7.5 14.5V19a1.5 1.5 0 0 0 3 0v-3.7" />
            <path d="M21 9.5v5" />
          </svg>
        </div>
        <div>
          <div className="text-2xl font-extrabold text-[#2D3B42] leading-none mb-1">
            {stats.total}
          </div>
          <div className="text-xs font-semibold text-slate-500">
            Tổng chiến dịch
          </div>
        </div>
      </div>

      {/* 2. Chờ duyệt */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
        <div className="w-12 h-12 rounded-2xl bg-[#FEF9C3] text-[#CA8A04] flex items-center justify-center shrink-0">
          {/* Clock icon */}
          <svg
            className="w-6 h-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <div>
          <div className="text-2xl font-extrabold text-[#2D3B42] leading-none mb-1">
            {stats.pending}
          </div>
          <div className="text-xs font-semibold text-slate-500">Chờ duyệt</div>
        </div>
      </div>

      {/* 3. Đang chạy */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
        <div className="w-12 h-12 rounded-2xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shrink-0">
          {/* Trending up icon */}
          <svg
            className="w-6 h-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
            <polyline points="16 7 22 7 22 13" />
          </svg>
        </div>
        <div>
          <div className="text-2xl font-extrabold text-[#2D3B42] leading-none mb-1">
            {stats.active}
          </div>
          <div className="text-xs font-semibold text-slate-500">Đang chạy</div>
        </div>
      </div>

      {/* 4. Quá hạn */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
        <div className="w-12 h-12 rounded-2xl bg-[#FFE4E6] text-[#E11D48] flex items-center justify-center shrink-0">
          {/* Alert Triangle icon */}
          <svg
            className="w-6 h-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <div>
          <div className="text-2xl font-extrabold text-[#2D3B42] leading-none mb-1">
            {stats.overdue}
          </div>
          <div className="text-xs font-semibold text-slate-500">Quá hạn</div>
        </div>
      </div>
    </div>
  );
}
