'use client';
import { formatCreatorMetric } from '../creator-format';
import { AccountStatusAction } from '@/features/admin/components/account-status-action';
import {
  CREATOR_ACCOUNT_STATES,
  CREATOR_REVENUE_DESCRIPTION,
} from '../creator-domain';

import { IconEye } from '@/components/ui/icons';
import { KocPlatformBadge } from './koc-platform-badge';
import { KocStatusBadge } from './koc-status-badge';
import type { KocItem } from '../types';

type KocCardsViewProps = {
  items: KocItem[];
  onView: (koc: KocItem) => void;
  onStatusChanged: () => void;
};

export function KocCardsView({
  items,
  onView,
  onStatusChanged,
}: KocCardsViewProps) {
  return (
    <div className="grid gap-4 p-4 sm:p-5 md:grid-cols-2 xl:grid-cols-4">
      {items.map((koc) => (
        <div
          key={koc.id}
          className="flex flex-col justify-between rounded-[22px] bg-white/75 p-5 ring-1 ring-[#2D3B42]/8 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-xl hover:shadow-[#2D3B42]/5"
        >
          {/* Header of Card */}
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${koc.avatarGradient} font-mono text-sm font-extrabold text-white shadow-sm`}
                >
                  {koc.initials}
                </span>
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => onView(koc)}
                    className="max-w-full truncate rounded text-left font-bold text-[#2D3B42] hover:text-[#EF4623] focus-visible:outline-2 focus-visible:outline-[#EF4623]"
                  >
                    {koc.name}
                  </button>
                  <p className="truncate font-mono text-xs font-semibold text-[#8A7768]">
                    {koc.handle}
                  </p>
                </div>
              </div>

              <KocStatusBadge status={koc.status} />
            </div>

            {/* Category */}
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="font-semibold text-[#8A7768]">Lĩnh vực:</span>
              <span className="rounded-lg bg-white px-2 py-0.5 font-bold text-[#5C5049] ring-1 ring-[#2D3B42]/10 whitespace-nowrap">
                {koc.category}
              </span>
            </div>

            {/* Followers / Socials */}
            <div className="mt-3 space-y-1.5">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#8A7768]">
                Nền tảng MXH
              </p>
              <div className="flex flex-wrap gap-1.5">
                {koc.followers.length === 0 ? '—' : null}
                {koc.followers.map((f) => (
                  <KocPlatformBadge
                    key={f.platform}
                    platform={f.platform}
                    count={f.count}
                  />
                ))}
              </div>
            </div>

            {/* Engagement */}
            <div className="mt-3 space-y-1">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#8A7768]">
                Tương tác trung bình
              </p>
              <div className="flex flex-wrap gap-2">
                {koc.engagement.length === 0 ? '—' : null}
                {koc.engagement.map((eng) => (
                  <span
                    key={eng.platform}
                    className="rounded-lg bg-white/80 px-2 py-0.5 text-xs font-semibold text-[#5C5049] ring-1 ring-[#2D3B42]/8"
                  >
                    {eng.platform}:{' '}
                    <strong className="font-mono text-emerald-600">
                      {eng.rate}
                    </strong>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Metrics & Actions */}
          <div className="mt-5 border-t border-[#2D3B42]/8 pt-4">
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="rounded-xl bg-[#2D3B42]/4 p-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A7768]">
                  Chiến dịch hoàn thành
                </p>
                <p className="font-mono text-base font-extrabold text-[#2D3B42] tnum">
                  {koc.completedCampaigns ?? '—'}
                </p>
              </div>

              <div className="rounded-xl bg-[#2D3B42]/4 p-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A7768]">
                  Doanh thu (VND)
                </p>
                <p className="font-mono text-base font-extrabold text-[#EF4623] tnum">
                  <span title={CREATOR_REVENUE_DESCRIPTION}>
                    {koc.totalRevenue == null
                      ? '—'
                      : `${formatCreatorMetric(koc.totalRevenue, 'vi')} ₫`}
                  </span>
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-end gap-1.5 border-t border-[#2D3B42]/6 pt-3">
              <AccountStatusAction
                id={koc.id}
                name={koc.name}
                status={CREATOR_ACCOUNT_STATES[koc.status].code}
                kind="creator"
                onChanged={onStatusChanged}
              />
              <button
                type="button"
                onClick={() => onView(koc)}
                title="Xem chi tiết"
                className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold text-[#5C5049] transition-colors hover:bg-white hover:text-[#2D3B42]"
              >
                <IconEye className="h-4 w-4" />
                <span>Xem</span>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
