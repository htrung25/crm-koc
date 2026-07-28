"use client";

import { useMemo, useState } from "react";
import {
  DetailBackButton,
  DetailCard,
  DetailMetric,
  FilterChip,
  InfoRow,
  PageHeading,
  PlatformBadge,
  StatCard,
  StatusBadge,
  type StatusTone,
  ViewButton,
} from "@/components/admin/operations/admin-operation-ui";

type CampaignStatus =
  | "pending"
  | "active"
  | "paused"
  | "overdue"
  | "rejected"
  | "completed";

type Campaign = {
  name: string;
  brand: string;
  initials: string;
  brandBg: string;
  platforms: string[];
  budget: string;
  registered: number;
  target: number;
  deadline: string;
  deadlineHint: string;
  deadlineTone: StatusTone;
  progress: number;
  status: CampaignStatus;
};

const statusMeta: Record<
  CampaignStatus,
  { label: string; tone: StatusTone }
> = {
  pending: { label: "Chờ duyệt", tone: "yellow" },
  active: { label: "Đang chạy", tone: "green" },
  paused: { label: "Tạm dừng", tone: "yellow" },
  overdue: { label: "Quá hạn", tone: "red" },
  rejected: { label: "Đã từ chối", tone: "red" },
  completed: { label: "Hoàn thành", tone: "blue" },
};

const campaigns: Campaign[] = [
  {
    name: "Summer Glow 2026",
    brand: "Lumina Cosmetics",
    initials: "LC",
    brandBg: "linear-gradient(135deg,#6C4CF1,#9B6CF5)",
    platforms: ["TikTok", "Instagram"],
    budget: "320M",
    registered: 14,
    target: 20,
    deadline: "15/08/2026",
    deadlineHint: "Còn 19 ngày",
    deadlineTone: "gray",
    progress: 62,
    status: "active",
  },
  {
    name: "Ra mắt Serum X",
    brand: "Lumina Cosmetics",
    initials: "LC",
    brandBg: "linear-gradient(135deg,#FF5C8A,#FF9A6C)",
    platforms: ["TikTok", "YouTube"],
    budget: "150M",
    registered: 0,
    target: 15,
    deadline: "30/08/2026",
    deadlineHint: "Còn 34 ngày",
    deadlineTone: "gray",
    progress: 0,
    status: "pending",
  },
  {
    name: "Nova Buds ra mắt",
    brand: "NovaTech",
    initials: "NT",
    brandBg: "linear-gradient(135deg,#12B892,#3BC9F5)",
    platforms: ["YouTube", "TikTok"],
    budget: "900M",
    registered: 9,
    target: 12,
    deadline: "05/09/2026",
    deadlineHint: "Còn 40 ngày",
    deadlineTone: "gray",
    progress: 48,
    status: "active",
  },
  {
    name: "Món ngon mùa hè",
    brand: "FreshBite",
    initials: "FB",
    brandBg: "linear-gradient(135deg,#FFB020,#FF7A59)",
    platforms: ["Instagram", "TikTok"],
    budget: "220M",
    registered: 0,
    target: 18,
    deadline: "25/08/2026",
    deadlineHint: "Còn 29 ngày",
    deadlineTone: "gray",
    progress: 0,
    status: "pending",
  },
  {
    name: "Back to School",
    brand: "UrbanWear",
    initials: "UW",
    brandBg: "linear-gradient(135deg,#5B8DEF,#8E6CF5)",
    platforms: ["TikTok", "Instagram"],
    budget: "780M",
    registered: 15,
    target: 15,
    deadline: "10/07/2026",
    deadlineHint: "Quá hạn 17 ngày",
    deadlineTone: "red",
    progress: 88,
    status: "overdue",
  },
  {
    name: "Giải đấu Mùa 1",
    brand: "PlayZone",
    initials: "PZ",
    brandBg: "linear-gradient(135deg,#FF6CAB,#C86CF5)",
    platforms: ["YouTube", "TikTok"],
    budget: "420M",
    registered: 6,
    target: 10,
    deadline: "20/09/2026",
    deadlineHint: "Còn 55 ngày",
    deadlineTone: "gray",
    progress: 30,
    status: "paused",
  },
  {
    name: "Sống xanh mỗi ngày",
    brand: "GreenLife",
    initials: "GL",
    brandBg: "linear-gradient(135deg,#2ED3A5,#5BE0C0)",
    platforms: ["Instagram", "TikTok"],
    budget: "1.0 tỷ",
    registered: 21,
    target: 21,
    deadline: "30/05/2026",
    deadlineHint: "Đã kết thúc",
    deadlineTone: "blue",
    progress: 100,
    status: "completed",
  },
  {
    name: "Combo tiết kiệm",
    brand: "FreshBite",
    initials: "FB",
    brandBg: "linear-gradient(135deg,#F5A65B,#F56C6C)",
    platforms: ["TikTok"],
    budget: "180M",
    registered: 0,
    target: 12,
    deadline: "15/08/2026",
    deadlineHint: "Còn 19 ngày",
    deadlineTone: "gray",
    progress: 0,
    status: "rejected",
  },
];

