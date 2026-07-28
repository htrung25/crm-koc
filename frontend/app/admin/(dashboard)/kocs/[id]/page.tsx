"use client";

import { use } from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { MOCK_KOCS } from "@/lib/mock";
import { formatFollowers, formatCurrency } from "@/lib/utils/format";
import { StatusBadge, PlatformBadge, DetailCard, InfoRow } from "@/components/ui";

export default function KocDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const kocId = parseInt(resolvedParams.id, 10);
  const koc = MOCK_KOCS.find((k) => k.id === kocId);

  if (!koc) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        type="button"
        onClick={() => router.push("/admin/kocs")}
        className="inline-flex items-center gap-2 text-sm font-bold text-[#6C4CF1] hover:text-[#5A3CD8] transition"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="m15 18-6-6 6-6" />
        </svg>
        <span>Quay lại danh sách KOC</span>
      </button>

      {/* Profile Header Card */}
      <div className="rounded-[20px] border border-[#F0EFF6] bg-white shadow-card overflow-hidden">
        <div
          className="h-[100px]"
          style={{
            background: "linear-gradient(120deg,#6C4CF1,#9B6CF5,#FF5C8A)"
          }}
        />
        <div className="px-6 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-5 -mt-[42px]">
          <div className="flex items-end gap-5">
            <div
              className={`w-[96px] h-[96px] rounded-[24px] grid place-items-center text-white font-extrabold text-[34px] border-4 border-white shadow-lg bg-gradient-to-br ${koc.avatarBg} shrink-0`}
            >
              {koc.initials}
            </div>
            <div className="pb-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-extrabold text-[#1A1830]">
                  {koc.name}
                </h1>
                <StatusBadge label={koc.statusLabelVi} tone={koc.statusStyle as any} />
              </div>
              <p className="text-sm font-semibold text-[#9C99B0] mt-0.5">{koc.handle}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="px-4 py-2.5 rounded-xl border border-[#ECEBF3] bg-white text-sm font-bold text-[#4A4762] hover:bg-[#F4F4F9] transition"
            >
              Gửi thông báo
            </button>
            <button
              type="button"
              className="px-4 py-2.5 rounded-xl bg-[#6C4CF1] text-white text-sm font-bold shadow-md hover:bg-[#5A3CD8] transition"
            >
              Tạo chiến dịch mới
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[#F0EFF6] bg-white p-5 shadow-card">
          <span className="text-xs font-semibold text-[#9C99B0]">Người theo dõi</span>
          <div className="font-mono text-2xl font-bold text-[#1A1830] mt-1">
            {formatFollowers(koc.followers)}
          </div>
        </div>
        <div className="rounded-2xl border border-[#F0EFF6] bg-white p-5 shadow-card">
          <span className="text-xs font-semibold text-[#9C99B0]">Tỷ lệ tương tác</span>
          <div className="font-mono text-2xl font-bold text-[#16D3B0] mt-1">
            {koc.engagementRate}%
          </div>
        </div>
        <div className="rounded-2xl border border-[#F0EFF6] bg-white p-5 shadow-card">
          <span className="text-xs font-semibold text-[#9C99B0]">Chiến dịch đã tham gia</span>
          <div className="font-mono text-2xl font-bold text-[#1A1830] mt-1">
            {koc.campaignCount}
          </div>
        </div>
        <div className="rounded-2xl border border-[#F0EFF6] bg-white p-5 shadow-card">
          <span className="text-xs font-semibold text-[#9C99B0]">Tổng doanh thu tạo ra</span>
          <div className="font-mono text-2xl font-bold text-[#6C4CF1] mt-1">
            {formatCurrency(koc.revenue)}
          </div>
        </div>
      </div>

      {/* Detail Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <DetailCard title="Thông tin cá nhân & Kênh mạng xã hội">
            <div className="space-y-1">
              <InfoRow label="Danh mục nội dung">
                <span>{koc.categoryVi}</span>
              </InfoRow>
              <InfoRow label="Nền tảng hoạt động">
                <div className="flex gap-2">
                  {koc.platforms.map((p) => (
                    <PlatformBadge key={p} name={p} />
                  ))}
                </div>
              </InfoRow>
              <InfoRow label="Giới thiệu">
                <span>{koc.bio || "Chưa cập nhật giới thiệu."}</span>
              </InfoRow>
              <InfoRow label="Đánh giá hệ thống">
                <span className="text-[#F59E0B]">★ {koc.rating || 5.0} / 5.0</span>
              </InfoRow>
            </div>
          </DetailCard>
        </div>

        <div>
          <DetailCard title="Thao tác quản trị">
            <div className="space-y-3">
              <button
                type="button"
                className="w-full py-2.5 px-4 rounded-xl border border-[#ECEBF3] text-xs font-bold text-[#4A4762] hover:bg-[#F4F4F9] text-left transition"
              >
                Cập nhật cấp độ KOC
              </button>
              <button
                type="button"
                className="w-full py-2.5 px-4 rounded-xl border border-red-200 bg-red-50 text-xs font-bold text-red-600 hover:bg-red-100 text-left transition"
              >
                Tạm dừng tài khoản KOC
              </button>
            </div>
          </DetailCard>
        </div>
      </div>
    </div>
  );
}
