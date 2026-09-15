'use client';

import type { CampaignStatus } from '../types';

export const CAMPAIGN_TABS: { key: CampaignStatus; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'pending', label: 'Chờ duyệt' },
  { key: 'active', label: 'Đang chạy' },
  { key: 'paused', label: 'Tạm dừng' },
  { key: 'overdue', label: 'Quá hạn' },
  { key: 'rejected', label: 'Từ chối' },
  { key: 'completed', label: 'Hoàn thành' },
];

interface CampaignFilterTabsProps {
  currentTab: CampaignStatus;
  onTabChange: (tab: CampaignStatus) => void;
  counts?: Record<CampaignStatus, number>;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function CampaignFilterTabs({
  currentTab,
  onTabChange,
  counts,
  searchQuery,
  onSearchChange,
}: CampaignFilterTabsProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Pills filter tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full scrollbar-none">
        {CAMPAIGN_TABS.map((tab) => {
          const isActive = currentTab === tab.key;
          const count = counts ? counts[tab.key] : undefined;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-violet-50 text-[#7C3AED] border-2 border-[#7C3AED] shadow-sm shadow-violet-100'
                  : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {tab.label}
              {typeof count === 'number' && (
                <span
                  className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                    isActive
                      ? 'bg-[#7C3AED] text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Quick Search */}
      <div className="relative min-w-[240px] md:w-72">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm chiến dịch, thương hiệu..."
          className="w-full pl-9 pr-4 py-2 text-xs rounded-full bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 transition-all"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
