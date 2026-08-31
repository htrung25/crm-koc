"use client";

import { useTranslations } from "next-intl";
import { IconChevron } from "@/components/ui/icons";
import type { AuditLogRow } from "@/features/admin/audit-logs/types";

type AuditLogTableProps = {
  logs: AuditLogRow[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
  loading: boolean;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onSelectLog: (log: AuditLogRow) => void;
  onRefresh: () => void;
};

export function AuditLogTable({
  logs,
  total,
  page,
  totalPages,
  limit,
  loading,
  onPageChange,
  onLimitChange,
  onSelectLog,
  onRefresh,
}: AuditLogTableProps) {
  const t = useTranslations("admin.auditLogs");

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return {
      date: d.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
      time: d.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    };
  };

  return (
    <div className="glass overflow-hidden rounded-[26px]">
      {/* Header của bảng */}
      <div className="flex items-center justify-between gap-3 border-b border-[#2D3B42]/10 px-5 py-4 sm:px-6">
        <div>
          <h2 className="text-base font-extrabold text-[#2D3B42]">
            {t("tableTitle")}
          </h2>
          <p className="mt-0.5 text-xs font-semibold text-[#8A7768]">
            {t("totalCount", { count: total })}
          </p>
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={onRefresh}
          className="rounded-xl px-3 py-2 text-xs font-extrabold text-[#EF4623] transition-colors hover:bg-[#EF4623]/10 disabled:opacity-50"
        >
          {t("refresh")}
        </button>
      </div>

      {/* Danh sách bản ghi */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] border-collapse text-left">
          <thead>
            <tr className="bg-white/35 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#8A7768]">
              <th className="w-14 px-4 py-4 text-center">STT</th>
              <th className="w-36 px-4 py-4">{t("colTime")}</th>
              <th className="w-28 px-4 py-4">{t("colCategory")}</th>
              <th className="w-36 px-4 py-4">{t("colAction")}</th>
              <th className="px-4 py-4">{t("colActor")}</th>
              <th className="w-32 px-4 py-4">{t("colIp")}</th>
              <th className="px-4 py-4">{t("colResource")}</th>
              <th className="w-24 px-5 py-4 text-right">{t("colActions")}</th>
            </tr>
          </thead>
          <tbody>
            {loading && logs.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-5 py-16 text-center text-sm font-semibold text-[#8A7768]"
                >
                  {t("loading")}
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-5 py-16 text-center text-sm font-semibold text-[#8A7768]"
                >
                  {t("empty")}
                </td>
              </tr>
            ) : (
              logs.map((log, index) => {
                const { date, time } = formatDate(log.createdAt);
                const isDanger =
                  log.action.startsWith("fail_") || log.action === "reject";
                const isSuccess =
                  log.action === "approve" ||
                  log.action === "otp_sent" ||
                  log.action === "logout";

                return (
                  <tr
                    key={log.id}
                    className="border-t border-[#2D3B42]/8 text-sm text-[#2D3B42] transition-colors hover:bg-white/30"
                  >
                    {/* STT */}
                    <td className="px-4 py-3.5 text-center font-mono text-xs text-[#8A7768]">
                      {(page - 1) * limit + index + 1}
                    </td>

                    {/* Thời gian */}
                    <td className="px-4 py-3.5 text-xs font-medium">
                      <div className="font-semibold text-[#2D3B42]">{time}</div>
                      <div className="text-[11px] text-[#8A7768] font-mono">
                        {date}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${
                          log.category === "login"
                            ? "bg-purple-500/12 text-purple-700"
                            : log.category === "audit"
                              ? "bg-sky-500/12 text-sky-700"
                              : "bg-emerald-500/12 text-emerald-700"
                        }`}
                      >
                        {t(`categories.${log.category}`)}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3.5 font-mono text-xs">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          isDanger
                            ? "bg-red-500/12 text-red-700 ring-1 ring-red-500/20"
                            : isSuccess
                              ? "bg-emerald-500/12 text-emerald-700 ring-1 ring-emerald-500/20"
                              : "bg-[#2D3B42]/8 text-[#2D3B42] ring-1 ring-[#2D3B42]/10"
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>

                    {/* Actor (Email / Account ID) */}
                    <td className="px-4 py-3.5 text-xs font-semibold text-[#2D3B42] max-w-[200px] truncate">
                      {log.emailAttempted || log.accountId || "—"}
                    </td>

                    {/* IP Address */}
                    <td className="px-4 py-3.5 font-mono text-xs text-[#5C5049]">
                      {log.ipAddress ? (
                        <code className="rounded-lg bg-white/60 px-2 py-0.5 ring-1 ring-[#2D3B42]/10">
                          {log.ipAddress}
                        </code>
                      ) : (
                        "—"
                      )}
                    </td>

                    {/* Resource Type & ID */}
                    <td className="px-4 py-3.5 text-xs">
                      {log.resourceType ? (
                        <div>
                          <span className="font-semibold text-[#2D3B42]">
                            {log.resourceType}
                          </span>
                          {log.resourceId && (
                            <span className="block font-mono text-[10px] text-[#8A7768] truncate max-w-[140px]">
                              {log.resourceId}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[#8A7768]">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => onSelectLog(log)}
                        className="rounded-xl px-2.5 py-1.5 text-xs font-extrabold text-[#5C5049] hover:bg-white/60 hover:text-[#2D3B42]"
                      >
                        {t("viewDetail")}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Phân trang */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#2D3B42]/10 px-5 py-4">
        <p className="text-xs font-semibold text-[#8A7768]">
          {t("pagination", {
            from: total ? (page - 1) * limit + 1 : 0,
            to: Math.min(page * limit, total),
            total,
          })}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(Math.max(1, page - 1))}
            className="grid h-9 w-9 place-items-center rounded-xl bg-white/45 text-[#5C5049] ring-1 ring-[#2D3B42]/10 disabled:opacity-35"
          >
            <IconChevron direction="left" />
          </button>
          <span className="grid h-9 min-w-9 place-items-center rounded-xl bg-[#EF4623] px-3 font-mono text-xs font-extrabold text-white">
            {page}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            className="grid h-9 w-9 place-items-center rounded-xl bg-white/45 text-[#5C5049] ring-1 ring-[#2D3B42]/10 disabled:opacity-35"
          >
            <IconChevron direction="right" />
          </button>
        </div>
        <label className="flex items-center gap-2 text-xs font-semibold text-[#8A7768]">
          <select
            value={limit}
            onChange={(event) => onLimitChange(Number(event.target.value))}
            className="h-9 rounded-xl bg-white/55 px-3 font-bold text-[#2D3B42] outline-none ring-1 ring-[#2D3B42]/10"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          {t("rowsPerPage")}
        </label>
      </div>
    </div>
  );
}
