"use client";

import { useMemo, useState } from "react";
import {
  DetailBackButton,
  DetailCard,
  DetailMetric,
  FilterChip,
  InfoRow,
  PageHeading,
  StatCard,
  StatusBadge,
  type StatusTone,
  ViewButton,
} from "@/components/admin/operations/admin-operation-ui";

type ApplicationStatus = "pending" | "approved" | "rejected" | "disputed" | "cancelled";
type Application = {
  koc: string;
  handle: string;
  initials: string;
  avatar: string;
  campaign: string;
  brand: string;
  applied: string;
  matches: boolean;
  status: ApplicationStatus;
};

const statusMeta: Record<ApplicationStatus, { label: string; tone: StatusTone }> = {
  pending: { label: "Chờ duyệt", tone: "yellow" },
  approved: { label: "Đã duyệt", tone: "green" },
  rejected: { label: "Đã từ chối", tone: "red" },
  disputed: { label: "Khiếu nại", tone: "pink" },
  cancelled: { label: "Đã hủy", tone: "gray" },
};

const applications: Application[] = [
  { koc: "Mai Anh", handle: "@maianh.beauty", initials: "MA", avatar: "linear-gradient(135deg,#6C4CF1,#9B6CF5)", campaign: "Summer Glow 2026", brand: "Lumina Cosmetics", applied: "03/07/2026", matches: true, status: "approved" },
  { koc: "Linh Chi", handle: "@linhchi.food", initials: "LC", avatar: "linear-gradient(135deg,#2ED3A5,#5BE0C0)", campaign: "Summer Glow 2026", brand: "Lumina Cosmetics", applied: "04/07/2026", matches: false, status: "approved" },
  { koc: "Bảo Trân", handle: "@tran.fashion", initials: "BT", avatar: "linear-gradient(135deg,#12B892,#3BC9F5)", campaign: "Summer Glow 2026", brand: "Lumina Cosmetics", applied: "04/07/2026", matches: false, status: "rejected" },
  { koc: "Tuấn Kiệt", handle: "@kiethgaming", initials: "TK", avatar: "linear-gradient(135deg,#FFB020,#FF7A59)", campaign: "Nova Buds ra mắt", brand: "NovaTech", applied: "10/07/2026", matches: true, status: "pending" },
  { koc: "Minh Quân", handle: "@quantech", initials: "MQ", avatar: "linear-gradient(135deg,#5B8DEF,#8E6CF5)", campaign: "Nova Buds ra mắt", brand: "NovaTech", applied: "01/07/2026", matches: true, status: "approved" },
  { koc: "Hải Yến", handle: "@yenlifestyle", initials: "HY", avatar: "linear-gradient(135deg,#FF5C8A,#FF9A6C)", campaign: "Back to School", brand: "UrbanWear", applied: "10/06/2026", matches: true, status: "disputed" },
  { koc: "Gia Bảo", handle: "@giabao.travel", initials: "GB", avatar: "linear-gradient(135deg,#F5A65B,#F56C6C)", campaign: "Món ngon mùa hè", brand: "FreshBite", applied: "23/07/2026", matches: false, status: "pending" },
  { koc: "Đức Huy", handle: "@huyfit", initials: "ĐH", avatar: "linear-gradient(135deg,#FF6CAB,#C86CF5)", campaign: "Giải đấu Mùa 1", brand: "PlayZone", applied: "11/07/2026", matches: false, status: "cancelled" },
];

const filters: Array<{ key: "all" | ApplicationStatus; label: string }> = [
  { key: "all", label: "Tất cả" },
  { key: "pending", label: "Chờ duyệt" },
  { key: "approved", label: "Đã duyệt" },
  { key: "rejected", label: "Đã từ chối" },
  { key: "disputed", label: "Khiếu nại" },
  { key: "cancelled", label: "Đã hủy" },
];

