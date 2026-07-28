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

type TaskStatus = "pending" | "submitted" | "rejected" | "live" | "violation" | "overdue" | "failed";
type Task = {
  koc: string;
  handle: string;
  initials: string;
  avatar: string;
  campaign: string;
  deliverable: string;
  deadline: string;
  content?: string;
  status: TaskStatus;
  issue?: boolean;
};

const statusMeta: Record<TaskStatus, { label: string; tone: StatusTone }> = {
  pending: { label: "Chờ nộp bài", tone: "yellow" },
  submitted: { label: "Chờ Brand duyệt", tone: "blue" },
  rejected: { label: "Bị từ chối", tone: "red" },
  live: { label: "Đã lên sóng", tone: "green" },
  violation: { label: "Vi phạm", tone: "pink" },
  overdue: { label: "Quá hạn", tone: "red" },
  failed: { label: "Không hoàn thành", tone: "gray" },
};

const tasks: Task[] = [
  { koc: "Mai Anh", handle: "@maianh.beauty", initials: "MA", avatar: "linear-gradient(135deg,#6C4CF1,#9B6CF5)", campaign: "Summer Glow 2026", deliverable: "1 video TikTok ≥ 60 giây", deadline: "20/07/2026", content: "tiktok.com/@maianh.beauty/video/7351208842", status: "live" },
  { koc: "Mai Anh", handle: "@maianh.beauty", initials: "MA", avatar: "linear-gradient(135deg,#6C4CF1,#9B6CF5)", campaign: "Summer Glow 2026", deliverable: "3 ảnh feed Instagram", deadline: "25/07/2026", content: "instagram.com/p/C9x2Qk4bTr1", status: "submitted" },
  { koc: "Linh Chi", handle: "@linhchi.food", initials: "LC", avatar: "linear-gradient(135deg,#2ED3A5,#5BE0C0)", campaign: "Summer Glow 2026", deliverable: "2 story gắn link mua hàng", deadline: "22/07/2026", content: "instagram.com/stories/linhchi.food/34210", status: "rejected" },
  { koc: "Minh Quân", handle: "@quantech", initials: "MQ", avatar: "linear-gradient(135deg,#5B8DEF,#8E6CF5)", campaign: "Nova Buds ra mắt", deliverable: "1 video YouTube đánh giá", deadline: "15/07/2026", content: "youtube.com/watch?v=nq7-buds-review", status: "submitted", issue: true },
  { koc: "Bảo Trân", handle: "@tran.fashion", initials: "BT", avatar: "linear-gradient(135deg,#12B892,#3BC9F5)", campaign: "Back to School", deliverable: "3 ảnh lookbook", deadline: "20/06/2026", content: "instagram.com/p/C8k9LmZaQe2", status: "violation", issue: true },
  { koc: "Hải Yến", handle: "@yenlifestyle", initials: "HY", avatar: "linear-gradient(135deg,#FF5C8A,#FF9A6C)", campaign: "Back to School", deliverable: "1 reels phối đồ", deadline: "25/06/2026", status: "overdue", issue: true },
  { koc: "Tuấn Kiệt", handle: "@kiethgaming", initials: "TK", avatar: "linear-gradient(135deg,#FFB020,#FF7A59)", campaign: "Nova Buds ra mắt", deliverable: "2 shorts/reels", deadline: "20/08/2026", status: "pending" },
  { koc: "Gia Bảo", handle: "@giabao.travel", initials: "GB", avatar: "linear-gradient(135deg,#F5A65B,#F56C6C)", campaign: "Món ngon mùa hè", deliverable: "1 video TikTok", deadline: "20/07/2026", content: "tiktok.com/@giabao.travel/video/7355501120", status: "live", issue: true },
];

const filters: Array<{ key: "all" | TaskStatus; label: string }> = [
  { key: "all", label: "Tất cả" },
  { key: "pending", label: "Chờ nộp bài" },
  { key: "submitted", label: "Chờ Brand duyệt" },
  { key: "rejected", label: "Bị từ chối" },
  { key: "live", label: "Đã lên sóng" },
  { key: "violation", label: "Vi phạm" },
  { key: "overdue", label: "Quá hạn" },
  { key: "failed", label: "Không hoàn thành" },
];

