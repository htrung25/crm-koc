"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { AuditLogRow } from "@/features/admin/audit-logs/types";

type AuditLogDetailDrawerProps = {
  log: AuditLogRow | null;
  onClose: () => void;
};

export function AuditLogDetailDrawer({
  log,
  onClose,
}: AuditLogDetailDrawerProps) {
  const t = useTranslations("admin.auditLogs");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!log) return null;

  const copyToClipboard = (text: string, key: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const formattedDate = new Date(log.createdAt).toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const isDangerAction =
    log.action.startsWith("fail_") || log.action === "reject";
  const isSuccessAction =
    log.action === "approve" ||
    log.action === "otp_sent" ||
    log.action === "logout";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#1E282D]/45 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="audit-log-detail-title"
        className="glass max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[28px] p-5 sm:p-6 space-y-5"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#2D3B42]/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${
                  log.category === "login"
                    ? "bg-purple-500/15 text-purple-700"
                    : log.category === "audit"
                      ? "bg-sky-500/15 text-sky-700"
                      : "bg-emerald-500/15 text-emerald-700"
                }`}
              >
                {t(`categories.${log.category}`)}
              </span>
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase font-mono tracking-wide ${
                  isDangerAction
                    ? "bg-red-500/15 text-red-700 ring-1 ring-red-500/20"
                    : isSuccessAction
                      ? "bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-500/20"
                      : "bg-[#2D3B42]/8 text-[#2D3B42] ring-1 ring-[#2D3B42]/15"
                }`}
              >
                {log.action}
              </span>
            </div>
            <h2
              id="audit-log-detail-title"
              className="mt-2 text-lg font-extrabold text-[#2D3B42]"
            >
              {t("detailTitle")}
            </h2>
            <p className="font-mono text-xs text-[#8A7768]">{formattedDate}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-xl bg-white/50 text-lg font-bold text-[#8A7768] hover:bg-white/80"
          >
            ×
          </button>
        </div>

        {/* Thông tin chính */}
        <div className="grid gap-3 sm:grid-cols-2">
          {/* Email / Tài khoản */}
          <div className="rounded-2xl bg-white/50 p-3.5 ring-1 ring-[#2D3B42]/10">
            <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[#8A7768]">
              {t("attemptedEmail")}
            </span>
            <div className="mt-1 flex items-center justify-between gap-2">
              <span className="font-semibold text-sm text-[#2D3B42] truncate">
                {log.emailAttempted || log.accountId || "—"}
              </span>
              {(log.emailAttempted || log.accountId) && (
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      (log.emailAttempted || log.accountId)!,
                      "email",
                    )
                  }
                  className="rounded-lg px-2 py-1 text-[11px] font-bold text-[#EF4623] hover:bg-[#EF4623]/10"
                >
                  {copiedKey === "email" ? t("copied") : t("copy")}
                </button>
              )}
            </div>
          </div>

          {/* Địa chỉ IP */}
          <div className="rounded-2xl bg-white/50 p-3.5 ring-1 ring-[#2D3B42]/10">
            <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[#8A7768]">
              IP Address
            </span>
            <div className="mt-1 flex items-center justify-between gap-2">
              <code className="font-mono font-bold text-sm text-[#2D3B42]">
                {log.ipAddress || "—"}
              </code>
              {log.ipAddress && (
                <button
                  type="button"
                  onClick={() => copyToClipboard(log.ipAddress!, "ip")}
                  className="rounded-lg px-2 py-1 text-[11px] font-bold text-[#EF4623] hover:bg-[#EF4623]/10"
                >
                  {copiedKey === "ip" ? t("copied") : t("copy")}
                </button>
              )}
            </div>
          </div>

          {/* Resource Type & Resource ID */}
          <div className="rounded-2xl bg-white/50 p-3.5 ring-1 ring-[#2D3B42]/10 sm:col-span-2">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[#8A7768]">
                  Resource Type
                </span>
                <span className="mt-1 block font-mono text-xs font-bold text-[#2D3B42]">
                  {log.resourceType || "—"}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[#8A7768]">
                  Resource ID
                </span>
                <span className="mt-1 block font-mono text-xs font-bold text-[#2D3B42] truncate">
                  {log.resourceId || "—"}
                </span>
              </div>
            </div>
          </div>

          {/* User Agent */}
          <div className="rounded-2xl bg-white/50 p-3.5 ring-1 ring-[#2D3B42]/10 sm:col-span-2">
            <div className="flex items-center justify-between gap-2">
              <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[#8A7768]">
                User Agent
              </span>
              {log.userAgent && (
                <button
                  type="button"
                  onClick={() => copyToClipboard(log.userAgent!, "ua")}
                  className="rounded-lg px-2 py-1 text-[11px] font-bold text-[#EF4623] hover:bg-[#EF4623]/10"
                >
                  {copiedKey === "ua" ? t("copied") : t("copy")}
                </button>
              )}
            </div>
            <p className="mt-1.5 break-all font-mono text-xs text-[#5C5049] bg-white/60 p-2.5 rounded-xl ring-1 ring-[#2D3B42]/5">
              {log.userAgent || "—"}
            </p>
          </div>
        </div>

        {/* Raw JSON Payload */}
        <div className="rounded-2xl bg-[#2D3B42] p-4 text-white">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-white/60">
              Raw JSON
            </span>
            <button
              type="button"
              onClick={() =>
                copyToClipboard(JSON.stringify(log, null, 2), "json")
              }
              className="rounded-lg bg-white/10 px-2.5 py-1 text-xs font-bold text-white hover:bg-white/20 transition-colors"
            >
              {copiedKey === "json" ? t("copied") : t("copyJson")}
            </button>
          </div>
          <pre className="max-h-48 overflow-y-auto font-mono text-[11px] text-white/90 leading-relaxed bg-black/25 p-3 rounded-xl">
            {JSON.stringify(log, null, 2)}
          </pre>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-white/60 px-5 py-2.5 text-sm font-extrabold text-[#5C5049] hover:bg-white hover:text-[#2D3B42] ring-1 ring-[#2D3B42]/10"
          >
            {t("close")}
          </button>
        </div>
      </div>
    </div>
  );
}
