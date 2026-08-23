"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { APP_ROUTES } from "@/constants/routes";
import { IconPlus } from "@/components/ui/icons";
import {
  MAX_WHITELIST_LENGTH,
  parseWhitelist,
  serializeWhitelist,
  validateEntry,
} from "@/features/admin/ip-whitelist/whitelist";
import { SUPER_ADMIN_REQUIRED } from "@/features/admin/ip-whitelist/types";
import type { AdminResponse } from "@/features/admin/ip-whitelist/types";
import { STATUS_CODES } from "@/features/admin/types";
import { ApiRequestError } from "@/lib/api/browser-client";
import { SelfLockoutDialog } from "@/features/admin/ip-whitelist/components/self-lockout-dialog";
import { useUpdateAdmin } from "@/features/admin/ip-whitelist/hooks/use-admin-mutations";

type IpWhitelistEditDialogProps = {
  admin: AdminResponse;
  onClose: () => void;
  onForbidden: () => void;
};

export function IpWhitelistEditDialog({
  admin,
  onClose,
  onForbidden,
}: IpWhitelistEditDialogProps) {
  const t = useTranslations("admin.ipWhitelist");
  const tError = useTranslations("errors");
  const router = useRouter();

  const [name, setName] = useState(admin.name);
  const [email, setEmail] = useState(admin.email);
  const [phone, setPhone] = useState(admin.phone ?? "");
  const [status, setStatus] = useState(admin.status ?? 2);
  const [entries, setEntries] = useState<string[]>(() =>
    parseWhitelist(admin.ipWhitelist),
  );
  const [draftIp, setDraftIp] = useState("");
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [lockoutIp, setLockoutIp] = useState<string | null>(null);

  const updateMutation = useUpdateAdmin();

  const describeError = (failure: {
    message: string;
    businessCode?: string;
    clientIp?: string;
    status?: number;
  }) => {
    const code = failure.businessCode;
    if (!code || !tError.has(code)) return failure.message;
    return tError(code, {
      clientIp: failure.clientIp ?? "",
      entry: failure.message.split(": ").slice(1).join(": "),
      max: MAX_WHITELIST_LENGTH,
      status: failure.status ?? "",
    });
  };

  const addIp = () => {
    const value = draftIp.trim();
    const validation = validateEntry(value);
    if (validation) {
      setDialogError(tError(validation));
      return;
    }
    const next = [...entries, value];
    if (serializeWhitelist(next).length > MAX_WHITELIST_LENGTH) {
      setDialogError(t("tooLong", { max: MAX_WHITELIST_LENGTH }));
      return;
    }
    setEntries(next);
    setDraftIp("");
    setDialogError(null);
  };

  const removeIp = (indexToRemove: number) => {
    setEntries((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSave = async (
    acknowledgeSelfLockout = false,
    entriesOverride?: string[],
  ) => {
    setDialogError(null);
    setLockoutIp(null);

    const nextEntries = entriesOverride ?? entries;
    const ipWhitelist = serializeWhitelist(nextEntries);

    try {
      await updateMutation.mutateAsync({
        id: admin.id,
        payload: {
          name,
          email,
          phone: phone || null,
          status,
          ipWhitelist,
          acknowledgeSelfLockout,
        },
      });
      onClose();
    } catch (failure) {
      const requestError = failure as ApiRequestError;

      if (requestError.status === 401) {
        router.replace(APP_ROUTES.admin.login);
        return;
      }
      if (requestError.status === 422 && requestError.clientIp) {
        setLockoutIp(requestError.clientIp);
        setDialogError(describeError(requestError));
        return;
      }
      if (
        requestError.status === 403 &&
        requestError.businessCode === SUPER_ADMIN_REQUIRED
      ) {
        onForbidden();
        setDialogError(t("superAdminData"));
        return;
      }
      setDialogError(describeError(requestError));
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 grid place-items-center bg-[#1E282D]/45 p-4 backdrop-blur-sm">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-admin-title"
          className="glass max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[28px] p-5 sm:p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#EF4623]">
                {t("editEyebrow")}
              </p>
              <h2
                id="edit-admin-title"
                className="mt-1 text-xl font-extrabold text-[#2D3B42]"
              >
                {t("editTitle")}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-xl bg-white/50 text-lg font-bold text-[#8A7768]"
            >
              ×
            </button>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-extrabold text-[#5C5049]">
              {t("fieldName")}
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-2 h-11 w-full rounded-xl bg-white/65 px-3 text-sm font-semibold outline-none ring-1 ring-[#2D3B42]/10 focus:ring-2 focus:ring-[#EF4623]/35"
              />
            </label>
            <label className="text-xs font-extrabold text-[#5C5049]">
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 h-11 w-full rounded-xl bg-white/65 px-3 text-sm font-semibold outline-none ring-1 ring-[#2D3B42]/10 focus:ring-2 focus:ring-[#EF4623]/35"
              />
            </label>
            <label className="text-xs font-extrabold text-[#5C5049]">
              {t("fieldPhone")}
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="mt-2 h-11 w-full rounded-xl bg-white/65 px-3 text-sm font-semibold outline-none ring-1 ring-[#2D3B42]/10 focus:ring-2 focus:ring-[#EF4623]/35"
              />
            </label>
            <label className="text-xs font-extrabold text-[#5C5049]">
              {t("fieldStatus")}
              <select
                value={status}
                onChange={(event) => setStatus(Number(event.target.value))}
                className="mt-2 h-11 w-full rounded-xl bg-white/65 px-3 text-sm font-semibold outline-none ring-1 ring-[#2D3B42]/10"
              >
                {STATUS_CODES.map((code) => (
                  <option key={code} value={code}>
                    {t(`status.${code}`)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-5 rounded-2xl bg-white/38 p-4 ring-1 ring-[#2D3B42]/10">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-[#2D3B42]">
                  IP Whitelist
                </h3>
                <p className="text-[11px] font-semibold text-[#8A7768]">
                  {t("emptyMeansAll")}
                </p>
              </div>
              <span className="rounded-full bg-[#2D3B42]/8 px-2.5 py-1 font-mono text-[10px] font-bold text-[#5C5049]">
                {t("entryCount", { count: entries.length })}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {entries.map((entry, index) => (
                <span
                  key={`${entry}-${index}`}
                  className="flex items-center gap-2 rounded-full bg-white/75 py-1.5 pl-3 pr-1.5 text-xs font-bold text-[#2D3B42] ring-1 ring-[#2D3B42]/10"
                >
                  <code className="font-mono">{entry}</code>
                  <button
                    type="button"
                    onClick={() => removeIp(index)}
                    className="grid h-6 w-6 place-items-center rounded-full text-red-500 hover:bg-red-500/10"
                  >
                    ×
                  </button>
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
              <button
                type="button"
                onClick={addIp}
                className="grid h-11 w-11 place-items-center rounded-xl bg-[#2D3B42] text-white hover:bg-[#1E282D]"
              >
                <IconPlus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {dialogError && !lockoutIp && (
            <div className="mt-4 rounded-2xl bg-red-500/10 px-4 py-3 text-xs font-semibold text-red-700">
              {dialogError}
            </div>
          )}

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-sm font-extrabold text-[#5C5049] hover:bg-white/50"
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              disabled={
                updateMutation.isPending || !name.trim() || !email.trim()
              }
              onClick={() => void handleSave()}
              className="rounded-xl bg-gradient-to-br from-[#EF4623] to-[#D8410F] px-5 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-[#EF4623]/20 disabled:opacity-50"
            >
              {updateMutation.isPending ? t("saving") : t("saveChanges")}
            </button>
          </div>
        </div>
      </div>

      {lockoutIp && (
        <SelfLockoutDialog
          clientIp={lockoutIp}
          pending={updateMutation.isPending}
          error={dialogError}
          onAddCurrentIp={() => {
            const next = entries.includes(lockoutIp)
              ? entries
              : [...entries, lockoutIp];
            setEntries(next);
            void handleSave(false, next);
          }}
          onForce={() => void handleSave(true)}
          onDismiss={() => setLockoutIp(null)}
        />
      )}
    </>
  );
}
