"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MOCK_KOCS, type AccountStatus } from "@/lib/mock";
import { formatFollowers, formatCurrency } from "@/lib/utils/format";
import {
  PageHeading,
  StatCard,
  FilterChip,
  StatusBadge,
  PlatformBadge,
  ViewButton,
} from "@/components/ui";

export default function AdminKocsPage() {
  const router = useRouter();
  const [layout, setLayout] = useState<"table" | "cards">("table");
  const [filter, setFilter] = useState<string>("all");

  const filteredKocs =
    filter === "all"
      ? MOCK_KOCS
      : MOCK_KOCS.filter((k) => k.status === filter);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <PageHeading
          title="Danh sách KOC"
          description="Quản lý hồ sơ, chỉ số hiệu suất và theo dõi doanh thu của các KOC trong hệ thống."
        />
        <button
          type="button"
          className="flex items-center gap-2 self-start sm:self-auto rounded-[14px] bg-[#6C4CF1] px-4 py-3 text-sm font-bold text-white shadow-[0_6px_16px_rgba(108,76,241,.3)] hover:bg-[#5A3CD8] transition"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span>Thêm KOC mới</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Tổng số KOC"
          value={MOCK_KOCS.length}
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6C4CF1" strokeWidth="2">
              <circle cx="9" cy="8" r="3.2" />
              <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
            </svg>
          }
          iconClassName="bg-[#EEE9FF]"
        />
        <StatCard
          label="KOC Đang hoạt động"
          value={MOCK_KOCS.filter((k) => k.status === "active").length}
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0E9F6E" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          }
          iconClassName="bg-[#DEF7EC]"
        />
        <StatCard
          label="Đang chờ phê duyệt"
          value={MOCK_KOCS.filter((k) => k.status === "pending").length}
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#96700A" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 3" />
            </svg>
          }
          iconClassName="bg-[#FDF6B2]"
        />
        <StatCard
          label="Doanh thu tạo ra"
          value={formatCurrency(MOCK_KOCS.reduce((acc, k) => acc + k.revenue, 0))}
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FF5C8A" strokeWidth="2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
          iconClassName="bg-[#FCE7F3]"
        />
      </div>

      {/* Toolbar & Filter Chips */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-[#F0EFF6] bg-white p-4 shadow-card">
        <div className="flex flex-wrap items-center gap-2">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
            Tất cả ({MOCK_KOCS.length})
          </FilterChip>
          <FilterChip active={filter === "active"} onClick={() => setFilter("active")}>
            Đang hoạt động ({MOCK_KOCS.filter((k) => k.status === "active").length})
          </FilterChip>
          <FilterChip active={filter === "pending"} onClick={() => setFilter("pending")}>
            Chờ duyệt ({MOCK_KOCS.filter((k) => k.status === "pending").length})
          </FilterChip>
          <FilterChip active={filter === "paused"} onClick={() => setFilter("paused")}>
            Tạm dừng ({MOCK_KOCS.filter((k) => k.status === "paused").length})
          </FilterChip>
        </div>

        {/* Layout Switcher */}
        <div className="flex items-center rounded-xl border border-[#ECEBF3] bg-[#F4F4F9] p-1 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setLayout("table")}
            className={`p-1.5 rounded-lg transition ${
              layout === "table" ? "bg-white text-[#6C4CF1] shadow-xs" : "text-[#9C99B0]"
            }`}
            title="Chế độ bảng"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setLayout("cards")}
            className={`p-1.5 rounded-lg transition ${
              layout === "cards" ? "bg-white text-[#6C4CF1] shadow-xs" : "text-[#9C99B0]"
            }`}
            title="Chế độ thẻ"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
            </svg>
          </button>
        </div>
      </div>

      {/* KOC Data View */}
      {layout === "table" ? (
        <div className="rounded-[18px] border border-[#F0EFF6] bg-white shadow-card overflow-hidden">
          <div className="w-full overflow-x-auto scrollbar-thin">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-[#F0EFF6] bg-[#FAFAFD] text-[11.5px] font-bold text-[#9C99B0] uppercase tracking-[0.5px]">
                  <th className="px-6 py-3.5">KOC</th>
                  <th className="px-4 py-3.5">Danh mục</th>
                  <th className="px-4 py-3.5">Nền tảng</th>
                  <th className="px-4 py-3.5 text-right">Followers</th>
                  <th className="px-4 py-3.5 text-right">Engage %</th>
                  <th className="px-4 py-3.5 text-right">Doanh thu</th>
                  <th className="px-4 py-3.5 text-center">Trạng thái</th>
                  <th className="px-6 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4F4F9] text-[13.5px]">
                {filteredKocs.map((koc) => (
                  <tr
                    key={koc.id}
                    onClick={() => router.push(`/admin/kocs/${koc.id}`)}
                    className="hover:bg-[#F9F8FD] cursor-pointer transition"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-[12px] grid place-items-center text-white font-bold text-sm bg-gradient-to-br ${koc.avatarBg} shrink-0`}
                        >
                          {koc.initials}
                        </div>
                        <div>
                          <div className="font-bold text-[#1A1830]">{koc.name}</div>
                          <div className="text-xs font-semibold text-[#9C99B0]">{koc.handle}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 font-semibold text-[#4A4762]">
                      {koc.categoryVi}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-1.5 flex-wrap">
                        {koc.platforms.map((p) => (
                          <PlatformBadge key={p} name={p} />
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right font-mono font-bold text-[#1A1830]">
                      {formatFollowers(koc.followers)}
                    </td>
                    <td className="px-4 py-4 text-right font-mono font-bold text-[#16D3B0]">
                      {koc.engagementRate}%
                    </td>
                    <td className="px-4 py-4 text-right font-mono font-bold text-[#6C4CF1]">
                      {formatCurrency(koc.revenue)}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <StatusBadge label={koc.statusLabelVi} tone={koc.statusStyle as any} />
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <ViewButton onClick={() => router.push(`/admin/kocs/${koc.id}`)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredKocs.map((koc) => (
            <div
              key={koc.id}
              onClick={() => router.push(`/admin/kocs/${koc.id}`)}
              className="rounded-2xl border border-[#F0EFF6] bg-white p-5 shadow-card hover:border-[#6C4CF1]/30 cursor-pointer transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-[14px] grid place-items-center text-white font-extrabold text-base bg-gradient-to-br ${koc.avatarBg} shrink-0`}
                    >
                      {koc.initials}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-[#1A1830]">{koc.name}</h3>
                      <p className="text-xs font-semibold text-[#9C99B0]">{koc.handle}</p>
                    </div>
                  </div>
                  <StatusBadge label={koc.statusLabelVi} tone={koc.statusStyle as any} />
                </div>

                <div className="grid grid-cols-2 gap-3 py-3 border-y border-[#F4F4F9] my-3">
                  <div>
                    <span className="text-[11px] font-semibold text-[#9C99B0]">Followers</span>
                    <div className="font-mono text-base font-bold text-[#1A1830]">
                      {formatFollowers(koc.followers)}
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-[#9C99B0]">Doanh thu</span>
                    <div className="font-mono text-base font-bold text-[#6C4CF1]">
                      {formatCurrency(koc.revenue)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex gap-1">
                  {koc.platforms.map((p) => (
                    <PlatformBadge key={p} name={p} />
                  ))}
                </div>
                <Link
                  href={`/admin/kocs/${koc.id}`}
                  className="text-xs font-bold text-[#6C4CF1] hover:underline"
                >
                  Xem chi tiết →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
