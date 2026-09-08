"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { APP_ROUTES } from "@/constants/routes";
import { ApiRequestError } from "@/lib/api/browser-client";
import type {
  AdminResponse,
} from "@/features/admin/ip-whitelist/types";
import { useAdmins } from "@/features/admin/ip-whitelist/hooks/use-admins";
import { useIpWhitelistQueryParams } from "@/features/admin/ip-whitelist/hooks/use-ip-whitelist-query-params";
import { IpWhitelistFilters } from "@/features/admin/ip-whitelist/components/ip-whitelist-filters";
import { IpWhitelistAddForm } from "@/features/admin/ip-whitelist/components/ip-whitelist-add-form";
import { IpWhitelistTable } from "@/features/admin/ip-whitelist/components/ip-whitelist-table";
import { IpWhitelistEditDialog } from "@/features/admin/ip-whitelist/components/ip-whitelist-edit-dialog";
import { IpWhitelistDeleteDialog } from "@/features/admin/ip-whitelist/components/ip-whitelist-delete-dialog";

export function AdminIpWhitelist() {
  const t = useTranslations("admin.ipWhitelist");
  const router = useRouter();

  // Filtering & Pagination State synchronized with URL
  const {
    query,
    search,
    role,
    page,
    rowsPerPage,
    setSearch,
    setRole,
    setPage,
    setRowsPerPage,
  } = useIpWhitelistQueryParams();

  // Dialog & Form UI state
  const [addingWhitelist, setAddingWhitelist] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminResponse | null>(null);
  const [deletingAdmin, setDeletingAdmin] = useState<AdminResponse | null>(null);
  const [forbidden, setForbidden] = useState(false);

  // Data fetching via TanStack React Query với phân trang server-side
  const { data, isLoading, error, refetch } = useAdmins(query);

  // Danh sách admin đầy đủ cho dropdown form Thêm IP khi mở form
  const { data: allAdminsData } = useAdmins(
    addingWhitelist ? { page: 1, limit: 100 } : undefined,
  );

  // 401 redirect if session expired
  useEffect(() => {
    if (error instanceof ApiRequestError && error.status === 401) {
      router.replace(APP_ROUTES.admin.login);
    }
  }, [error, router]);

  // Phân trang và dữ liệu trực tiếp từ server
  const visible = data?.data ?? [];
  const totalCount = data?.total ?? 0;
  const totalPages = Math.max(1, data?.totalPages ?? 1);
  const safePage = data?.page ?? page;

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
          }}
          role={role}
          onRoleChange={(newRole) => {
            setRole(newRole);
          }}
          addingWhitelist={addingWhitelist}
          onToggleAddWhitelist={() => setAddingWhitelist((prev) => !prev)}
          forbidden={forbidden}
        />

        {addingWhitelist && (
          <IpWhitelistAddForm
            admins={allAdminsData?.data ?? visible}
            onClose={() => setAddingWhitelist(false)}
            onForbidden={() => setForbidden(true)}
          />
        )}
      </div>

      <IpWhitelistTable
        totalCount={totalCount}
        visible={visible}
        loading={isLoading}
        error={error ? (error as Error).message : null}
        safePage={safePage}
        totalPages={totalPages}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={(rows) => {
          setRowsPerPage(rows);
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
