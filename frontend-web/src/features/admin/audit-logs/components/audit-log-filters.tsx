"use client";

import { useTranslations } from "next-intl";
import {
  IconChevronDown,
  IconSearch,
} from "@/components/ui/icons";
import {
  AUDIT_LOG_CATEGORIES,
  LOGIN_ACTIONS,
  AUDIT_ACTIONS,
  APPROVAL_ACTIONS,
  type AuditLogCategory,
  type AuditLogAction,
  type AuditLogQuery,
} from "@/features/admin/audit-logs/types";

type AuditLogFiltersProps = {
  query: AuditLogQuery;
  onChange: (patch: Partial<AuditLogQuery>) => void;
  onReset: () => void;
  loading: boolean;
};

export function AuditLogFilters({
  query,
  onChange,
  onReset,
  loading,
}: AuditLogFiltersProps) {
  const t = useTranslations("admin.auditLogs");

  // Lọc danh sách action khả dụng dựa trên category đang chọn
  const availableActions =
    query.category === "login"
      ? LOGIN_ACTIONS
      : query.category === "audit"
        ? AUDIT_ACTIONS
        : query.category === "approval"
          ? APPROVAL_ACTIONS
          : [...LOGIN_ACTIONS, ...AUDIT_ACTIONS, ...APPROVAL_ACTIONS];

  const hasActiveFilters =
    Boolean(query.search) ||
    Boolean(query.category) ||
    Boolean(query.action) ||
    Boolean(query.createdFrom) ||
    Boolean(query.createdTo);

  return (
    <div className="glass rounded-[26px] p-4 sm:p-5 space-y-3.5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_180px_200px]">
        {/* Tìm kiếm Full-text */}
        <label className="block">
          <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-[#8A7768]">
            {t("search")}
          </span>
          <span className="flex h-12 items-center gap-3 rounded-2xl bg-white/65 px-4 ring-1 ring-[#2D3B42]/10 focus-within:ring-2 focus-within:ring-[#EF4623]/35">
            <IconSearch className="h-4 w-4 shrink-0 text-[#8A7768]" />
            <input
              value={query.search}
              onChange={(event) =>
                onChange({ search: event.target.value, page: 1 })
              }
              placeholder={t("searchPlaceholder")}
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#2D3B42] outline-none placeholder:text-[#A89685]"
            />
          </span>
          {query.search.trim().length > 0 && query.search.trim().length < 3 && (
            <span className="mt-1 block text-[11px] font-semibold text-amber-700">
              {t("minSearchLength")}
            </span>
          )}
        </label>

        {/* Lọc Category */}
        <label className="block">
          <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-[#8A7768]">
            {t("category")}
          </span>
          <span className="relative block">
            <select
              value={query.category}
              onChange={(event) =>
                onChange({
                  category: event.target.value as AuditLogCategory | "",
                  action: "", // Reset action khi đổi category
                  page: 1,
                })
              }
              className="h-12 w-full appearance-none rounded-2xl bg-white/65 px-4 pr-10 text-sm font-bold text-[#2D3B42] outline-none ring-1 ring-[#2D3B42]/10 focus:ring-2 focus:ring-[#EF4623]/35"
            >
              <option value="">{t("allCategories")}</option>
              {AUDIT_LOG_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {t(`categories.${cat}`)}
                </option>
              ))}
            </select>
            <IconChevronDown className="pointer-events-none absolute right-4 top-4 h-4 w-4 text-[#8A7768]" />
          </span>
        </label>

        {/* Lọc Action */}
        <label className="block">
          <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-[#8A7768]">
            {t("action")}
          </span>
          <span className="relative block">
            <select
              value={query.action}
              onChange={(event) =>
                onChange({
                  action: event.target.value as AuditLogAction | "",
                  page: 1,
                })
              }
              className="h-12 w-full appearance-none rounded-2xl bg-white/65 px-4 pr-10 text-sm font-bold text-[#2D3B42] outline-none ring-1 ring-[#2D3B42]/10 focus:ring-2 focus:ring-[#EF4623]/35"
            >
              <option value="">{t("allActions")}</option>
              {availableActions.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
            <IconChevronDown className="pointer-events-none absolute right-4 top-4 h-4 w-4 text-[#8A7768]" />
          </span>
        </label>
      </div>

      {/* Dòng bộ lọc phụ: Khoảng thời gian & Nút Reset */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#2D3B42]/10 pt-3.5">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#8A7768]">
              {t("from")}:
            </span>
            <input
              type="date"
              value={query.createdFrom ?? ""}
              onChange={(e) =>
                onChange({ createdFrom: e.target.value || undefined, page: 1 })
              }
              className="h-10 rounded-xl bg-white/65 px-3 text-xs font-bold text-[#2D3B42] outline-none ring-1 ring-[#2D3B42]/10 focus:ring-2 focus:ring-[#EF4623]/35"
            />
          </label>

          <label className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#8A7768]">{t("to")}:</span>
            <input
              type="date"
              value={query.createdTo ?? ""}
              onChange={(e) =>
                onChange({ createdTo: e.target.value || undefined, page: 1 })
              }
              className="h-10 rounded-xl bg-white/65 px-3 text-xs font-bold text-[#2D3B42] outline-none ring-1 ring-[#2D3B42]/10 focus:ring-2 focus:ring-[#EF4623]/35"
            />
          </label>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            disabled={loading}
            onClick={onReset}
            className="rounded-xl px-3 py-2 text-xs font-extrabold text-[#EF4623] hover:bg-[#EF4623]/10 transition-colors disabled:opacity-50"
          >
            {t("resetFilters")}
          </button>
        )}
      </div>
    </div>
  );
}
