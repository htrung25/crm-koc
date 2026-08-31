import { API_ROUTES } from "@/constants/routes";
import { apiFetch, readJson } from "@/lib/api/browser-client";
import type {
  AuditLogPage,
  AuditLogQuery,
} from "@/features/admin/audit-logs/types";

/**
 * Danh sách Audit Logs. Phân trang, tìm kiếm full-text và lọc đều do backend xử lý.
 */
export async function fetchAuditLogs(
  query: AuditLogQuery,
  signal?: AbortSignal,
): Promise<AuditLogPage> {
  const params = new URLSearchParams({
    page: String(query.page),
    limit: String(query.limit),
    sortOrder: query.sortOrder,
  });

  // Backend pg_trgm chặn search < 3 ký tự
  const trimmedSearch = query.search.trim();
  if (trimmedSearch && trimmedSearch.length >= 3) {
    params.set("search", trimmedSearch);
  }

  if (query.category) params.set("category", query.category);
  if (query.action) params.set("action", query.action);
  if (query.createdFrom) params.set("createdFrom", query.createdFrom);
  if (query.createdTo) params.set("createdTo", query.createdTo);

  return readJson<AuditLogPage>(
    await apiFetch(`${API_ROUTES.admin.auditLogs}?${params}`, { signal }),
  );
}
