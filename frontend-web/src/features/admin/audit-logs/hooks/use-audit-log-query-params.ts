import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";
import {
  AUDIT_LOG_CATEGORIES,
  AUDIT_LOG_ACTIONS,
  type AuditLogQuery,
  type AuditLogCategory,
  type AuditLogAction,
  type SortOrder,
} from "@/features/admin/audit-logs/types";

export const auditLogSearchParams = {
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(10),
  search: parseAsString.withDefault(""),
  category: parseAsStringLiteral([...AUDIT_LOG_CATEGORIES, ""] as const).withDefault(""),
  action: parseAsStringLiteral([...AUDIT_LOG_ACTIONS, ""] as const).withDefault(""),
  createdFrom: parseAsString.withDefault(""),
  createdTo: parseAsString.withDefault(""),
  sortOrder: parseAsStringLiteral(["ASC", "DESC"] as const).withDefault("DESC"),
};

export function useAuditLogQueryParams() {
  const [params, setParams] = useQueryStates(auditLogSearchParams, {
    shallow: true,
    history: "replace",
  });

  const query: AuditLogQuery = {
    page: params.page,
    limit: params.limit,
    search: params.search,
    category: params.category as AuditLogCategory | "",
    action: params.action as AuditLogAction | "",
    createdFrom: params.createdFrom || undefined,
    createdTo: params.createdTo || undefined,
    sortOrder: params.sortOrder as SortOrder,
  };

  const updateQuery = (patch: Partial<AuditLogQuery>) => {
    return setParams((prev) => {
      const next = { ...prev, ...patch };
      // Nếu filter thay đổi mà không truyền page mới, tự động về trang 1
      const isFilterChange =
        ("search" in patch && patch.search !== prev.search) ||
        ("category" in patch && patch.category !== prev.category) ||
        ("action" in patch && patch.action !== prev.action) ||
        ("createdFrom" in patch && patch.createdFrom !== prev.createdFrom) ||
        ("createdTo" in patch && patch.createdTo !== prev.createdTo);

      if (isFilterChange && !("page" in patch)) {
        next.page = 1;
      }
      return next;
    });
  };

  const resetQuery = () => {
    return setParams({
      page: 1,
      limit: 10,
      search: "",
      category: "",
      action: "",
      createdFrom: "",
      createdTo: "",
      sortOrder: "DESC",
    });
  };

  return {
    query,
    updateQuery,
    resetQuery,
  };
}
