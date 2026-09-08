'use client';

import { KocPlatformBadge } from './koc-platform-badge';
import { KocStatusBadge } from './koc-status-badge';
import type { KocItem } from '../types';

type KocDetailModalProps = {
  koc: KocItem | null;
  onClose: () => void;
  onEdit: (koc: KocItem) => void;
};

export function KocDetailModal({ koc, onClose, onEdit }: KocDetailModalProps) {
  if (!koc) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md overflow-hidden rounded-[28px] glass bg-[#FAF7F2]/95 p-6 sm:p-7 shadow-2xl ring-1 ring-white/60">
        <div className="flex items-start justify-between gap-4 border-b border-[#2D3B42]/10 pb-4">
          <div className="flex items-center gap-3">
            <span
              className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${koc.avatarGradient} font-mono text-sm font-extrabold text-white shadow-sm`}
            >
              {koc.initials}
            </span>
            <div>
              <h3 className="text-base font-extrabold text-[#2D3B42]">
                {koc.name}
              </h3>
              <p className="font-mono text-xs font-semibold text-[#8A7768]">
                {koc.handle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-xl text-[#8A7768] hover:bg-white/80 hover:text-[#2D3B42]"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div className="flex items-center justify-between rounded-2xl bg-white/70 p-3.5 ring-1 ring-[#2D3B42]/8">
            <span className="text-xs font-bold text-[#8A7768]">Trạng thái</span>
            <KocStatusBadge status={koc.status} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/70 p-3 ring-1 ring-[#2D3B42]/8">
              <span className="text-[11px] font-bold text-[#8A7768] uppercase tracking-wider block">
                Lĩnh vực
              </span>
              <span className="mt-1 text-sm font-extrabold text-[#2D3B42] block">
                {koc.category}
              </span>
            </div>

            <div className="rounded-2xl bg-white/70 p-3 ring-1 ring-[#2D3B42]/8">
              <span className="text-[11px] font-bold text-[#8A7768] uppercase tracking-wider block">
                Chiến dịch
              </span>
              <span className="mt-1 font-mono text-sm font-extrabold text-[#2D3B42] block">
                {koc.campaigns} đã tham gia
              </span>
            </div>
          </div>

          <div className="rounded-2xl bg-white/70 p-3 ring-1 ring-[#2D3B42]/8">
            <span className="text-[11px] font-bold text-[#8A7768] uppercase tracking-wider block">
              Tổng GMV / Doanh thu
            </span>
            <span className="mt-1 font-mono text-lg font-extrabold text-[#EF4623] block">
              {koc.revenue} VNĐ
            </span>
          </div>

          {/* Social Platforms & Engagement */}
          <div className="rounded-2xl bg-white/70 p-3.5 ring-1 ring-[#2D3B42]/8 space-y-2.5">
            <span className="text-xs font-bold text-[#8A7768] uppercase tracking-wider block">
              Kênh mạng xã hội & Tương tác
            </span>
            <div className="space-y-2">
              {koc.followers.map((f) => {
                const eng = koc.engagement.find(
                  (e) => e.platform === f.platform
                );
                return (
                  <div
                    key={f.platform}
                    className="flex items-center justify-between border-t border-[#2D3B42]/6 pt-2 first:border-0 first:pt-0"
                  >
                    <KocPlatformBadge platform={f.platform} count={f.count} />
                    <span className="text-xs font-semibold text-[#5C5049]">
                      ER:{' '}
                      <strong className="font-mono text-emerald-600">
                        {eng?.rate ?? 'N/A'}
                      </strong>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Contact info if available */}
          {(koc.email || koc.phone) && (
            <div className="rounded-2xl bg-white/70 p-3 ring-1 ring-[#2D3B42]/8 space-y-1">
              <span className="text-[11px] font-bold text-[#8A7768] uppercase tracking-wider block">
                Thông tin liên hệ
              </span>
              {koc.email && (
                <p className="text-xs font-semibold text-[#5C5049]">
                  Email: <span className="font-medium">{koc.email}</span>
                </p>
              )}
              {koc.phone && (
                <p className="text-xs font-semibold text-[#5C5049]">
                  Điện thoại:{' '}
                  <span className="font-mono font-medium">{koc.phone}</span>
                </p>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-2 border-t border-[#2D3B42]/10 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-xs font-bold text-[#5C5049] hover:bg-white/80"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onEdit(koc);
            }}
            className="rounded-xl bg-gradient-to-br from-[#EF4623] to-[#D8410F] px-4 py-2.5 text-xs font-extrabold text-white shadow-md shadow-[#EF4623]/25 hover:shadow-lg hover:shadow-[#EF4623]/35"
          >
            Chỉnh sửa
          </button>
        </div>
      </div>
    </div>
  );
}
