"use client";

import { use } from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { MOCK_BRANDS } from "@/lib/mock";
import { StatusBadge, DetailCard, InfoRow } from "@/components/ui";

export default function BrandDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const brandId = parseInt(resolvedParams.id, 10);
  const brand = MOCK_BRANDS.find((b) => b.id === brandId);

  if (!brand) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        type="button"
        onClick={() => router.push("/admin/brands")}
        className="inline-flex items-center gap-2 text-sm font-bold text-[#6C4CF1] hover:text-[#5A3CD8] transition"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="m15 18-6-6 6-6" />
        </svg>
        <span>Quay lại danh sách thương hiệu</span>
      </button>

      {/* Profile Header Card */}
      <div className="rounded-[20px] border border-[#F0EFF6] bg-white shadow-card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-5">
            <div
              className={`w-[72px] h-[72px] rounded-[20px] grid place-items-center text-white font-extrabold text-2xl shadow-md bg-gradient-to-br ${brand.bg} shrink-0`}
            >
              {brand.initials}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-extrabold text-[#1A1830]">
                  {brand.name}
                </h1>
                <StatusBadge label={brand.statusLabelVi} tone={brand.statusStyle as any} />
              </div>
              <p className="text-sm font-semibold text-[#9C99B0] mt-1">{brand.industryVi}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="px-4 py-2.5 rounded-xl border border-[#ECEBF3] bg-white text-sm font-bold text-[#4A4762] hover:bg-[#F4F4F9] transition"
            >
              Lịch sử giao dịch
            </button>
            <button
              type="button"
              className="px-4 py-2.5 rounded-xl bg-[#6C4CF1] text-white text-sm font-bold shadow-md hover:bg-[#5A3CD8] transition"
            >
              Phê duyệt ngân sách
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[#F0EFF6] bg-white p-5 shadow-card">
          <span className="text-xs font-semibold text-[#9C99B0]">Tổng chiến dịch</span>
          <div className="font-mono text-2xl font-bold text-[#1A1830] mt-1">
            {brand.campaignCount}
          </div>
        </div>
        <div className="rounded-2xl border border-[#F0EFF6] bg-white p-5 shadow-card">
          <span className="text-xs font-semibold text-[#9C99B0]">KOC đã làm việc</span>
          <div className="font-mono text-2xl font-bold text-[#16D3B0] mt-1">
            {brand.kocCount}
          </div>
        </div>
        <div className="rounded-2xl border border-[#F0EFF6] bg-white p-5 shadow-card">
          <span className="text-xs font-semibold text-[#9C99B0]">Ngân sách chiến dịch</span>
          <div className="font-mono text-2xl font-bold text-[#6C4CF1] mt-1">
            {brand.budget}
          </div>
        </div>
        <div className="rounded-2xl border border-[#F0EFF6] bg-white p-5 shadow-card">
          <span className="text-xs font-semibold text-[#9C99B0]">Tương tác trung bình</span>
          <div className="font-mono text-2xl font-bold text-[#FF5C8A] mt-1">
            {brand.avgEngage}
          </div>
        </div>
      </div>

      {/* Campaigns list inside Brand */}
      <DetailCard title="Chiến dịch đang thực hiện">
        <div className="space-y-3">
          {brand.campaigns.map((c, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-[#ECEBF3] bg-[#F4F4F9]">
              <div>
                <div className="font-bold text-sm text-[#1A1830]">{c.nameVi}</div>
                <div className="text-xs font-semibold text-[#9C99B0] mt-0.5">{c.period}</div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-mono text-sm font-bold text-[#6C4CF1]">{c.revenue}</span>
                <StatusBadge label={c.statusLabelVi} tone={c.statusStyle as any} />
              </div>
            </div>
          ))}
        </div>
      </DetailCard>
    </div>
  );
}
