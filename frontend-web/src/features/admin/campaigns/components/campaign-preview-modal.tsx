'use client';

import { useEffect } from 'react';
import type { CampaignItem } from '../types';

interface CampaignPreviewModalProps {
  campaign: CampaignItem | null;
  onClose: () => void;
  onApprove: (campaign: CampaignItem) => void;
  onReject: (campaign: CampaignItem) => void;
}

export function CampaignPreviewModal({
  campaign,
  onClose,
  onApprove,
  onReject,
}: CampaignPreviewModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (campaign) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [campaign, onClose]);

  if (!campaign) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl ${campaign.brandAvatarBg} text-white font-extrabold text-base flex items-center justify-center shrink-0 shadow-sm`}
            >
              {campaign.brandAvatarInitials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-[#2D3B42]">
                  {campaign.title}
                </h2>
                {campaign.status === 'active' && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#ECFDF5] text-[#10B981] border border-[#10B981]/20">
                    Đang chạy
                  </span>
                )}
                {campaign.status === 'pending' && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FEF9C3] text-[#B45309] border border-[#F59E0B]/20">
                    Chờ duyệt
                  </span>
                )}
                {campaign.status === 'paused' && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                    Tạm dừng
                  </span>
                )}
                {campaign.status === 'overdue' && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FFE4E6] text-[#E11D48] border border-[#E11D48]/20">
                    Quá hạn
                  </span>
                )}
                {campaign.status === 'rejected' && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-600 border border-red-200">
                    Từ chối
                  </span>
                )}
                {campaign.status === 'completed' && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-600 border border-blue-200">
                    Hoàn thành
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Thương hiệu:{' '}
                <span className="font-bold text-slate-700">
                  {campaign.brandName}
                </span>{' '}
                {campaign.category && `• ${campaign.category}`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-slate-600">
          {/* Metrics summary bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div>
              <div className="text-[11px] font-semibold text-slate-400">
                Ngân sách
              </div>
              <div className="text-base font-extrabold text-[#2D3B42]">
                {campaign.budgetFormatted}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400">
                KOC đã nhận
              </div>
              <div className="text-base font-extrabold text-[#2D3B42]">
                {campaign.kocCurrent}{' '}
                <span className="text-xs text-slate-400 font-medium">
                  /{campaign.kocTarget}
                </span>
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400">
                Hạn chót
              </div>
              <div className="text-base font-extrabold text-[#2D3B42]">
                {campaign.deadline}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400">
                Tiến độ chiến dịch
              </div>
              <div className="text-base font-extrabold text-[#7C3AED]">
                {campaign.progress}%
              </div>
            </div>
          </div>

          {/* Description / Brief */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Mô tả chiến dịch & Yêu cầu Brief
            </h3>
            <p className="text-slate-700 leading-relaxed bg-white p-3.5 rounded-xl border border-slate-100">
              {campaign.description || 'Chưa có mô tả chi tiết.'}
            </p>
          </div>

          {/* Target Audience & KOC Requirements */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Đối tượng khách hàng mục tiêu
              </h3>
              <div className="p-3 bg-white rounded-xl border border-slate-100 text-xs font-medium text-slate-700">
                {campaign.targetAudience || 'Chưa có thông tin.'}
              </div>
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Yêu cầu KOC tham gia
              </h3>
              <div className="p-3 bg-white rounded-xl border border-slate-100 text-xs font-medium text-slate-700">
                Tối thiểu: {campaign.minFollowers || '10.000+ followers'}
              </div>
            </div>
          </div>

          {/* Nền tảng & Deliverables */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Nền tảng & Hạng mục bàn giao (Deliverables)
            </h3>
            <div className="flex flex-wrap gap-2 mb-2">
              {campaign.platforms.map((p) => (
                <span
                  key={p}
                  className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200"
                >
                  {p}
                </span>
              ))}
            </div>

            {campaign.deliverables && campaign.deliverables.length > 0 && (
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden bg-white">
                {campaign.deliverables.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 text-xs flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-bold text-slate-800">
                        {item.type} (x{item.count})
                      </div>
                      <div className="text-slate-500 mt-0.5">
                        {item.description}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-violet-50 text-[#7C3AED] font-bold text-[11px] shrink-0">
                      Bắt buộc
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-full text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-colors"
          >
            Đóng
          </button>

          {campaign.status === 'pending' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onReject(campaign);
                }}
                className="px-5 py-2.5 rounded-full text-xs font-bold text-white bg-[#EF4444] hover:bg-red-600 shadow-sm transition-all cursor-pointer"
              >
                Từ chối chiến dịch
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onApprove(campaign);
                }}
                className="px-5 py-2.5 rounded-full text-xs font-bold text-white bg-[#10B981] hover:bg-emerald-600 shadow-sm shadow-emerald-200 transition-all cursor-pointer"
              >
                Duyệt chiến dịch ngay
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
