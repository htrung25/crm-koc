"use client";

import { useTranslations } from "next-intl";
import {
  IconChevron,
  IconPencil,
  IconTrash,
} from "@/components/ui/icons";
import { parseWhitelist } from "@/features/admin/ip-whitelist/whitelist";
import type { AdminResponse } from "@/features/admin/ip-whitelist/types";

type IpWhitelistTableProps = {
  totalCount: number;
  visible: AdminResponse[];
  loading: boolean;
  error: string | null;
  safePage: number;
  totalPages: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
  forbidden: boolean;
  onEdit: (admin: AdminResponse) => void;
  onDelete: (admin: AdminResponse) => void;
  onRefresh: () => void;
};

export function IpWhitelistTable({
  totalCount,
  visible,
  loading,
  error,
  safePage,
  totalPages,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  forbidden,
  onEdit,
  onDelete,
  onRefresh,
}: IpWhitelistTableProps) {
  const t = useTranslations("admin.ipWhitelist");

  return (
    <div className="glass overflow-hidden rounded-[26px]">
      <div className="flex items-center justify-between gap-3 border-b border-[#2D3B42]/10 px-5 py-4 sm:px-6">
        <div>
          <h2 className="text-base font-extrabold text-[#2D3B42]">
            IP Whitelist
          </h2>
          <p className="mt-0.5 text-xs font-semibold text-[#8A7768]">
            {t("accountCount", { count: totalCount })}
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="rounded-xl px-3 py-2 text-xs font-extrabold text-[#EF4623] transition-colors hover:bg-[#EF4623]/10"
        >
          {t("refresh")}
        </button>
      </div>

      {error && (
        <div className="mx-5 mt-4 rounded-2xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-left">
          <thead>
            <tr className="bg-white/35 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#8A7768]">
              <th className="w-16 px-5 py-4 text-center">STT</th>
              <th className="px-4 py-4">Email</th>
              <th className="px-4 py-4">{t("colName")}</th>
              <th className="px-4 py-4">{t("colRole")}</th>
              <th className="px-4 py-4">{t("colIp")}</th>
              <th className="px-5 py-4 text-right">{t("colActions")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-16 text-center text-sm font-semibold text-[#8A7768]"
                >
                  {t("loading")}
                </td>
              </tr>
            ) : visible.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-16 text-center text-sm font-semibold text-[#8A7768]"
                >
                  {t("empty")}
                </td>
              </tr>
            ) : (
              visible.map((admin, index) => {
                const entries = parseWhitelist(admin.ipWhitelist);
                return (
                  <tr
                    key={admin.id}
                    className="border-t border-[#2D3B42]/8 text-sm text-[#2D3B42] transition-colors hover:bg-white/25"
                  >
                    <td className="px-5 py-4 text-center font-mono text-xs text-[#8A7768]">
                      {(safePage - 1) * rowsPerPage + index + 1}
                    </td>
                    <td className="px-4 py-4 font-semibold">{admin.email}</td>
                    <td className="px-4 py-4 font-bold">{admin.name}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide ${
                          admin.adminRole === "super_admin"
                            ? "bg-[#EF4623]/12 text-[#D83B19]"
                            : "bg-[#2D3B42]/8 text-[#5C5049]"
                        }`}
                      >
                        {admin.adminRole === "super_admin"
                          ? "Super admin"
                          : "Admin"}
                      </span>
                    </td>
                    <td className="max-w-[340px] px-4 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {entries.length ? (
                          entries.map((entry) => (
                            <code
                              key={entry}
                              className="rounded-lg bg-white/65 px-2 py-1 font-mono text-[11px] font-bold ring-1 ring-[#2D3B42]/10"
                            >
                              {entry}
                            </code>
                          ))
                        ) : (
                          <span className="text-xs font-semibold text-amber-700">
                            {t("unrestricted")}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1.5">
                        {forbidden ? (
                          <span className="px-3 py-2 text-xs font-semibold text-[#8A7768]">
                            {t("viewOnly")}
                          </span>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => onEdit(admin)}
                              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-extrabold text-[#5C5049] hover:bg-white/60 hover:text-[#2D3B42]"
                            >
                              <IconPencil />
                              {t("edit")}
                            </button>
                            <button
                              type="button"
                              onClick={() => onDelete(admin)}
                              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-extrabold text-red-600 hover:bg-red-500/10"
                            >
                              <IconTrash className="h-4 w-4" />
                              {t("delete")}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#2D3B42]/10 px-5 py-4">
        <p className="text-xs font-semibold text-[#8A7768]">
          {t("pagination", {
            from: totalCount ? (safePage - 1) * rowsPerPage + 1 : 0,
            to: Math.min(safePage * rowsPerPage, totalCount),
            total: totalCount,
          })}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={safePage === 1}
            onClick={() => onPageChange(Math.max(1, safePage - 1))}
            className="grid h-9 w-9 place-items-center rounded-xl bg-white/45 text-[#5C5049] ring-1 ring-[#2D3B42]/10 disabled:opacity-35"
          >
            <IconChevron direction="left" />
          </button>
          <span className="grid h-9 min-w-9 place-items-center rounded-xl bg-[#EF4623] px-3 font-mono text-xs font-extrabold text-white">
            {safePage}
          </span>
          <button
            type="button"
            disabled={safePage === totalPages}
            onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
            className="grid h-9 w-9 place-items-center rounded-xl bg-white/45 text-[#5C5049] ring-1 ring-[#2D3B42]/10 disabled:opacity-35"
          >
            <IconChevron direction="right" />
          </button>
        </div>
        <label className="flex items-center gap-2 text-xs font-semibold text-[#8A7768]">
          <select
            value={rowsPerPage}
            onChange={(event) => {
              onRowsPerPageChange(Number(event.target.value));
            }}
            className="h-9 rounded-xl bg-white/55 px-3 font-bold text-[#2D3B42] outline-none ring-1 ring-[#2D3B42]/10"
          >
            <option value={5}>5</option>
            <option value={8}>8</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
          {t("rowsPerPage")}
        </label>
      </div>
    </div>
  );
}