const filters: Array<{ key: "all" | CampaignStatus; label: string }> = [
  { key: "all", label: "Tất cả" },
  { key: "pending", label: "Chờ duyệt" },
  { key: "active", label: "Đang chạy" },
  { key: "paused", label: "Tạm dừng" },
  { key: "overdue", label: "Quá hạn" },
  { key: "rejected", label: "Đã từ chối" },
  { key: "completed", label: "Hoàn thành" },
];

export default function AdminCampaignsPage() {
  const [filter, setFilter] = useState<"all" | CampaignStatus>("all");
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const visibleCampaigns = useMemo(
    () =>
      filter === "all"
        ? campaigns
        : campaigns.filter((campaign) => campaign.status === filter),
    [filter],
  );

  if (selectedCampaign) {
    return (
      <CampaignDetail
        campaign={selectedCampaign}
        onBack={() => setSelectedCampaign(null)}
      />
    );
  }

  return (
    <div>
      <PageHeading
        title="Quản lý chiến dịch"
        description="Duyệt, theo dõi và xử lý toàn bộ chiến dịch từ thương hiệu."
      />

      <div className="mb-5 grid grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-4">
        <StatCard value={campaigns.length} label="Tổng chiến dịch" iconClassName="bg-[#EEE9FF] text-[#6C4CF1]" icon={<MegaphoneIcon />} />
        <StatCard value={campaigns.filter((item) => item.status === "pending").length} label="Chờ phê duyệt" iconClassName="bg-[#FDF6B2] text-[#B7860B]" icon={<ClockIcon />} />
        <StatCard value={campaigns.filter((item) => item.status === "active").length} label="Đang chạy" iconClassName="bg-[#DEF7EC] text-[#0E9F6E]" icon={<TrendIcon />} />
        <StatCard value={campaigns.filter((item) => item.status === "overdue").length} label="Đã quá hạn" iconClassName="bg-[#FEE4E2] text-[#D92D20]" icon={<AlertIcon />} />
      </div>

      <div className="mb-[18px] flex flex-wrap gap-[9px]">
        {filters.map((item) => (
          <FilterChip
            key={item.key}
            active={filter === item.key}
            onClick={() => setFilter(item.key)}
          >
            {item.label}
          </FilterChip>
        ))}
      </div>

      <div className="overflow-hidden rounded-[18px] border border-[#F0EFF6] bg-white shadow-[0_1px_3px_rgba(20,18,48,.05)]">
        <div className="overflow-x-auto">
          <div className="min-w-[1080px]">
            <div className="grid grid-cols-[2.5fr_1.15fr_.95fr_.7fr_1.15fr_1.25fr_.95fr_.75fr] border-b border-[#F0EFF6] bg-[#FAFAFD] px-[22px] py-[15px] text-[11.5px] font-bold uppercase tracking-[.5px] text-[#9C99B0]">
              <div>Chiến dịch</div><div>Nền tảng</div><div>Ngân sách</div><div className="text-center">KOC</div><div>Deadline</div><div>Tiến độ</div><div>Trạng thái</div><div className="text-center">Thao tác</div>
            </div>
            {visibleCampaigns.map((campaign) => {
              const meta = statusMeta[campaign.status];
              return (
                <div
                  key={`${campaign.brand}-${campaign.name}`}
                  className="grid grid-cols-[2.5fr_1.15fr_.95fr_.7fr_1.15fr_1.25fr_.95fr_.75fr] items-center border-b border-[#F4F4F9] px-[22px] py-3.5 text-[13.5px] transition last:border-b-0 hover:bg-[#FAFAFD]"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[11px] font-mono text-[13px] font-extrabold text-white" style={{ background: campaign.brandBg }}>{campaign.initials}</div>
                    <div className="min-w-0">
                      <div className="truncate font-bold">{campaign.name}</div>
                      <div className="truncate text-xs text-[#9C99B0]">{campaign.brand}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {campaign.platforms.map((platform) => <PlatformBadge key={platform} name={platform} />)}
                  </div>
                  <div className="font-mono font-bold">{campaign.budget} ₫</div>
                  <div className="text-center font-mono"><b>{campaign.registered}</b><span className="font-semibold text-[#B0AEC0]">/{campaign.target}</span></div>
                  <div>
                    <div className="text-[13px] font-semibold">{campaign.deadline}</div>
                    <div className="mt-1"><StatusBadge label={campaign.deadlineHint} tone={campaign.deadlineTone} /></div>
                  </div>
                  <div>
                    <div className="mb-1 text-[11.5px] font-bold text-[#9C99B0]">{campaign.progress}%</div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[#F0EFF6]">
                      <div className={`h-full rounded-full ${campaign.status === "overdue" ? "bg-gradient-to-r from-[#FF7A6C] to-[#D92D20]" : "bg-gradient-to-r from-[#6C4CF1] to-[#FF5C8A]"}`} style={{ width: `${campaign.progress}%` }} />
                    </div>
                  </div>
                  <div><StatusBadge label={meta.label} tone={meta.tone} /></div>
                  <div className="flex justify-center">
                    <ViewButton onClick={() => setSelectedCampaign(campaign)} />
                  </div>
                </div>
              );
            })}
            {visibleCampaigns.length === 0 && <div className="p-12 text-center text-sm font-semibold text-[#B0AEC0]">Không có chiến dịch nào ở trạng thái này.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function CampaignDetail({
  campaign,
  onBack,
}: {
  campaign: Campaign;
  onBack: () => void;
}) {
  const meta = statusMeta[campaign.status];
  const approved = Math.min(campaign.registered, Math.ceil(campaign.registered * 0.6));
  const spent = Math.round(campaign.progress * 3.2);

  return (
    <div>
      <DetailBackButton label="Quay lại chiến dịch" onClick={onBack} />

      <div className="mb-5 flex flex-col justify-between gap-4 rounded-[18px] border border-[#F0EFF6] bg-white p-5 shadow-[0_1px_3px_rgba(20,18,48,.05)] md:flex-row md:items-center md:p-6">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl font-mono text-base font-extrabold text-white" style={{ background: campaign.brandBg }}>
            {campaign.initials}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[23px] font-extrabold text-[#1A1830]">{campaign.name}</h1>
              <StatusBadge label={meta.label} tone={meta.tone} />
            </div>
            <p className="mt-1 text-[13px] font-medium text-[#9C99B0]">
              {campaign.brand} · Tạo ngày 02/07/2026
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {campaign.status === "pending" && (
            <>
              <button className="rounded-[11px] bg-[#DEF7EC] px-4 py-2.5 text-[13px] font-bold text-[#0E9F6E] transition hover:bg-[#C9F1E2]">Duyệt &amp; công khai</button>
              <button className="rounded-[11px] bg-[#FDE2E2] px-4 py-2.5 text-[13px] font-bold text-[#E02424] transition hover:bg-[#F9D2D2]">Từ chối</button>
            </>
          )}
          {campaign.status === "active" && (
            <button className="rounded-[11px] bg-[#FFF1DA] px-4 py-2.5 text-[13px] font-bold text-[#B45309]">Tạm dừng</button>
          )}
          {campaign.status === "overdue" && (
            <button className="rounded-[11px] bg-[#6C4CF1] px-4 py-2.5 text-[13px] font-bold text-white">Gia hạn chiến dịch</button>
          )}
        </div>
      </div>

      {(campaign.status === "pending" || campaign.status === "overdue") && (
        <div className={`mb-[18px] flex items-center gap-3 rounded-[14px] border px-[18px] py-3.5 text-[13.5px] font-semibold ${
          campaign.status === "overdue"
            ? "border-[#FADBD8] bg-[#FEF1F0] text-[#C0362C]"
            : "border-[#FCEEC4] bg-[#FFFBEB] text-[#96700A]"
        }`}>
          <AlertIcon />
          {campaign.status === "overdue"
            ? "Chiến dịch đã quá hạn — hãy gia hạn, đánh dấu hoàn thành hoặc hủy."
            : "Chiến dịch đang chờ duyệt — kiểm tra nội dung, ngân sách và yêu cầu trước khi công khai."}
        </div>
      )}

      <div className="mb-[18px] grid grid-cols-2 gap-[18px] xl:grid-cols-4">
        <DetailMetric label="Ngân sách" value={`${campaign.budget} ₫`} />
        <DetailMetric label="Đã chi" value={`${spent}M ₫`} />
        <DetailMetric label="KOC đăng ký" value={`${campaign.registered}/${campaign.target}`} />
        <DetailMetric label="Tiến độ" value={`${campaign.progress}%`} accent />
      </div>

      <div className="grid grid-cols-1 gap-[18px] xl:grid-cols-5">
        <DetailCard title="Brief chiến dịch" className="xl:col-span-3">
          <p className="mb-5 text-[13.5px] font-medium leading-6 text-[#6E6B85]">
            Chiến dịch quảng bá sản phẩm mới của {campaign.brand}, tập trung vào nội dung trải nghiệm chân thực và khả năng chuyển đổi từ cộng đồng người theo dõi của KOC.
          </p>
          <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
            <InfoRow label="Sản phẩm / Dịch vụ">Sản phẩm chủ lực 2026</InfoRow>
            <InfoRow label="Deadline">{campaign.deadline}</InfoRow>
            <InfoRow label="Nền tảng">
              <span className="flex flex-wrap justify-end gap-1.5">{campaign.platforms.map((item) => <PlatformBadge key={item} name={item} />)}</span>
            </InfoRow>
            <InfoRow label="Khu vực">Toàn quốc</InfoRow>
          </div>
        </DetailCard>

        <DetailCard title="Yêu cầu KOC" className="xl:col-span-2">
          <InfoRow label="Follower tối thiểu">300K followers</InfoRow>
          <InfoRow label="Lĩnh vực">Làm đẹp, Đời sống</InfoRow>
          <InfoRow label="Độ tuổi">18–35</InfoRow>
          <InfoRow label="Nội dung">Video review + Story</InfoRow>
        </DetailCard>

        <DetailCard title="Tiến độ thực hiện" className="xl:col-span-3">
          <div className="mb-5 flex items-center justify-between text-[13px] font-bold">
            <span className="text-[#6E6B85]">Hoàn thành chiến dịch</span>
            <span className="text-[#4A2FD6]">{campaign.progress}%</span>
          </div>
          <div className="mb-6 h-2.5 overflow-hidden rounded-full bg-[#F0EFF6]">
            <div className="h-full rounded-full bg-gradient-to-r from-[#6C4CF1] to-[#FF5C8A]" style={{ width: `${campaign.progress}%` }} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-[#FAFAFD] p-3.5"><div className="text-[11.5px] font-semibold text-[#9C99B0]">Đăng ký</div><div className="mt-1 font-mono text-xl font-bold">{campaign.registered}</div></div>
            <div className="rounded-xl bg-[#FAFAFD] p-3.5"><div className="text-[11.5px] font-semibold text-[#9C99B0]">Đã duyệt</div><div className="mt-1 font-mono text-xl font-bold">{approved}</div></div>
            <div className="rounded-xl bg-[#FAFAFD] p-3.5"><div className="text-[11.5px] font-semibold text-[#9C99B0]">Đã nộp bài</div><div className="mt-1 font-mono text-xl font-bold">{Math.floor(approved * 0.7)}</div></div>
          </div>
        </DetailCard>

        <DetailCard title="Kết quả chiến dịch" className="xl:col-span-2">
          <InfoRow label="Tiếp cận">4.2M</InfoRow>
          <InfoRow label="Lượt hiển thị">18.6M</InfoRow>
          <InfoRow label="Tương tác">7.8%</InfoRow>
          <InfoRow label="Chuyển đổi">3.2%</InfoRow>
        </DetailCard>
      </div>
    </div>
  );
}

function MegaphoneIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 11 18-5v12L3 14v-3z" /><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" /></svg>;
}
function ClockIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
}
function TrendIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m22 7-8.5 8.5-5-5L2 17" /><path d="M16 7h6v6" /></svg>;
}
function AlertIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.3 3.6 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>;
}
