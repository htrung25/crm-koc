'use client';

import { useState } from 'react';
import type { CampaignItem } from '../types';

interface CampaignDecisionModalProps {
  campaign: CampaignItem | null;
  mode: 'approve' | 'reject' | null;
  onClose: () => void;
  onConfirm: (
    campaignId: string,
    action: 'approve' | 'reject',
    reason?: string
  ) => void;
}

export function CampaignDecisionModal({
  campaign,
  mode,
  onClose,
  onConfirm,
}: CampaignDecisionModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!campaign || !mode) return null;

  const isApprove = mode === 'approve';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isApprove && !reason.trim()) {
      setError('Vui lòng nhập lý do từ chối chiến dịch.');
      return;
    }
    onConfirm(campaign.id, mode, reason.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5"
        role="dialog"
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
              isApprove
                ? 'bg-emerald-50 text-[#10B981]'
                : 'bg-rose-50 text-[#EF4444]'
            }`}
          >
            {isApprove ? (
              <svg
                className="w-6 h-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg
                className="w-6 h-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            )}
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[#2D3B42]">
              {isApprove ? 'Xác nhận duyệt chiến dịch' : 'Từ chối chiến dịch'}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {campaign.title} · {campaign.brandName}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isApprove ? (
            <p className="text-xs text-slate-600 leading-relaxed bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-100">
              Chiến dịch này sẽ chuyển sang trạng thái <strong>Đang chạy</strong>
              . Các KOC trên sàn sẽ thấy chiến dịch và có thể nộp đơn ứng
              tuyển.
            </p>
          ) : (
            <div className="space-y-2">
              <label
                htmlFor="reject-reason"
                className="block text-xs font-bold text-slate-700"
              >
                Lý do từ chối <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="reject-reason"
                rows={3}
                required
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setError('');
                }}
                placeholder="Nhập lý do từ chối (Ví dụ: Thiếu giấy phép công bố sản phẩm, ngân sách chưa hợp lý...)"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#EF4444] focus:ring-2 focus:ring-[#EF4444]/20 transition-all text-slate-800 placeholder:text-slate-400"
              />
              {error && <p className="text-[11px] text-rose-500 font-bold">{error}</p>}
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Huỷ
            </button>
            <button
              type="submit"
              className={`px-5 py-2 rounded-full text-xs font-bold text-white transition-all shadow-sm cursor-pointer ${
                isApprove
                  ? 'bg-[#10B981] hover:bg-emerald-600 shadow-emerald-200'
                  : 'bg-[#EF4444] hover:bg-rose-600 shadow-rose-200'
              }`}
            >
              {isApprove ? 'Duyệt chiến dịch' : 'Xác nhận từ chối'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
