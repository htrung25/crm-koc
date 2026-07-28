"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MOCK_BRANDS } from "@/lib/mock";
import {
  PageHeading,
  StatCard,
  FilterChip,
  StatusBadge,
  ViewButton,
} from "@/components/ui";

export default function AdminBrandsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<string>("all");

  const filteredBrands =
    filter === "all"
      ? MOCK_BRANDS
      : MOCK_BRANDS.filter((b) => b.status === filter);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <PageHeading
          title="Quản lý thương hiệu"
          description="Danh sách các đối tác doanh nghiệp, nhãn hàng đang chạy chiến dịch hợp tác KOC."
        />
        <button
          type="button"
          className="flex items-center gap-2 self-start sm:self-auto rounded-[14px] bg-[#6C4CF1] px-4 py-3 text-sm font-bold text-white shadow-[0_6px_16px_rgba(108,76,241,.3)] hover:bg-[#5A3CD8] transition"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span>Thêm thương hiệu</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Tổng thương hiệu"
          value={MOCK_BRANDS.length}
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6C4CF1" strokeWidth="2">
              <path d="M3 21V7l9-4 9 4v14" />
              <path d="M3 21h18" />
            </svg>
          }
          iconClassName="bg-[#EEE9FF]"
        />
        <StatCard
          label="Đối tác đang hoạt động"
          value={MOCK_BRANDS.filter((b) => b.status === "active").length}
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0E9F6E" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          }
          iconClassName="bg-[#DEF7EC]"
        />
        <StatCard
          label="Tổng số chiến dịch"
          value={MOCK_BRANDS.reduce((acc, b) => acc + b.campaignCount, 0)}
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FF5C8A" strokeWidth="2">
              <path d="m3 11 18-5v12L3 14v-3z" />
            </svg>
          }
          iconClassName="bg-[#FCE7F3]"
        />
        <StatCard
          label="Tương tác trung bình"
          value="5.5%"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16D3B0" strokeWidth="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          }
          iconClassName="bg-[#E6F9F5]"
        />
      </div>

      {/* Filter Toolbar */}
      <div className="flex items-center gap-2 rounded-2xl border border-[#F0EFF6] bg-white p-4 shadow-card">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
          Tất cả ({MOCK_BRANDS.length})
        </FilterChip>
        <FilterChip active={filter === "active"} onClick={() => setFilter("active")}>
          Đang hợp tác ({MOCK_BRANDS.filter((b) => b.status === "active").length})
        </FilterChip>
      </div>

      {/* Brands Table View */}
      <div className="rounded-[18px] border border-[#F0EFF6] bg-white shadow-card overflow-hidden">
        <div className="w-full overflow-x-auto scrollbar-thin">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="border-b border-[#F0EFF6] bg-[#FAFAFD] text-[11.5px] font-bold text-[#9C99B0] uppercase tracking-[0.5px]">
                <th className="px-6 py-3.5">Thương hiệu</th>
                <th className="px-4 py-3.5">Ngành hàng</th>
                <th className="px-4 py-3.5 text-center">Số chiến dịch</th>
                <th className="px-4 py-3.5 text-center">KOC hợp tác</th>
                <th className="px-4 py-3.5 text-right">Ngân sách</th>
                <th className="px-4 py-3.5 text-center">Trạng thái</th>
                <th className="px-6 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F4F4F9] text-[13.5px]">
              {filteredBrands.map((brand) => (
                <tr
                  key={brand.id}
                  onClick={() => router.push(`/admin/brands/${brand.id}`)}
                  className="hover:bg-[#F9F8FD] cursor-pointer transition"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-[12px] grid place-items-center text-white font-bold text-sm bg-gradient-to-br ${brand.bg} shrink-0`}
                      >
                        {brand.initials}
                      </div>
                      <div className="font-bold text-[#1A1830]">{brand.name}</div>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-semibold text-[#4A4762]">
                    {brand.industryVi}
                  </td>
                  <td className="px-4 py-4 text-center font-mono font-bold text-[#1A1830]">
                    {brand.campaignCount}
                  </td>
                  <td className="px-4 py-4 text-center font-mono font-bold text-[#16D3B0]">
                    {brand.kocCount}
                  </td>
                  <td className="px-4 py-4 text-right font-mono font-bold text-[#6C4CF1]">
                    {brand.budget}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <StatusBadge label={brand.statusLabelVi} tone={brand.statusStyle as any} />
                  </td>
                  <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <ViewButton onClick={() => router.push(`/admin/brands/${brand.id}`)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
