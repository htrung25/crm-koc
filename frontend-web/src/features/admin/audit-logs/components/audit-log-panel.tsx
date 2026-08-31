"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  DEFAULT_AUDIT_LOG_QUERY,
  type AuditLogQuery,
  type AuditLogRow,
} from "@/features/admin/audit-logs/types";
import { useAuditLogs } from "@/features/admin/audit-logs/hooks/use-audit-logs";
import { AuditLogFilters } from "@/features/admin/audit-logs/components/audit-log-filters";
import { AuditLogTable } from "@/features/admin/audit-logs/components/audit-log-table";
import { AuditLogDetailDrawer } from "@/features/admin/audit-logs/components/audit-log-detail-drawer";
import { ApiRequestError } from "@/lib/api/browser-client";

export function AuditLogPanel() {
  const t = useTranslations("admin.auditLogs");

  const [query, setQuery] = useState<AuditLogQuery>(DEFAULT_AUDIT_LOG_QUERY);
  const [selectedLog, setSelectedLog] = useState<AuditLogRow | null>(null);

  const { data, isLoading, error, refetch } = useAuditLogs(query);

  const handleQueryChange = (patch: Partial<AuditLogQuery>) => {
    setQuery((prev) => ({ ...prev, ...patch }));
  };

  const handleResetFilters = () => {
    setQuery(DEFAULT_AUDIT_LOG_QUERY);
  };

  const isForbidden =
    error instanceof ApiRequestError &&
    (error.status === 403 || error.businessCode === "SUPER_ADMIN_REQUIRED");

  return (
    <section className="space-y-4">
      {/* Header & Mô tả */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#2D3B42]">
          {t("pageTitle")}
        </h1>
        <p className="mt-1 text-xs font-semibold text-[#8A7768]">
          {t("pageSubtitle")}
        </p>
      </div>

      {/* Banner nếu không có quyền Super Admin */}
      {isForbidden ? (
        <div className="rounded-[26px] bg-red-500/10 p-6 text-center ring-1 ring-red-500/20 space-y-2">
          <h3 className="text-base font-extrabold text-red-700">
            {t("forbiddenTitle")}
          </h3>
          <p className="text-xs font-semibold text-red-600 max-w-md mx-auto">
            {t("forbiddenMessage")}
          </p>
        </div>
      ) : (
        <>
          {/* Bộ lọc */}
          <AuditLogFilters
            query={query}
            onChange={handleQueryChange}
            onReset={handleResetFilters}
            loading={isLoading}
          />

          {/* Bảng dữ liệu */}
          <AuditLogTable
            logs={data?.data ?? []}
            total={data?.total ?? 0}
            page={data?.page ?? query.page}
            totalPages={data?.totalPages ?? 1}
            limit={data?.limit ?? query.limit}
            loading={isLoading}
            onPageChange={(page) => handleQueryChange({ page })}
            onLimitChange={(limit) => handleQueryChange({ limit, page: 1 })}
            onSelectLog={setSelectedLog}
            onRefresh={() => void refetch()}
          />
        </>
      )}

      {/* Drawer xem chi tiết */}
      {selectedLog && (
        <AuditLogDetailDrawer
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </section>
  );
}
