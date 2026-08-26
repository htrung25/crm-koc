"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { APP_ROUTES } from "@/constants/routes";
import { ApiRequestError } from "@/lib/api/browser-client";
import type {
  AdminResponse,
  AdminRole,
} from "@/features/admin/ip-whitelist/types";
import { useAdmins } from "@/features/admin/ip-whitelist/hooks/use-admins";
import { IpWhitelistFilters } from "@/features/admin/ip-whitelist/components/ip-whitelist-filters";
import { IpWhitelistAddForm } from "@/features/admin/ip-whitelist/components/ip-whitelist-add-form";
import { IpWhitelistTable } from "@/features/admin/ip-whitelist/components/ip-whitelist-table";
import { IpWhitelistEditDialog } from "@/features/admin/ip-whitelist/components/ip-whitelist-edit-dialog";
import { IpWhitelistDeleteDialog } from "@/features/admin/ip-whitelist/components/ip-whitelist-delete-dialog";

export function AdminIpWhitelist() {
  const t = useTranslations("admin.ipWhitelist");
  const router = useRouter();

  // Data fetching via TanStack React Query
  const { data, isLoading, error, refetch } = useAdmins();
  const admins = useMemo(() => data?.data ?? [], [data?.data]);

  // Filtering & Pagination State
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<"all" | AdminRole>("all");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(8);

  // Dialog & Form UI state
  const [addingWhitelist, setAddingWhitelist] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminResponse | null>(null);
  const [deletingAdmin, setDeletingAdmin] = useState<AdminResponse | null>(null);
  const [forbidden, setForbidden] = useState(false);

  // 401 redirect if session expired
  useEffect(() => {
    if (error instanceof ApiRequestError && error.status === 401) {
      router.replace(APP_ROUTES.admin.login);
    }
  }, [error, router]);

  // Filtered list
  const filtered = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase("vi");
    return admins.filter((admin) => {
      const matchesRole = role === "all" || admin.adminRole === role;
      const haystack = `${admin.name} ${admin.email} ${admin.ipWhitelist ?? ""}`
        .toLocaleLowerCase("vi");
      return matchesRole && (!needle || haystack.includes(needle));
    });
  }, [admins, role, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  const visible = filtered.slice(
    (safePage - 1) * rowsPerPage,
    safePage * rowsPerPage,
  );

  return (
    <section className="space-y-4">
      {forbidden && (
        <p className="rounded-2xl bg-[#2D3B42]/8 px-4 py-3 text-xs font-semibold text-[#5C5049]">
          {t("readOnlyBanner")}
        </p>
      )}

      <div className="glass rounded-[26px] p-4 sm:p-5">
        <IpWhitelistFilters
          search={search}
          onSearchChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          role={role}
          onRoleChange={(newRole) => {
            setRole(newRole);
            setPage(1);
          }}
          addingWhitelist={addingWhitelist}
          onToggleAddWhitelist={() => setAddingWhitelist((prev) => !prev)}
          forbidden={forbidden}
        />

        {addingWhitelist && (
          <IpWhitelistAddForm
            admins={admins}
            onClose={() => setAddingWhitelist(false)}
            onForbidden={() => setForbidden(true)}
          />
        )}
      </div>

      <IpWhitelistTable
        totalCount={filtered.length}
        visible={visible}
        loading={isLoading}
        error={error ? (error as Error).message : null}
        safePage={safePage}
        totalPages={totalPages}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={(rows) => {
          setRowsPerPage(rows);
          setPage(1);
        }}
        forbidden={forbidden}
        onEdit={setEditingAdmin}
        onDelete={setDeletingAdmin}
        onRefresh={() => void refetch()}
      />

      {editingAdmin && (
        <IpWhitelistEditDialog
          admin={editingAdmin}
          onClose={() => setEditingAdmin(null)}
          onForbidden={() => setForbidden(true)}
        />
      )}

      {deletingAdmin && (
        <IpWhitelistDeleteDialog
          admin={deletingAdmin}
          onClose={() => setDeletingAdmin(null)}
        />
      )}
    </section>
  );
}
