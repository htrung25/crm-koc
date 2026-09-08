'use client';

import { IconBin, IconEye, IconPencil } from '@/components/ui/icons';
import { KocPlatformBadge } from './koc-platform-badge';
import { KocStatusBadge } from './koc-status-badge';
import type { KocItem } from '../types';

type KocTableViewProps = {
  items: KocItem[];
  onView: (koc: KocItem) => void;
  onEdit: (koc: KocItem) => void;
  onDelete: (koc: KocItem) => void;
};

export function KocTableView({
  items,
  onView,
  onEdit,
  onDelete,
}: KocTableViewProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[780px] border-collapse text-left">
        <thead>
          <tr className="bg-white/40 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#8A7768]">
            <th scope="col" className="px-5 py-4 whitespace-nowrap">
              KOC
            </th>
            <th scope="col" className="px-4 py-4 whitespace-nowrap">
              Nền tảng MXH
            </th>
            <th scope="col" className="px-4 py-4 whitespace-nowrap">
              Tương tác
            </th>
            <th scope="col" className="px-4 py-4 whitespace-nowrap">
              Lĩnh vực
            </th>
            <th scope="col" className="px-4 py-4 text-center whitespace-nowrap">
              Chiến dịch
            </th>
            <th scope="col" className="px-4 py-4 text-right whitespace-nowrap">
              Doanh thu
            </th>
            <th scope="col" className="px-4 py-4 text-center whitespace-nowrap">
              Trạng thái
            </th>
            <th scope="col" className="px-5 py-4 text-right whitespace-nowrap">
              Thao tác
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#2D3B42]/8 text-sm">
          {items.map((koc) => (
            <tr key={koc.id} className="transition-colors hover:bg-white/50">
              {/* KOC Info */}
              <td className="px-5 py-4.5 whitespace-nowrap">
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${koc.avatarGradient} font-mono text-xs font-extrabold text-white shadow-xs`}
                  >
                    {koc.initials}
                  </span>
                  <div className="leading-tight">
                    <p
                      className="font-bold text-[#2D3B42] hover:text-[#EF4623] cursor-pointer"
                      onClick={() => onView(koc)}
                    >
                      {koc.name}
                    </p>
                    <p className="font-mono text-xs font-medium text-[#8A7768]">
                      {koc.handle}
                    </p>
                  </div>
                </div>
              </td>

              {/* Nền tảng MXH (xếp hàng dọc) */}
              <td className="px-4 py-4.5 whitespace-nowrap">
                <div className="flex flex-col items-start gap-1">
                  {koc.followers.map((f) => (
                    <KocPlatformBadge
                      key={f.platform}
                      platform={f.platform}
                      count={f.count}
                    />
                  ))}
                </div>
              </td>

              {/* Engagement */}
              <td className="px-4 py-4.5 whitespace-nowrap">
                <div className="space-y-1">
                  {koc.engagement.map((eng) => (
                    <div
                      key={eng.platform}
                      className="flex items-center gap-1.5 text-xs font-semibold text-[#5C5049]"
                    >
                      <span className="text-[#8A7768] text-[11px]">
                        {eng.platform}
                      </span>
                      <span className="font-mono font-bold text-emerald-600 tnum">
                        {eng.rate}
                      </span>
                    </div>
                  ))}
                </div>
              </td>

              {/* Category (Lĩnh vực) - Clean text matching mockup, no wrapping */}
              <td className="px-4 py-4.5 whitespace-nowrap text-sm font-semibold text-[#5C5049]">
                {koc.category}
              </td>

              {/* Campaigns */}
              <td className="px-4 py-4.5 text-center whitespace-nowrap font-mono text-sm font-extrabold text-[#2D3B42] tnum">
                {koc.campaigns}
              </td>

              {/* Revenue */}
              <td className="px-4 py-4.5 text-right whitespace-nowrap font-mono text-sm font-extrabold text-[#2D3B42] tnum">
                {koc.revenue}
              </td>

              {/* Status */}
              <td className="px-4 py-4.5 text-center whitespace-nowrap">
                <KocStatusBadge status={koc.status} />
              </td>

              {/* Actions */}
              <td className="px-5 py-4.5 text-right whitespace-nowrap">
                <div className="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => onView(koc)}
                    title="Xem chi tiết"
                    aria-label={`Xem chi tiết ${koc.name}`}
                    className="grid h-8 w-8 place-items-center rounded-xl text-[#8A7768] transition-colors hover:bg-white/80 hover:text-[#2D3B42] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EF4623]/30"
                  >
                    <IconEye className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onEdit(koc)}
                    title="Chỉnh sửa"
                    aria-label={`Chỉnh sửa ${koc.name}`}
                    className="grid h-8 w-8 place-items-center rounded-xl text-[#8A7768] transition-colors hover:bg-white/80 hover:text-[#EF4623] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EF4623]/30"
                  >
                    <IconPencil className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onDelete(koc)}
                    title="Xoá"
                    aria-label={`Xoá ${koc.name}`}
                    className="grid h-8 w-8 place-items-center rounded-xl text-[#8A7768] transition-colors hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/30"
                  >
                    <IconBin className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