export default function AdminApplicationsPage() {
  const [filter, setFilter] = useState<"all" | ApplicationStatus>("all");
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const visibleItems = useMemo(
    () => filter === "all" ? applications : applications.filter((item) => item.status === filter),
    [filter],
  );

  if (selectedApplication) {
    return (
      <ApplicationDetail
        application={selectedApplication}
        onBack={() => setSelectedApplication(null)}
      />
    );
  }

  return (
    <div>
      <PageHeading title="Quản lý đơn đăng ký" description="Theo dõi KOC đăng ký chiến dịch và can thiệp khi cần." />
      <div className="mb-5 grid grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-4">
        <StatCard value={applications.length} label="Tổng đơn đăng ký" iconClassName="bg-[#EEE9FF] text-[#6C4CF1]" icon={<ClipboardIcon />} />
        <StatCard value={applications.filter((item) => item.status === "pending").length} label="Chờ Brand duyệt" iconClassName="bg-[#FDF6B2] text-[#B7860B]" icon={<ClockIcon />} />
        <StatCard value={applications.filter((item) => item.status === "disputed").length} label="Đang khiếu nại" iconClassName="bg-[#FCE7F3] text-[#BE185D]" icon={<AlertIcon />} />
        <StatCard value={applications.filter((item) => !item.matches).length} label="Lệch tiêu chí" iconClassName="bg-[#FEE4E2] text-[#D92D20]" icon={<MismatchIcon />} />
      </div>

      <div className="mb-[18px] flex flex-wrap gap-[9px]">
        {filters.map((item) => (
          <FilterChip key={item.key} active={filter === item.key} onClick={() => setFilter(item.key)}>{item.label}</FilterChip>
        ))}
      </div>

      <div className="overflow-hidden rounded-[18px] border border-[#F0EFF6] bg-white shadow-[0_1px_3px_rgba(20,18,48,.05)]">
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_.7fr] border-b border-[#F0EFF6] bg-[#FAFAFD] px-[22px] py-[15px] text-[11.5px] font-bold uppercase tracking-[.5px] text-[#9C99B0]">
              <div>KOC</div><div>Chiến dịch</div><div>Ngày đăng ký</div><div>Tiêu chí</div><div>Trạng thái</div><div className="text-center">Thao tác</div>
            </div>
            {visibleItems.map((item) => {
              const meta = statusMeta[item.status];
              return (
                <div key={`${item.handle}-${item.campaign}`} className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_.7fr] items-center border-b border-[#F4F4F9] px-[22px] py-3.5 text-[13.5px] transition last:border-b-0 hover:bg-[#FAFAFD]">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[11px] text-[12.5px] font-bold text-white" style={{ background: item.avatar }}>{item.initials}</div>
                    <div className="min-w-0"><div className="truncate font-bold">{item.koc}</div><div className="truncate text-xs text-[#9C99B0]">{item.handle}</div></div>
                  </div>
                  <div className="min-w-0"><div className="truncate font-bold">{item.campaign}</div><div className="truncate text-xs text-[#9C99B0]">{item.brand}</div></div>
                  <div className="font-medium text-[#4A4762]">{item.applied}</div>
                  <div><StatusBadge label={item.matches ? "Phù hợp" : "Không khớp"} tone={item.matches ? "green" : "red"} /></div>
                  <div><StatusBadge label={meta.label} tone={meta.tone} /></div>
                  <div className="flex justify-center">
                    <ViewButton onClick={() => setSelectedApplication(item)} />
                  </div>
                </div>
              );
            })}
            {visibleItems.length === 0 && <div className="p-12 text-center text-sm font-semibold text-[#B0AEC0]">Không có đơn đăng ký nào ở trạng thái này.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function ApplicationDetail({
  application,
  onBack,
}: {
  application: Application;
  onBack: () => void;
}) {
  const meta = statusMeta[application.status];
  const needsAttention =
    application.status === "disputed" || !application.matches;

  return (
    <div>
      <DetailBackButton label="Quay lại đơn đăng ký" onClick={onBack} />

      <div className="mb-[18px] flex flex-col justify-between gap-4 rounded-[18px] border border-[#F0EFF6] bg-white p-5 shadow-[0_1px_3px_rgba(20,18,48,.05)] md:flex-row md:items-center md:p-6">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-base font-bold text-white" style={{ background: application.avatar }}>
            {application.initials}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[23px] font-extrabold">{application.koc}</h1>
              <StatusBadge label={meta.label} tone={meta.tone} />
            </div>
            <p className="mt-1 text-[13px] font-medium text-[#9C99B0]">
              {application.handle} · Đăng ký ngày {application.applied}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {application.status === "disputed" && (
            <>
              <button type="button" className="rounded-[11px] bg-[#DEF7EC] px-4 py-2.5 text-[13px] font-bold text-[#0E9F6E]">Duyệt cho KOC</button>
              <button type="button" className="rounded-[11px] bg-[#FDE2E2] px-4 py-2.5 text-[13px] font-bold text-[#E02424]">Giữ quyết định từ chối</button>
            </>
          )}
          {application.status !== "cancelled" && (
            <button type="button" className="rounded-[11px] border border-[#ECEBF3] bg-white px-4 py-2.5 text-[13px] font-bold text-[#6E6B85]">Hủy đơn</button>
          )}
        </div>
      </div>

      {needsAttention && (
        <div className={`mb-[18px] flex items-center gap-3 rounded-[14px] border px-[18px] py-3.5 text-[13.5px] font-semibold ${
          application.status === "disputed"
            ? "border-[#F3D5E7] bg-[#FFF4FA] text-[#A31561]"
            : "border-[#FADBD8] bg-[#FEF1F0] text-[#C0362C]"
        }`}>
          <AlertIcon />
          {application.status === "disputed"
            ? "Đơn đăng ký đang bị khiếu nại — Admin cần xem xét và can thiệp."
            : "Cảnh báo: KOC chưa đáp ứng đầy đủ tiêu chí của chiến dịch."}
        </div>
      )}

      <div className="mb-[18px] grid grid-cols-2 gap-[18px] xl:grid-cols-4">
        <DetailMetric label="Follower" value="1.2M" />
        <DetailMetric label="Tỷ lệ tương tác" value="8.4%" accent />
        <DetailMetric label="Chiến dịch đã tham gia" value="12" />
        <DetailMetric label="Doanh thu KOC" value="340M ₫" />
      </div>

      <div className="grid grid-cols-1 gap-[18px] xl:grid-cols-5">
        <DetailCard title="Thông tin chiến dịch" className="xl:col-span-3">
          <div className="mb-5 flex items-center gap-3 rounded-[14px] bg-[#FAFAFD] p-4">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-[#6C4CF1] to-[#9B6CF5] font-mono text-sm font-extrabold text-white">
              {application.brand.split(" ").map((part) => part[0]).slice(0, 2).join("")}
            </div>
            <div>
              <div className="font-bold">{application.campaign}</div>
              <div className="mt-0.5 text-xs font-medium text-[#9C99B0]">{application.brand}</div>
            </div>
          </div>
          <InfoRow label="Ngân sách">320M ₫</InfoRow>
          <InfoRow label="Deadline">15/08/2026</InfoRow>
          <InfoRow label="Trạng thái chiến dịch"><StatusBadge label="Đang chạy" tone="green" /></InfoRow>
        </DetailCard>

        <DetailCard title="Kiểm tra tiêu chí" className="xl:col-span-2">
          <InfoRow label="Follower tối thiểu">
            <StatusBadge label={application.matches ? "Phù hợp" : "Không khớp"} tone={application.matches ? "green" : "red"} />
          </InfoRow>
          <InfoRow label="Lĩnh vực nội dung">
            <StatusBadge label={application.matches ? "Phù hợp" : "Không khớp"} tone={application.matches ? "green" : "red"} />
          </InfoRow>
          <InfoRow label="Khu vực">Toàn quốc</InfoRow>
        </DetailCard>

        <DetailCard title="Lịch sử thay đổi trạng thái" className="xl:col-span-3">
          <TimelineItem color="#6C4CF1" title="KOC nộp đơn đăng ký" date={application.applied} detail="Đơn đăng ký được gửi tới thương hiệu." />
          {application.status !== "pending" && (
            <TimelineItem
              color={application.status === "approved" ? "#0E9F6E" : "#E02424"}
              title={application.status === "approved" ? "Brand đã duyệt" : "Brand đã từ chối"}
              date="05/07/2026"
              detail={application.status === "approved" ? "KOC được chấp nhận tham gia chiến dịch." : "Thương hiệu từ chối đơn đăng ký."}
            />
          )}
          {application.status === "disputed" && (
            <TimelineItem color="#BE185D" title="KOC gửi khiếu nại" date="16/06/2026" detail="KOC đề nghị Admin xem xét lại quyết định từ chối." last />
          )}
        </DetailCard>

        <DetailCard title="Quyết định xét duyệt" className="xl:col-span-2">
          <InfoRow label="Trạng thái"><StatusBadge label={meta.label} tone={meta.tone} /></InfoRow>
          <InfoRow label="Ngày quyết định">{application.status === "pending" ? "—" : "05/07/2026"}</InfoRow>
          <InfoRow label="Người xử lý">{application.status === "cancelled" ? "Admin" : "Thương hiệu"}</InfoRow>
          {application.status === "rejected" && <p className="mt-4 rounded-xl bg-[#FEF1F0] p-3.5 text-[12.5px] font-semibold leading-5 text-[#C0362C]">Không phù hợp lĩnh vực chiến dịch.</p>}
        </DetailCard>
      </div>
    </div>
  );
}

function TimelineItem({
  color,
  title,
  date,
  detail,
  last = false,
}: {
  color: string;
  title: string;
  date: string;
  detail: string;
  last?: boolean;
}) {
  return (
    <div className="flex gap-3.5">
      <div className="flex flex-col items-center">
        <span className="mt-1.5 h-2.5 w-2.5 rounded-full" style={{ background: color }} />
        {!last && <span className="my-1 h-12 w-0.5 bg-[#ECEBF3]" />}
      </div>
      <div className="flex-1 pb-5">
        <div className="flex items-center justify-between gap-3"><span className="text-[13.5px] font-bold">{title}</span><span className="text-xs font-semibold text-[#B0AEC0]">{date}</span></div>
        <p className="mt-1 text-[12.5px] font-medium text-[#9C99B0]">{detail}</p>
      </div>
    </div>
  );
}

function ClipboardIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4" /><rect x="4" y="4" width="16" height="18" rx="2" /><path d="M9 2h6v3H9z" /></svg>;
}
function ClockIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
}
function AlertIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.3 3.6 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z" /></svg>;
}
function MismatchIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3-3" /><path d="m9 9 4 4" /><path d="m13 9-4 4" /></svg>;
}