export default function AdminTasksPage() {
  const [filter, setFilter] = useState<"all" | TaskStatus>("all");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const visibleItems = useMemo(
    () => filter === "all" ? tasks : tasks.filter((item) => item.status === filter),
    [filter],
  );

  if (selectedTask) {
    return <TaskDetail task={selectedTask} onBack={() => setSelectedTask(null)} />;
  }

  return (
    <div>
      <PageHeading title="Quản lý nhiệm vụ & nội dung" description="Theo dõi quá trình KOC thực hiện nhiệm vụ sau khi được nhận vào chiến dịch." />
      <div className="mb-5 grid grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-4">
        <StatCard value={tasks.length} label="Tổng nhiệm vụ" iconClassName="bg-[#EEE9FF] text-[#6C4CF1]" icon={<TaskIcon />} />
        <StatCard value={tasks.filter((item) => item.status === "submitted").length} label="Chờ Brand duyệt" iconClassName="bg-[#FDF6B2] text-[#B7860B]" icon={<ClockIcon />} />
        <StatCard value={tasks.filter((item) => item.issue).length} label="Cần xử lý" iconClassName="bg-[#FEE4E2] text-[#D92D20]" icon={<AlertIcon />} />
        <StatCard value={tasks.filter((item) => item.status === "live").length} label="Đã lên sóng" iconClassName="bg-[#DEF7EC] text-[#0E9F6E]" icon={<TrendIcon />} />
      </div>

      <div className="mb-[18px] flex flex-wrap gap-[9px]">
        {filters.map((item) => (
          <FilterChip key={item.key} active={filter === item.key} onClick={() => setFilter(item.key)}>{item.label}</FilterChip>
        ))}
      </div>

      <div className="overflow-hidden rounded-[18px] border border-[#F0EFF6] bg-white shadow-[0_1px_3px_rgba(20,18,48,.05)]">
        <div className="overflow-x-auto">
          <div className="min-w-[980px]">
            <div className="grid grid-cols-[2fr_2fr_1fr_1.6fr_1.1fr_.7fr] border-b border-[#F0EFF6] bg-[#FAFAFD] px-[22px] py-[15px] text-[11.5px] font-bold uppercase tracking-[.5px] text-[#9C99B0]">
              <div>KOC</div><div>Chiến dịch</div><div>Deadline</div><div>Nội dung</div><div>Trạng thái</div><div className="text-center">Thao tác</div>
            </div>
            {visibleItems.map((item, index) => {
              const meta = statusMeta[item.status];
              return (
                <div key={`${item.handle}-${item.campaign}-${index}`} className="grid grid-cols-[2fr_2fr_1fr_1.6fr_1.1fr_.7fr] items-center border-b border-[#F4F4F9] px-[22px] py-3.5 text-[13.5px] transition last:border-b-0 hover:bg-[#FAFAFD]">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[11px] text-[12.5px] font-bold text-white" style={{ background: item.avatar }}>{item.initials}</div>
                    <div className="min-w-0"><div className="truncate font-bold">{item.koc}</div><div className="truncate text-xs text-[#9C99B0]">{item.handle}</div></div>
                  </div>
                  <div className="min-w-0"><div className="truncate font-bold">{item.campaign}</div><div className="truncate text-xs text-[#9C99B0]">{item.deliverable}</div></div>
                  <div className="font-medium text-[#4A4762]">{item.deadline}</div>
                  <div className={`truncate text-[12.5px] font-semibold ${item.content ? "text-[#6C4CF1]" : "text-[#B0AEC0]"}`}>{item.content ?? "Chưa nộp bài"}</div>
                  <div><StatusBadge label={meta.label} tone={meta.tone} /></div>
                  <div className="flex justify-center">
                    <ViewButton onClick={() => setSelectedTask(item)} />
                  </div>
                </div>
              );
            })}
            {visibleItems.length === 0 && <div className="p-12 text-center text-sm font-semibold text-[#B0AEC0]">Không có nhiệm vụ nào ở trạng thái này.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskDetail({ task, onBack }: { task: Task; onBack: () => void }) {
  const meta = statusMeta[task.status];
  const alertText =
    task.status === "submitted" && task.issue
      ? "Brand chưa phê duyệt nội dung sau nhiều ngày — cần Admin can thiệp."
      : task.status === "live" && task.issue
        ? "Bài đăng đã bị gỡ — cần xử lý với KOC."
        : task.status === "violation"
          ? "Nội dung này đã bị đánh dấu vi phạm chính sách."
          : task.status === "overdue"
            ? "KOC chưa hoàn thành nhiệm vụ đúng hạn."
            : null;

  return (
    <div>
      <DetailBackButton label="Quay lại nhiệm vụ" onClick={onBack} />

      <div className="mb-[18px] flex flex-col justify-between gap-4 rounded-[18px] border border-[#F0EFF6] bg-white p-5 shadow-[0_1px_3px_rgba(20,18,48,.05)] md:flex-row md:items-center md:p-6">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-base font-bold text-white" style={{ background: task.avatar }}>
            {task.initials}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[23px] font-extrabold">{task.koc}</h1>
              <StatusBadge label={meta.label} tone={meta.tone} />
            </div>
            <p className="mt-1 text-[13px] font-medium text-[#9C99B0]">
              {task.campaign} · {task.handle}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {task.status === "submitted" && (
            <>
              <button type="button" className="rounded-[11px] bg-[#E7F0FF] px-4 py-2.5 text-[13px] font-bold text-[#2563EB]">Nhắc Brand duyệt</button>
              <button type="button" className="rounded-[11px] bg-[#DEF7EC] px-4 py-2.5 text-[13px] font-bold text-[#0E9F6E]">Duyệt thay Brand</button>
            </>
          )}
          {task.status === "overdue" && (
            <>
              <button type="button" className="rounded-[11px] bg-[#EEE9FF] px-4 py-2.5 text-[13px] font-bold text-[#4A2FD6]">Gia hạn deadline</button>
              <button type="button" className="rounded-[11px] bg-[#F1F0F4] px-4 py-2.5 text-[13px] font-bold text-[#6E6B85]">Đánh dấu không hoàn thành</button>
            </>
          )}
          {task.status === "live" && task.issue && (
            <button type="button" className="rounded-[11px] bg-[#E7F0FF] px-4 py-2.5 text-[13px] font-bold text-[#2563EB]">Yêu cầu đăng lại</button>
          )}
        </div>
      </div>

      {alertText && (
        <div className="mb-[18px] flex items-center gap-3 rounded-[14px] border border-[#FADBD8] bg-[#FEF1F0] px-[18px] py-3.5 text-[13.5px] font-semibold text-[#C0362C]">
          <AlertIcon />
          {alertText}
        </div>
      )}

      <div className="mb-[18px] grid grid-cols-2 gap-[18px] xl:grid-cols-4">
        <DetailMetric label="Deadline" value={task.deadline} />
        <DetailMetric label="Nền tảng" value={task.content?.includes("youtube") ? "YouTube" : task.content?.includes("instagram") ? "Instagram" : "TikTok"} />
        <DetailMetric label="Ngày nộp" value={task.content ? "20/07/2026" : "—"} />
        <DetailMetric label="Trạng thái" value={meta.label} accent={task.status === "live"} />
      </div>

      <div className="grid grid-cols-1 gap-[18px] xl:grid-cols-5">
        <DetailCard title="Brief chiến dịch" className="xl:col-span-3">
          <div className="mb-5 rounded-[14px] bg-gradient-to-r from-[#F7F4FF] to-[#FFF6FA] p-4">
            <div className="text-[11.5px] font-bold uppercase tracking-[.6px] text-[#9C99B0]">Chiến dịch</div>
            <div className="mt-1 text-[15px] font-bold text-[#1A1830]">{task.campaign}</div>
          </div>
          <p className="text-[13.5px] font-medium leading-6 text-[#6E6B85]">
            Nội dung cần truyền tải trải nghiệm thực tế, đúng thông điệp thương hiệu và tuân thủ quy định công bố nội dung quảng cáo.
          </p>
        </DetailCard>

        <DetailCard title="Nhiệm vụ được giao" className="xl:col-span-2">
          <InfoRow label="Deliverable">{task.deliverable}</InfoRow>
          <InfoRow label="Deadline">{task.deadline}</InfoRow>
          <InfoRow label="Nền tảng">{task.content?.includes("youtube") ? "YouTube" : task.content?.includes("instagram") ? "Instagram" : "TikTok"}</InfoRow>
        </DetailCard>

        <DetailCard title="Nội dung KOC gửi duyệt" className="xl:col-span-3">
          {task.content ? (
            <>
              <InfoRow label="URL bài đăng"><span className="break-all text-[#6C4CF1]">{task.content}</span></InfoRow>
              <InfoRow label="Ngày nộp">20/07/2026</InfoRow>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="flex h-24 items-center justify-center rounded-[14px] border border-dashed border-[#DAD8E8] bg-[#FAFAFD] text-[12.5px] font-bold text-[#9C99B0]">Ảnh minh chứng</div>
                <div className="flex h-24 items-center justify-center rounded-[14px] border border-dashed border-[#DAD8E8] bg-[#FAFAFD] text-[12.5px] font-bold text-[#9C99B0]">Video minh chứng</div>
              </div>
            </>
          ) : (
            <div className="flex h-32 items-center justify-center rounded-[14px] bg-[#FAFAFD] text-[13px] font-semibold text-[#B0AEC0]">KOC chưa nộp nội dung.</div>
          )}
        </DetailCard>

        <DetailCard title="Trạng thái Brand phê duyệt" className="xl:col-span-2">
          <InfoRow label="Trạng thái"><StatusBadge label={meta.label} tone={meta.tone} /></InfoRow>
          <InfoRow label="Ngày quyết định">{task.status === "rejected" || task.status === "live" ? "21/07/2026" : "—"}</InfoRow>
          {task.status === "rejected" && <p className="mt-4 rounded-xl bg-[#FEF1F0] p-3.5 text-[12.5px] font-semibold leading-5 text-[#C0362C]">Nội dung chưa đúng tinh thần thương hiệu yêu cầu.</p>}
        </DetailCard>

        <DetailCard title="Lịch sử xử lý" className="xl:col-span-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <HistoryStep index="01" title="Nhiệm vụ được giao" date="01/07/2026" active />
            <HistoryStep index="02" title={task.content ? "KOC đã nộp bài" : "Chờ KOC nộp bài"} date={task.content ? "20/07/2026" : "Đang chờ"} active={Boolean(task.content)} />
            <HistoryStep index="03" title={task.status === "live" ? "Bài đăng đã lên sóng" : task.status === "rejected" ? "Brand đã từ chối" : "Chờ Brand xử lý"} date={task.status === "live" || task.status === "rejected" ? "21/07/2026" : "Đang chờ"} active={task.status === "live" || task.status === "rejected"} />
          </div>
        </DetailCard>
      </div>
    </div>
  );
}

function HistoryStep({ index, title, date, active }: { index: string; title: string; date: string; active: boolean }) {
  return (
    <div className={`rounded-[14px] border p-4 ${active ? "border-[#E1D9FF] bg-[#F8F6FF]" : "border-[#F0EFF6] bg-[#FAFAFD]"}`}>
      <div className={`mb-3 grid h-7 w-7 place-items-center rounded-full font-mono text-[11px] font-bold ${active ? "bg-[#6C4CF1] text-white" : "bg-[#ECEBF3] text-[#9C99B0]"}`}>{index}</div>
      <div className="text-[13px] font-bold">{title}</div>
      <div className="mt-1 text-xs font-semibold text-[#9C99B0]">{date}</div>
    </div>
  );
}

function TaskIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 11 3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>;
}
function ClockIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
}
function AlertIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.3 3.6 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>;
}
function TrendIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m22 7-8.5 8.5-5-5L2 17" /><path d="M16 7h6v6" /></svg>;
}
