"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAuditLogs } from "@/features/admin/audit-logs/services/audit-log.service";
import type { AuditLogQuery } from "@/features/admin/audit-logs/types";

export const AUDIT_LOGS_QUERY_KEY = "admin-audit-logs";

export function useAuditLogs(query: AuditLogQuery) {
  return useQuery({
    queryKey: [AUDIT_LOGS_QUERY_KEY, query],
    queryFn: ({ signal }) => fetchAuditLogs(query, signal),
    // Giữ lại dữ liệu trang cũ khi chuyển trang hoặc đổi bộ lọc, tránh nhấp nháy UI
    placeholderData: (previous) => previous,
  });
}
