'use client';

import type { CampaignItem } from '../types';

interface CampaignDetailViewProps {
  campaign: CampaignItem;
  onBack: () => void;
  onStatusChange?: (
    campaignId: string,
    newStatus: CampaignItem['status']
  ) => void;
}

export function CampaignDetailView({
  campaign,
  onBack,
  onStatusChange,
}: CampaignDetailViewProps) {
  const registeredKocs = campaign.registeredKocs || [
    {
      id: 'koc-1',
      name: 'Mai Anh',
      handle: '@maianh.beauty',
      initials: 'MA',
      avatarBg: 'bg-[#8B5CF6]',
      platforms: ['TikTok', 'Instagram'],
      status: 'Đã duyệt' as const,
    },
    {
      id: 'koc-2',
      name: 'Hải Yến',
      handle: '@yenlifestyle',
      initials: 'HY',
      avatarBg: 'bg-[#EC4899]',
      platforms: ['TikTok', 'YouTube'],
      status: 'Đã nộp bài' as const,
    },
    {
      id: 'koc-3',
      name: 'Bảo Trân',
      handle: '@tran.fashion',
      initials: 'BT',
      avatarBg: 'bg-[#14B8A6]',
      platforms: ['Instagram', 'TikTok'],
      status: 'Chờ duyệt' as const,
    },
    {
      id: 'koc-4',
      name: 'Minh Quân',
      handle: '@quantech',
      initials: 'MQ',
      avatarBg: 'bg-[#F97316]',
      platforms: ['YouTube'],
      status: 'Đã duyệt' as const,
    },
    {
      id: 'koc-5',
      name: 'Tuấn Kiệt',
      handle: '@kietkgaming',
      initials: 'TK',
      avatarBg: 'bg-[#3B82F6]',
      platforms: ['YouTube', 'TikTok'],
      status: 'Đã nộp bài' as const,
    },
  ];

  const kocStats = campaign.kocStats || {
    registered: campaign.kocCurrent,
    approved: 3,
    submitted: 3,
  };

  const results = campaign.results || {
    reach: '4.2M',
    impressions: '18.6M',
    engagementRate: '7.8%',
    conversionRate: '3.2%',
  };

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-200">
      {/* 1. Back button */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#2D3B42] transition-colors cursor-pointer"
      >
        <svg
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        Quay lại chiến dịch
      </button>

      {/* 2. Top Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Brand & Campaign name */}
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-2xl ${campaign.brandAvatarBg} text-white font-extrabold text-lg flex items-center justify-center shrink-0 shadow-sm`}
            >
              {campaign.brandAvatarInitials}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#2D3B42]">
                  {campaign.title}
                </h1>
                {campaign.status === 'active' && (
                  <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-[#ECFDF5] text-[#10B981] border border-[#10B981]/20">
                    Đang chạy
                  </span>
                )}
                {campaign.status === 'pending' && (
                  <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-[#FEF9C3] text-[#B45309] border border-[#F59E0B]/20">
                    Chờ duyệt
                  </span>
                )}
                {campaign.status === 'paused' && (
                  <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                    Tạm dừng
                  </span>
                )}
                {campaign.status === 'overdue' && (
                  <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-[#FFE4E6] text-[#E11D48] border border-[#E11D48]/20">
                    Quá hạn
                  </span>
                )}
                {campaign.status === 'rejected' && (
                  <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-200">
                    Từ chối
                  </span>
                )}
                {campaign.status === 'completed' && (
                  <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200">
                    Hoàn thành
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-medium mt-1">
                <span className="flex items-center gap-1">
                  <svg
                    className="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M4 21V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v15" />
                    <path d="M14 10h4a2 2 0 0 1 2 2v9" />
                    <path d="M2 21h20" />
                  </svg>
                  {campaign.brandName}
                </span>
                <span>•</span>
                <span>{campaign.category || 'Làm đẹp'}</span>
                <span>•</span>
                <span>Tạo ngày {campaign.createdAt || '02/07/2026'}</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => onStatusChange?.(campaign.id, 'rejected')}
              className="px-4 py-2 rounded-full text-xs font-bold text-rose-600 bg-rose-50/60 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => onStatusChange?.(campaign.id, 'paused')}
              className="px-4 py-2 rounded-full text-xs font-bold text-amber-700 bg-amber-50/60 border border-amber-200 hover:bg-amber-100 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
              Tạm dừng
            </button>
          </div>
        </div>

        {/* Audit tag bar */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-slate-600 bg-slate-100/80">
            <svg
              className="w-3.5 h-3.5 text-violet-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Kiểm duyệt
          </span>
        </div>
      </div>

      {/* 3. Row of 4 Metric / Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Ngân sách */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">
              Ngân sách
            </span>
            <div className="w-8 h-8 rounded-full bg-violet-50 text-[#7C3AED] flex items-center justify-center font-bold text-xs">
              $
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-[#2D3B42] mb-1">
              {campaign.budgetFormatted}
            </div>
            <div className="text-[11px] font-medium text-slate-400 mb-3">
              Đã giải ngân:{' '}
              <span className="font-semibold text-slate-600">
                {campaign.disbursedAmount || '198M đ'}
              </span>{' '}
              • {campaign.disbursedPercent || 62}%
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#7C3AED] to-[#EC4899] rounded-full"
                style={{ width: `${campaign.disbursedPercent || 62}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 2: Hạn chót */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">
              Hạn chót
            </span>
            <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-[#2D3B42] mb-2">
              {campaign.deadline}
            </div>
            <span className="inline-block px-3 py-0.5 rounded-full text-[11px] font-bold text-slate-500 bg-slate-100">
              Còn {campaign.daysRemaining > 0 ? campaign.daysRemaining : 19}{' '}
              ngày
            </span>
          </div>
        </div>

        {/* Card 3: Nền tảng đăng bài */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">
              Nền tảng đăng bài
            </span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-2">
            {campaign.platforms.map((p) => {
              if (p === 'TikTok') {
                return (
                  <span
                    key={p}
                    className="bg-black text-white text-[11px] font-bold px-3 py-1 rounded-full inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    TikTok
                  </span>
                );
              }
              if (p === 'Instagram') {
                return (
                  <span
                    key={p}
                    className="bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCB045] text-white text-[11px] font-bold px-3 py-1 rounded-full inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-200" />
                    Instagram
                  </span>
                );
              }
              return (
                <span
                  key={p}
                  className="bg-[#FF0000] text-white text-[11px] font-bold px-3 py-1 rounded-full inline-flex items-center gap-1.5 shadow-xs"
                >
                  YouTube
                </span>
              );
            })}
          </div>
        </div>

        {/* Card 4: Sản phẩm / Dịch vụ */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">
              Sản phẩm / Dịch vụ
            </span>
            <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center">
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="m7.5 4.27 9 5.15" />
                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                <path d="m3.3 7 8.7 5 8.7-5" />
                <path d="M12 22V12" />
              </svg>
            </div>
          </div>
          <div>
            <div className="text-base font-extrabold text-[#2D3B42] mb-1.5 line-clamp-1">
              {campaign.productName || 'Serum dưỡng ẩm Hydra X'}
            </div>
            <span className="inline-block px-3 py-0.5 rounded-full text-[11px] font-bold text-violet-700 bg-violet-50 border border-violet-100">
              {campaign.productType || 'Sản phẩm'}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Middle Section (Left: Description & KOC Requirements, Right: Progress & Results) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols on desktop) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card A: Mô tả chiến dịch */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-3">
            <h2 className="text-sm font-extrabold text-[#2D3B42]">
              Mô tả chiến dịch
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {campaign.description}
            </p>
          </div>

          {/* Card B: Yêu cầu dành cho KOC */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
            <h2 className="text-sm font-extrabold text-[#2D3B42]">
              Yêu cầu dành cho KOC
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
              <div>
                <div className="text-[11px] font-medium text-slate-400">
                  Theo dõi tối thiểu
                </div>
                <div className="text-xs font-extrabold text-[#2D3B42] mt-0.5">
                  {campaign.kocRequirements?.minFollowers ||
                    '500K người theo dõi'}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-medium text-slate-400">
                  Lĩnh vực
                </div>
                <div className="text-xs font-extrabold text-[#2D3B42] mt-0.5">
                  {campaign.kocRequirements?.niche || 'Làm đẹp, Đời sống'}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-medium text-slate-400">
                  Loại nội dung
                </div>
                <div className="text-xs font-extrabold text-[#2D3B42] mt-0.5">
                  {campaign.kocRequirements?.contentType ||
                    'Video review + Story'}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-medium text-slate-400">
                  Khu vực & độ tuổi
                </div>
                <div className="text-xs font-extrabold text-[#2D3B42] mt-0.5">
                  {campaign.kocRequirements?.demographics ||
                    'Toàn quốc · 18 – 30'}
                </div>
              </div>
            </div>

            {/* Sản phẩm bàn giao */}
            <div className="pt-5 border-t border-slate-100 space-y-3">
              <div className="text-[11px] font-medium text-slate-400">
                Sản phẩm bàn giao
              </div>
              <div className="space-y-2">
                {campaign.deliverables && campaign.deliverables.length > 0 ? (
                  campaign.deliverables.map((d, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 text-xs font-semibold text-slate-700"
                    >
                      <div className="w-4 h-4 rounded-full bg-violet-100 text-[#7C3AED] flex items-center justify-center shrink-0">
                        <svg
                          className="w-2.5 h-2.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <span>{d.type}</span>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700">
                      <div className="w-4 h-4 rounded-full bg-violet-100 text-[#7C3AED] flex items-center justify-center shrink-0">
                        <svg
                          className="w-2.5 h-2.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3.5"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <span>1 video TikTok ≥ 60 giây</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700">
                      <div className="w-4 h-4 rounded-full bg-violet-100 text-[#7C3AED] flex items-center justify-center shrink-0">
                        <svg
                          className="w-2.5 h-2.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3.5"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <span>3 ảnh feed Instagram</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700">
                      <div className="w-4 h-4 rounded-full bg-violet-100 text-[#7C3AED] flex items-center justify-center shrink-0">
                        <svg
                          className="w-2.5 h-2.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3.5"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <span>2 story gắn link mua hàng</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols on desktop) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card C: Tiến độ thực hiện */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
            <h2 className="text-sm font-extrabold text-[#2D3B42]">
              Tiến độ thực hiện
            </h2>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-[#2D3B42]">
                  {kocStats.registered}
                </span>
                <span className="text-slate-400 font-bold text-sm">
                  / {campaign.kocTarget} slot
                </span>
              </div>
              <div className="text-xs font-medium text-slate-400 mt-0.5">
                KOC đã đăng ký
              </div>
            </div>

            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#7C3AED] to-[#EC4899] rounded-full"
                style={{
                  width: `${(kocStats.registered / campaign.kocTarget) * 100}%`,
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
              <div>
                <div className="text-xl font-extrabold text-[#10B981]">
                  {kocStats.approved}
                </div>
                <div className="text-xs font-medium text-slate-400">
                  Đã duyệt
                </div>
              </div>
              <div>
                <div className="text-xl font-extrabold text-[#3B82F6]">
                  {kocStats.submitted}
                </div>
                <div className="text-xs font-medium text-slate-400">
                  Đã nộp bài
                </div>
              </div>
            </div>
          </div>

          {/* Card D: Kết quả chiến dịch */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
            <h2 className="text-sm font-extrabold text-[#2D3B42]">
              Kết quả chiến dịch
            </h2>
            <div className="grid grid-cols-2 gap-y-4 gap-x-6">
              <div>
                <div className="text-[11px] font-medium text-slate-400">
                  Tiếp cận
                </div>
                <div className="text-xl font-extrabold text-[#2D3B42] mt-0.5">
                  {results.reach}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-medium text-slate-400">
                  Hiển thị
                </div>
                <div className="text-xl font-extrabold text-[#2D3B42] mt-0.5">
                  {results.impressions}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-medium text-slate-400">
                  Tương tác
                </div>
                <div className="text-xl font-extrabold text-[#2D3B42] mt-0.5">
                  {results.engagementRate}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-medium text-slate-400">
                  Chuyển đổi
                </div>
                <div className="text-xl font-extrabold text-[#2D3B42] mt-0.5">
                  {results.conversionRate}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Bottom Section: KOC đã đăng ký (14) */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-5">
        <h2 className="text-base font-extrabold text-[#2D3B42]">
          KOC đã đăng ký{' '}
          <span className="text-slate-400 text-sm font-semibold">
            ({registeredKocs.length})
          </span>
        </h2>

        <div className="divide-y divide-slate-100">
          {registeredKocs.map((koc) => (
            <div
              key={koc.id}
              className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 px-2 rounded-2xl transition-colors"
            >
              {/* KOC Info */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl ${koc.avatarBg} text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs`}
                >
                  {koc.initials}
                </div>
                <div>
                  <div className="text-xs font-extrabold text-[#2D3B42]">
                    {koc.name}
                  </div>
                  <div className="text-[11px] font-medium text-slate-400">
                    {koc.handle}
                  </div>
                </div>
              </div>

              {/* Platforms & Status badge */}
              <div className="flex items-center gap-3 self-end sm:self-center">
                {/* Platform pills */}
                <div className="flex items-center gap-1.5">
                  {koc.platforms.map((p) => {
                    if (p === 'TikTok') {
                      return (
                        <span
                          key={p}
                          className="bg-black text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                        >
                          TikTok
                        </span>
                      );
                    }
                    if (p === 'Instagram') {
                      return (
                        <span
                          key={p}
                          className="bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCB045] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                        >
                          Instagram
                        </span>
                      );
                    }
                    return (
                      <span
                        key={p}
                        className="bg-[#FF0000] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                      >
                        YouTube
                      </span>
                    );
                  })}
                </div>

                {/* Status */}
                {koc.status === 'Đã duyệt' && (
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#ECFDF5] text-[#10B981] border border-[#10B981]/20">
                    Đã duyệt
                  </span>
                )}
                {koc.status === 'Đã nộp bài' && (
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#EFF6FF] text-[#3B82F6] border border-[#3B82F6]/20">
                    Đã nộp bài
                  </span>
                )}
                {koc.status === 'Chờ duyệt' && (
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#FEF9C3] text-[#B45309] border border-[#F59E0B]/20">
                    Chờ duyệt
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
