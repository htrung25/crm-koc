"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

import {
  IconChevronDown,
  IconPlus,
  IconSearch,
  IconTrash,
} from "@/components/ui/icons";
import type {
  AdminPage,
  AdminResponse,
  AdminRole,
} from "@/features/admin/ip-whitelist/types";
import {
  MAX_WHITELIST_LENGTH,
  parseWhitelist,
  serializeWhitelist,
  validateEntry,
} from "@/features/admin/ip-whitelist/whitelist";
import { apiFetch } from "@/lib/api/fetch-client";
import { SelfLockoutDialog } from "@/components/admin/self-lockout-dialog";

type EditorState = {
  admin: AdminResponse;
  name: string;
  email: string;
  phone: string;
  status: number;
  entries: string[];
};

async function responseBody(response: Response) {
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(
      (body as { message?: string } | null)?.message ?? "Request failed.",
    ) as Error & { status: number; clientIp?: string; businessCode?: string };
    error.status = response.status;
    error.clientIp = (body as { clientIp?: string } | null)?.clientIp;
    error.businessCode = (body as { businessCode?: string } | null)?.businessCode;
    throw error;
  }
  return body;
}

function EditIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z" />
    </svg>
  );
}

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d={direction === "left" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
    </svg>
  );
}

const STATUS_CODES = [1, 2, 3, 4] as const;

