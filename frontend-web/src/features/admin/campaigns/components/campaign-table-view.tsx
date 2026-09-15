'use client';

import type { CampaignItem } from '../types';

interface CampaignTableViewProps {
  campaigns: CampaignItem[];
  onViewDetail: (campaign: CampaignItem) => void;
  onApprove: (campaign: CampaignItem) => void;
  onReject: (campaign: CampaignItem) => void;
}

export function CampaignTableView({
  campaigns,
  onViewDetail,
  onApprove,
  onReject,
}: CampaignTableViewProps) {
  if (campaigns.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-violet-50 text-[#7C3AED] mx-auto flex items-center justify-center mb-3">
          <svg
            className="w-8 h-8"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="m3 11 15-6.5v15L3 13z" />
            <path d="M3 11H2.5a1.5 1.5 0 0 0 0 3H3z" />
            <path d="M7.5 14.5V19a1.5 1.5 0 0 0 3 0v-3.7" />
          </svg>
        </div>
        <h3 className="text-base font-bold text-[#2D3B42] mb-1">
          Không tìm thấy chiến dịch nào
        </h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Không có chiến dịch nào khớp với bộ lọc hoặc từ khoá tìm kiếm hiện tại.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[960px]">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/40">
              <th className="py-4 px-6 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                Chiến dịch
              </th>
              <th className="py-4 px-4 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                Nền tảng
              </th>
              <th className="py-4 px-4 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                Ngân sách
              </th>
              <th className="py-4 px-4 text-[11px] font-bold tracking-wider text-slate-400 uppercase text-center">
                KOC
              </th>
              <th className="py-4 px-4 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                Hạn chót
              </th>
              <th className="py-4 px-4 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                Tiến độ
              </th>
              <th className="py-4 px-4 text-[11px] font-bold tracking-wider text-slate-400 uppercase text-center">
                Trạng thái
              </th>
              <th className="py-4 px-6 text-[11px] font-bold tracking-wider text-slate-400 uppercase text-right">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {campaigns.map((camp) => {
              return (
                <tr
                  key={camp.id}
                  className="hover:bg-slate-50/70 transition-colors group"
                >
                  {/* Cột 1: Chiến dịch */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-11 h-11 rounded-2xl ${camp.brandAvatarBg} text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-sm`}
                      >
                        {camp.brandAvatarInitials}
                      </div>
                      <div>
                        <button
                          type="button"
                          onClick={() => onViewDetail(camp)}
                          className="font-extrabold text-[#2D3B42] text-sm hover:text-[#7C3AED] transition-colors text-left block"
                        >
                          {camp.title}
                        </button>
                        <div className="text-xs text-slate-400 font-medium">
                          {camp.brandName}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Cột 2: Nền tảng (xếp dọc) */}
                  <td className="py-4 px-4">
                    <div className="flex flex-col gap-1.5 items-start">
                      {camp.platforms.map((platform) => {
                        if (platform === 'TikTok') {
                          return (
                            <span
                              key={platform}
                              className="bg-black text-white text-[11px] font-bold px-3 py-0.5 rounded-full inline-flex items-center gap-1.5 shadow-2xs"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                              TikTok
                            </span>
                          );
                        }
                        if (platform === 'Instagram') {
                          return (
                            <span
                              key={platform}
                              className="bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCB045] text-white text-[11px] font-bold px-3 py-0.5 rounded-full inline-flex items-center gap-1.5 shadow-2xs"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-yellow-200" />
                              Instagram
                            </span>
                          );
                        }
                        if (platform === 'YouTube') {
                          return (
                            <span
                              key={platform}
                              className="bg-[#FF0000] text-white text-[11px] font-bold px-3 py-0.5 rounded-full inline-flex items-center gap-1.5 shadow-2xs"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-white" />
                              YouTube
                            </span>
                          );
                        }
                        return (
                          <span
                            key={platform}
                            className="bg-[#1877F2] text-white text-[11px] font-bold px-3 py-0.5 rounded-full inline-flex items-center gap-1.5 shadow-2xs"
                          >
                            Facebook
                          </span>
                        );
                      })}
                    </div>
                  </td>

                  {/* Cột 3: Ngân sách */}
                  <td className="py-4 px-4 font-extrabold text-[#2D3B42] text-sm whitespace-nowrap">
                    {camp.budgetFormatted}
                  </td>

                  {/* Cột 4: KOC */}
                  <td className="py-4 px-4 text-center whitespace-nowrap">
                    <span className="font-extrabold text-[#2D3B42] text-sm">
                      {camp.kocCurrent}
                    </span>
                    <span className="text-slate-400 font-semibold text-xs">
                      /{camp.kocTarget}
                    </span>
                  </td>

                  {/* Cột 5: Hạn chót */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="font-bold text-slate-800 text-xs">
                      {camp.deadline}
                    </div>
                    {camp.daysRemaining > 0 ? (
                      <span className="inline-block text-[11px] font-semibold text-slate-500 bg-slate-100/90 px-2.5 py-0.5 rounded-full mt-1">
                        Còn {camp.daysRemaining} ngày
                      </span>
                    ) : camp.daysRemaining === 0 ? (
                      <span className="inline-block text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full mt-1 border border-amber-200/50">
                        Hôm nay
                      </span>
                    ) : (
                      <span className="inline-block text-[11px] font-semibold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full mt-1 border border-rose-200/50">
                        Quá hạn {Math.abs(camp.daysRemaining)} ngày
                      </span>
                    )}
                  </td>

                  {/* Cột 6: Tiến độ */}
                  <td className="py-4 px-4">
                    <div className="text-xs font-bold text-slate-500 mb-1">
                      {camp.progress}%
                    </div>
                    <div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#EC4899] transition-all duration-500"
                        style={{ width: `${Math.min(100, camp.progress)}%` }}
                      />
                    </div>
                  </td>

                  {/* Cột 7: Trạng thái */}
                  <td className="py-4 px-4 text-center whitespace-nowrap">
                    {camp.status === 'active' && (
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#ECFDF5] text-[#10B981] border border-[#10B981]/20">
                        Đang chạy
                      </span>
                    )}
                    {camp.status === 'pending' && (
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#FEF9C3] text-[#B45309] border border-[#F59E0B]/20">
                        Chờ duyệt
                      </span>
                    )}
                    {camp.status === 'paused' && (
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        Tạm dừng
                      </span>
                    )}
                    {camp.status === 'overdue' && (
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#FFE4E6] text-[#E11D48] border border-[#E11D48]/20">
                        Quá hạn
                      </span>
                    )}
                    {camp.status === 'rejected' && (
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-200">
                        Từ chối
                      </span>
                    )}
                    {camp.status === 'completed' && (
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200">
                        Hoàn thành
                      </span>
                    )}
                  </td>

                  {/* Cột 8: Thao tác */}
                  <td className="py-4 px-6 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Icon View Detail */}
                      <button
                        type="button"
                        onClick={() => onViewDetail(camp)}
                        title="Xem chi tiết chiến dịch"
                        className="p-1.5 text-[#7C3AED] hover:bg-violet-50 rounded-xl transition-all hover:scale-105 active:scale-95"
                      >
                        <svg
                          className="w-5 h-5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>

                      {/* Icon Checkmark (Approve) & Cross (Reject) cho trạng thái Chờ duyệt */}
                      {camp.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            onClick={() => onApprove(camp)}
                            title="Duyệt chiến dịch"
                            className="p-1.5 text-[#10B981] hover:bg-emerald-50 rounded-xl transition-all hover:scale-105 active:scale-95"
                          >
                            <svg
                              className="w-5 h-5"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => onReject(camp)}
                            title="Từ chối chiến dịch"
                            className="p-1.5 text-[#EF4444] hover:bg-rose-50 rounded-xl transition-all hover:scale-105 active:scale-95"
                          >
                            <svg
                              className="w-5 h-5"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
