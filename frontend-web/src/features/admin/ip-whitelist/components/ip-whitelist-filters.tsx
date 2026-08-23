"use client";

import { useTranslations } from "next-intl";
import {
  IconChevronDown,
  IconPlus,
  IconSearch,
} from "@/components/ui/icons";
import type { AdminRole } from "@/features/admin/ip-whitelist/types";

type IpWhitelistFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  role: "all" | AdminRole;
  onRoleChange: (role: "all" | AdminRole) => void;
  addingWhitelist: boolean;
  onToggleAddWhitelist: () => void;
  forbidden: boolean;
};

export function IpWhitelistFilters({
  search,
  onSearchChange,
  role,
  onRoleChange,
  addingWhitelist,
  onToggleAddWhitelist,
  forbidden,
}: IpWhitelistFiltersProps) {
  const t = useTranslations("admin.ipWhitelist");

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_230px_auto]">
      <label className="block">
        <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-[#8A7768]">
          {t("search")}
        </span>
        <span className="flex h-12 items-center gap-3 rounded-2xl bg-white/65 px-4 ring-1 ring-[#2D3B42]/10 focus-within:ring-2 focus-within:ring-[#EF4623]/35">
          <IconSearch className="h-4 w-4 text-[#8A7768]" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t("searchPlaceholder")}
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#2D3B42] outline-none placeholder:text-[#A89685]"
          />
        </span>
      </label>

      <label className="block">
        <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-[#8A7768]">
          {t("role")}
        </span>
        <span className="relative block">
          <select
            value={role}
            onChange={(event) =>
              onRoleChange(event.target.value as "all" | AdminRole)
            }
            className="h-12 w-full appearance-none rounded-2xl bg-white/65 px-4 pr-10 text-sm font-bold text-[#2D3B42] outline-none ring-1 ring-[#2D3B42]/10 focus:ring-2 focus:ring-[#EF4623]/35"
          >
            <option value="all">{t("allRoles")}</option>
            <option value="super_admin">Super admin</option>
            <option value="admin">Admin</option>
          </select>
          <IconChevronDown className="pointer-events-none absolute right-4 top-4 h-4 w-4 text-[#8A7768]" />
        </span>
      </label>

      <button
        type="button"
        disabled={forbidden}
        aria-expanded={addingWhitelist}
        aria-controls="add-ip-whitelist-form"
        onClick={onToggleAddWhitelist}
        className="mt-auto flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#2D3B42] px-5 text-sm font-extrabold text-white transition-colors hover:bg-[#1E282D] disabled:cursor-not-allowed disabled:bg-[#2D3B42]/12 disabled:text-[#8A7768]"
      >
        <IconPlus className="h-4 w-4" />
        {t("addWhitelist")}
      </button>
    </div>
  );
}