export function AdminIpWhitelist() {
  const t = useTranslations("admin.ipWhitelist");
  const tError = useTranslations("errors");

  /** Dịch theo businessCode; mã chưa có bản dịch thì giữ nguyên message thô. */
  const describeError = (failure: {
    message: string;
    businessCode?: string;
    clientIp?: string;
  }) => {
    const code = failure.businessCode;
    if (!code || !tError.has(code)) return failure.message;
    return tError(code, {
      clientIp: failure.clientIp ?? "",
      entry: failure.message.split(": ").slice(1).join(": "),
    });
  };
  const router = useRouter();
  const [admins, setAdmins] = useState<AdminResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<"all" | AdminRole>("all");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(8);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [draftIp, setDraftIp] = useState("");
  const [saving, setSaving] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [lockoutIp, setLockoutIp] = useState<string | null>(null);
  // 403 REQUIRES_SUPER_ADMIN khoá UI về chỉ-đọc thay vì để bấm mãi rồi ăn 403.
  const [forbidden, setForbidden] = useState(false);
  const [deleting, setDeleting] = useState<AdminResponse | null>(null);
  const [addingWhitelist, setAddingWhitelist] = useState(false);
  const [selectedAdminId, setSelectedAdminId] = useState("");
  const [newWhitelistEntry, setNewWhitelistEntry] = useState("");
  const [addingWhitelistPending, setAddingWhitelistPending] = useState(false);
  const [addingWhitelistError, setAddingWhitelistError] = useState<string | null>(null);
  const [addingWhitelistLockoutIp, setAddingWhitelistLockoutIp] = useState<string | null>(null);
  const [pendingWhitelistValue, setPendingWhitelistValue] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch("/api/admin/accounts");
      const result = (await responseBody(response)) as AdminPage;
      setAdmins(result.data);
    } catch (failure) {
      const status = (failure as Error & { status?: number }).status;
      if (status === 401) {
        router.replace("/admin");
        return;
      }
      setError((failure as Error).message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    let active = true;

    apiFetch("/api/admin/accounts")
      .then(responseBody)
      .then((result) => {
        if (active) setAdmins((result as AdminPage).data);
      })
      .catch((failure: Error & { status?: number }) => {
        if (!active) return;
        if (failure.status === 401) {
          router.replace("/admin");
          return;
        }
        setError(failure.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [router]);

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

  const openEditor = async (admin: AdminResponse) => {
    setDialogError(null);
    setLockoutIp(null);
    try {
      const response = await apiFetch(`/api/admin/accounts/${admin.id}`);
      const detail = (await responseBody(response)) as AdminResponse;
      setEditor({
        admin: detail,
        name: detail.name,
        email: detail.email,
        phone: detail.phone ?? "",
        status: detail.status ?? 2,
        entries: parseWhitelist(detail.ipWhitelist),
      });
      setDraftIp("");
    } catch (failure) {
      setError((failure as Error).message);
    }
  };

  const addIp = () => {
    if (!editor) return;
    const value = draftIp.trim();
    const validation = validateEntry(value);
    if (validation) {
      setDialogError(tError(validation));
      return;
    }
    const next = [...editor.entries, value];
    if (serializeWhitelist(next).length > MAX_WHITELIST_LENGTH) {
      setDialogError(t("tooLong", { max: MAX_WHITELIST_LENGTH }));
      return;
    }
    setEditor({ ...editor, entries: next });
    setDraftIp("");
    setDialogError(null);
  };

  // `entriesOverride` để nút "thêm IP của tôi rồi lưu" gửi được danh sách mới
  // ngay, không phải chờ setEditor cập nhật state.
  const save = async (
    acknowledgeSelfLockout = false,
    entriesOverride?: string[],
  ) => {
    if (!editor) return;
    setSaving(true);
    setDialogError(null);
    setLockoutIp(null);
    try {
      const response = await apiFetch(`/api/admin/accounts/${editor.admin.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editor.name,
          email: editor.email,
          phone: editor.phone || null,
          status: editor.status,
          ipWhitelist: serializeWhitelist(entriesOverride ?? editor.entries),
          acknowledgeSelfLockout,
        }),
      });
      const updated = (await responseBody(response)) as AdminResponse;
      setAdmins((current) =>
        current.map((admin) => (admin.id === updated.id ? updated : admin)),
      );
      setEditor(null);
    } catch (failure) {
      const requestError = failure as Error & {
        status?: number;
        clientIp?: string;
        businessCode?: string;
      };
      if (requestError.status === 422 && requestError.clientIp) {
        setLockoutIp(requestError.clientIp);
        setDialogError(describeError(requestError));
        return;
      }
      if (
        requestError.status === 403 &&
        requestError.message === "REQUIRES_SUPER_ADMIN"
      ) {
        setForbidden(true);
        setDialogError(t("superAdminData"));
        return;
      }
      setDialogError(describeError(requestError));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setSaving(true);
    setDialogError(null);
    try {
      const response = await apiFetch(`/api/admin/accounts/${deleting.id}`, {
        method: "DELETE",
      });
      await responseBody(response);
      setAdmins((current) => current.filter((admin) => admin.id !== deleting.id));
      setDeleting(null);
    } catch (failure) {
      setDialogError((failure as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const closeWhitelistForm = () => {
    setAddingWhitelist(false);
    setSelectedAdminId("");
    setNewWhitelistEntry("");
    setAddingWhitelistError(null);
    setAddingWhitelistLockoutIp(null);
    setPendingWhitelistValue(null);
  };

  const saveNewWhitelist = async (
    payloadOverride?: string | null,
    acknowledgeSelfLockout = false,
  ) => {
    const admin = admins.find((item) => item.id === selectedAdminId);
    if (!admin) {
      setAddingWhitelistError(t("pickEmail"));
      return;
    }

    const entry = newWhitelistEntry.trim();
    const validation =
      payloadOverride === undefined && entry ? validateEntry(entry) : null;

    if (validation) {
      setAddingWhitelistError(tError(validation));
      return;
    }

    const ipWhitelist =
      payloadOverride !== undefined
        ? payloadOverride
        : entry
          ? serializeWhitelist([
              ...parseWhitelist(admin.ipWhitelist),
              entry,
            ])
          : null; // null = không giới hạn IP.

    if ((ipWhitelist?.length ?? 0) > MAX_WHITELIST_LENGTH) {
      setAddingWhitelistError(
        t("tooLong", { max: MAX_WHITELIST_LENGTH }),
      );
      return;
    }

    setAddingWhitelistPending(true);
    setAddingWhitelistError(null);
    setAddingWhitelistLockoutIp(null);

    try {
      const response = await apiFetch(`/api/admin/accounts/${admin.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ipWhitelist,
          acknowledgeSelfLockout,
        }),
      });
      const updated = (await responseBody(response)) as AdminResponse;
      setAdmins((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      closeWhitelistForm();
    } catch (failure) {
      const requestError = failure as Error & {
        status?: number;
        clientIp?: string;
      };

      if (requestError.status === 401) {
        router.replace("/admin");
        return;
      }
      if (requestError.status === 422 && requestError.clientIp) {
        setPendingWhitelistValue(ipWhitelist);
        setAddingWhitelistLockoutIp(requestError.clientIp);
        setAddingWhitelistError(requestError.message);
        return;
      }
      if (
        requestError.status === 403 &&
        requestError.message === "REQUIRES_SUPER_ADMIN"
      ) {
        setForbidden(true);
        setAddingWhitelistError(
          t("superAdminList"),
        );
        return;
      }
      setAddingWhitelistError(requestError.message);
    } finally {
      setAddingWhitelistPending(false);
    }
  };

  return (
    <section className="space-y-4">
      {forbidden && (
        <p className="rounded-2xl bg-[#2D3B42]/8 px-4 py-3 text-xs font-semibold text-[#5C5049]">
          {t("readOnlyBanner")}
        </p>
      )}

      <div className="glass rounded-[26px] p-4 sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_230px_auto]">
          <label className="block">
            <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-[#8A7768]">
              {t("search")}
            </span>
            <span className="flex h-12 items-center gap-3 rounded-2xl bg-white/65 px-4 ring-1 ring-[#2D3B42]/10 focus-within:ring-2 focus-within:ring-[#EF4623]/35">
              <IconSearch className="h-4 w-4 text-[#8A7768]" />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
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
                onChange={(event) => {
                  setRole(event.target.value as typeof role);
                  setPage(1);
                }}
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
            onClick={() => {
              setAddingWhitelist((current) => !current);
              setAddingWhitelistError(null);
            }}
            className="mt-auto flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#2D3B42] px-5 text-sm font-extrabold text-white transition-colors hover:bg-[#1E282D] disabled:cursor-not-allowed disabled:bg-[#2D3B42]/12 disabled:text-[#8A7768]"
          >
            <IconPlus className="h-4 w-4" />
            {t("addWhitelist")}
          </button>
        </div>

        {addingWhitelist && (
          <form
            id="add-ip-whitelist-form"
            className="mt-4 grid gap-4 border-t border-[#2D3B42]/10 pt-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
            onSubmit={(event) => {
              event.preventDefault();
              void saveNewWhitelist();
            }}
          >
            <label className="block text-xs font-extrabold text-[#5C5049]">
              Email admin
              <span className="relative mt-2 block">
                <select
                  value={selectedAdminId}
                  onChange={(event) => {
                    setSelectedAdminId(event.target.value);
                    setAddingWhitelistError(null);
                  }}
                  required
                  className="h-12 w-full appearance-none rounded-2xl bg-white/65 px-4 pr-10 text-sm font-semibold text-[#2D3B42] outline-none ring-1 ring-[#2D3B42]/10 focus:ring-2 focus:ring-[#EF4623]/35"
                >
                  <option value="">{t("chooseEmail")}</option>
                  {admins.map((admin) => (
                    <option key={admin.id} value={admin.id}>
                      {admin.email}
                    </option>
                  ))}
                </select>
                <IconChevronDown className="pointer-events-none absolute right-4 top-4 h-4 w-4 text-[#8A7768]" />
              </span>
            </label>

            <label className="block text-xs font-extrabold text-[#5C5049]">
              {t("addWhitelist")}
              <input
                value={newWhitelistEntry}
                onChange={(event) => {
                  setNewWhitelistEntry(event.target.value);
                  setAddingWhitelistError(null);
                }}
                placeholder={t("ipPlaceholder")}
                aria-describedby="add-ip-whitelist-help"
                className="mt-2 h-12 w-full rounded-2xl bg-white/65 px-4 font-mono text-sm font-semibold text-[#2D3B42] outline-none ring-1 ring-[#2D3B42]/10 placeholder:font-sans placeholder:text-[#A89685] focus:ring-2 focus:ring-[#EF4623]/35"
              />
              <span
                id="add-ip-whitelist-help"
                className="mt-2 block text-[11px] font-semibold leading-relaxed text-[#8A7768]"
              >
                {t("ipHint")}
              </span>
            </label>

            <div className="flex items-start gap-2 lg:pt-7">
              <button
                type="button"
                disabled={addingWhitelistPending}
                onClick={closeWhitelistForm}
                className="h-12 rounded-2xl px-4 text-sm font-extrabold text-[#5C5049] hover:bg-white/50 disabled:opacity-50"
              >
                {t("cancel")}
              </button>
              <button
                type="submit"
                disabled={addingWhitelistPending || !selectedAdminId}
                className="h-12 rounded-2xl bg-gradient-to-br from-[#EF4623] to-[#D8410F] px-5 text-sm font-extrabold text-white shadow-lg shadow-[#EF4623]/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {addingWhitelistPending ? t("saving") : t("saveWhitelist")}
              </button>
            </div>

            {addingWhitelistError && !addingWhitelistLockoutIp && (
              <p
                role="alert"
                className="rounded-2xl bg-red-500/10 px-4 py-3 text-xs font-semibold text-red-700 lg:col-span-3"
              >
                {addingWhitelistError}
              </p>
            )}
          </form>
        )}
      </div>

      <div className="glass overflow-hidden rounded-[26px]">
        <div className="flex items-center justify-between gap-3 border-b border-[#2D3B42]/10 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-base font-extrabold text-[#2D3B42]">IP Whitelist</h2>
            <p className="mt-0.5 text-xs font-semibold text-[#8A7768]">
              {t("accountCount", { count: filtered.length })}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
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
                  <td colSpan={6} className="px-5 py-16 text-center text-sm font-semibold text-[#8A7768]">
                    {t("loading")}
                  </td>
                </tr>
              ) : visible.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-sm font-semibold text-[#8A7768]">
                    {t("empty")}
                  </td>
                </tr>
              ) : (
                visible.map((admin, index) => {
                  const entries = parseWhitelist(admin.ipWhitelist);
                  return (
                    <tr key={admin.id} className="border-t border-[#2D3B42]/8 text-sm text-[#2D3B42] transition-colors hover:bg-white/25">
                      <td className="px-5 py-4 text-center font-mono text-xs text-[#8A7768]">
                        {(safePage - 1) * rowsPerPage + index + 1}
                      </td>
                      <td className="px-4 py-4 font-semibold">{admin.email}</td>
                      <td className="px-4 py-4 font-bold">{admin.name}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide ${
                          admin.adminRole === "super_admin"
                            ? "bg-[#EF4623]/12 text-[#D83B19]"
                            : "bg-[#2D3B42]/8 text-[#5C5049]"
                        }`}>
                          {admin.adminRole === "super_admin" ? "Super admin" : "Admin"}
                        </span>
                      </td>
                      <td className="max-w-[340px] px-4 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {entries.length ? (
                            entries.map((entry) => (
                              <code key={entry} className="rounded-lg bg-white/65 px-2 py-1 font-mono text-[11px] font-bold ring-1 ring-[#2D3B42]/10">
                                {entry}
                              </code>
                            ))
                          ) : (
                            <span className="text-xs font-semibold text-amber-700">{t("unrestricted")}</span>
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
                            onClick={() => void openEditor(admin)}
                            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-extrabold text-[#5C5049] hover:bg-white/60 hover:text-[#2D3B42]"
                          >
                            <EditIcon />
                            {t("edit")}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDialogError(null);
                              setDeleting(admin);
                            }}
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
              from: filtered.length ? (safePage - 1) * rowsPerPage + 1 : 0,
              to: Math.min(safePage * rowsPerPage, filtered.length),
              total: filtered.length,
            })}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage === 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="grid h-9 w-9 place-items-center rounded-xl bg-white/45 text-[#5C5049] ring-1 ring-[#2D3B42]/10 disabled:opacity-35"
            >
              <Chevron direction="left" />
            </button>
            <span className="grid h-9 min-w-9 place-items-center rounded-xl bg-[#EF4623] px-3 font-mono text-xs font-extrabold text-white">
              {safePage}
            </span>
            <button
              type="button"
              disabled={safePage === totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              className="grid h-9 w-9 place-items-center rounded-xl bg-white/45 text-[#5C5049] ring-1 ring-[#2D3B42]/10 disabled:opacity-35"
            >
              <Chevron direction="right" />
            </button>
          </div>
          <label className="flex items-center gap-2 text-xs font-semibold text-[#8A7768]">
            <select
              value={rowsPerPage}
              onChange={(event) => {
                setRowsPerPage(Number(event.target.value));
                setPage(1);
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

      {editor && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#1E282D]/45 p-4 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" aria-labelledby="edit-admin-title" className="glass max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[28px] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#EF4623]">{t("editEyebrow")}</p>
                <h2 id="edit-admin-title" className="mt-1 text-xl font-extrabold text-[#2D3B42]">{t("editTitle")}</h2>
              </div>
              <button type="button" onClick={() => setEditor(null)} className="grid h-9 w-9 place-items-center rounded-xl bg-white/50 text-lg font-bold text-[#8A7768]">×</button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-extrabold text-[#5C5049]">
                {t("fieldName")}
                <input value={editor.name} onChange={(event) => setEditor({ ...editor, name: event.target.value })} className="mt-2 h-11 w-full rounded-xl bg-white/65 px-3 text-sm font-semibold outline-none ring-1 ring-[#2D3B42]/10 focus:ring-2 focus:ring-[#EF4623]/35" />
              </label>
              <label className="text-xs font-extrabold text-[#5C5049]">
                Email
                <input type="email" value={editor.email} onChange={(event) => setEditor({ ...editor, email: event.target.value })} className="mt-2 h-11 w-full rounded-xl bg-white/65 px-3 text-sm font-semibold outline-none ring-1 ring-[#2D3B42]/10 focus:ring-2 focus:ring-[#EF4623]/35" />
              </label>
              <label className="text-xs font-extrabold text-[#5C5049]">
                {t("fieldPhone")}
                <input value={editor.phone} onChange={(event) => setEditor({ ...editor, phone: event.target.value })} className="mt-2 h-11 w-full rounded-xl bg-white/65 px-3 text-sm font-semibold outline-none ring-1 ring-[#2D3B42]/10 focus:ring-2 focus:ring-[#EF4623]/35" />
              </label>
              <label className="text-xs font-extrabold text-[#5C5049]">
                {t("fieldStatus")}
                <select value={editor.status} onChange={(event) => setEditor({ ...editor, status: Number(event.target.value) })} className="mt-2 h-11 w-full rounded-xl bg-white/65 px-3 text-sm font-semibold outline-none ring-1 ring-[#2D3B42]/10">
                  {STATUS_CODES.map((code) => <option key={code} value={code}>{t(`status.${code}`)}</option>)}
                </select>
              </label>
            </div>

            <div className="mt-5 rounded-2xl bg-white/38 p-4 ring-1 ring-[#2D3B42]/10">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-extrabold text-[#2D3B42]">IP Whitelist</h3>
                  <p className="text-[11px] font-semibold text-[#8A7768]">{t("emptyMeansAll")}</p>
                </div>
                <span className="rounded-full bg-[#2D3B42]/8 px-2.5 py-1 font-mono text-[10px] font-bold text-[#5C5049]">{t("entryCount", { count: editor.entries.length })}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {editor.entries.map((entry, index) => (
                  <span key={`${entry}-${index}`} className="flex items-center gap-2 rounded-full bg-white/75 py-1.5 pl-3 pr-1.5 text-xs font-bold text-[#2D3B42] ring-1 ring-[#2D3B42]/10">
                    <code className="font-mono">{entry}</code>
                    <button type="button" onClick={() => setEditor({ ...editor, entries: editor.entries.filter((_, itemIndex) => itemIndex !== index) })} className="grid h-6 w-6 place-items-center rounded-full text-red-500 hover:bg-red-500/10">×</button>
                  </span>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  value={draftIp}
                  onChange={(event) => setDraftIp(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addIp();
                    }
                  }}
                  placeholder={t("entryPlaceholder")}
                  className="h-11 min-w-0 flex-1 rounded-xl bg-white/75 px-3 font-mono text-xs font-semibold outline-none ring-1 ring-[#2D3B42]/10 focus:ring-2 focus:ring-[#EF4623]/35"
                />
                <button type="button" onClick={addIp} className="grid h-11 w-11 place-items-center rounded-xl bg-[#2D3B42] text-white hover:bg-[#1E282D]"><IconPlus className="h-4 w-4" /></button>
              </div>
            </div>

            {dialogError && !lockoutIp && (
              <div className="mt-4 rounded-2xl bg-red-500/10 px-4 py-3 text-xs font-semibold text-red-700">
                {dialogError}
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setEditor(null)} className="rounded-xl px-4 py-2.5 text-sm font-extrabold text-[#5C5049] hover:bg-white/50">{t("cancel")}</button>
              <button type="button" disabled={saving || !editor.name.trim() || !editor.email.trim()} onClick={() => void save()} className="rounded-xl bg-gradient-to-br from-[#EF4623] to-[#D8410F] px-5 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-[#EF4623]/20 disabled:opacity-50">
                {saving ? t("saving") : t("saveChanges")}
              </button>
            </div>
          </div>
        </div>
      )}

      {editor && lockoutIp && (
        <SelfLockoutDialog
          clientIp={lockoutIp}
          pending={saving}
          error={dialogError}
          onAddCurrentIp={() => {
            const next = editor.entries.includes(lockoutIp)
              ? editor.entries
              : [...editor.entries, lockoutIp];
            setEditor({ ...editor, entries: next });
            void save(false, next);
          }}
          onForce={() => void save(true)}
          onDismiss={() => setLockoutIp(null)}
        />
      )}

      {addingWhitelistLockoutIp && (
        <SelfLockoutDialog
          clientIp={addingWhitelistLockoutIp}
          pending={addingWhitelistPending}
          error={addingWhitelistError}
          onAddCurrentIp={() => {
            const next = serializeWhitelist([
              ...parseWhitelist(pendingWhitelistValue),
              addingWhitelistLockoutIp,
            ]);
            setPendingWhitelistValue(next);
            void saveNewWhitelist(next);
          }}
          onForce={() =>
            void saveNewWhitelist(pendingWhitelistValue, true)
          }
          onDismiss={() => setAddingWhitelistLockoutIp(null)}
        />
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#1E282D]/45 p-4 backdrop-blur-sm">
          <div role="alertdialog" aria-modal="true" className="glass w-full max-w-md rounded-[26px] p-6">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-red-500/12 text-red-600"><IconTrash className="h-5 w-5" /></span>
            <h2 className="mt-4 text-lg font-extrabold text-[#2D3B42]">{t("deleteTitle")}</h2>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-[#8A7768]">
              {t.rich("deleteBody", {
                email: deleting.email,
                strong: (chunks) => (
                  <strong className="text-[#2D3B42]">{chunks}</strong>
                ),
              })}
            </p>
            {dialogError && <p className="mt-3 rounded-xl bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-700">{dialogError}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setDeleting(null)} className="rounded-xl px-4 py-2.5 text-sm font-extrabold text-[#5C5049] hover:bg-white/50">{t("cancel")}</button>
              <button type="button" disabled={saving} onClick={() => void confirmDelete()} className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-extrabold text-white disabled:opacity-50">
                {saving ? t("deleting") : t("deleteConfirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
