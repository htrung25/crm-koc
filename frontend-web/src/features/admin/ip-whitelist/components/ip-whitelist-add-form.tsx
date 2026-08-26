"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { APP_ROUTES } from "@/constants/routes";
import { IconChevronDown } from "@/components/ui/icons";
import {
  MAX_WHITELIST_LENGTH,
  parseWhitelist,
  serializeWhitelist,
  validateEntry,
} from "@/features/admin/ip-whitelist/whitelist";
import { SUPER_ADMIN_REQUIRED } from "@/features/admin/ip-whitelist/types";
import type { AdminResponse } from "@/features/admin/ip-whitelist/types";
import { ApiRequestError } from "@/lib/api/browser-client";
import { SelfLockoutDialog } from "@/features/admin/ip-whitelist/components/self-lockout-dialog";
import { useUpdateAdmin } from "@/features/admin/ip-whitelist/hooks/use-admin-mutations";

type IpWhitelistAddFormProps = {
  admins: AdminResponse[];
  onClose: () => void;
  onForbidden: () => void;
};

export function IpWhitelistAddForm({
  admins,
  onClose,
  onForbidden,
}: IpWhitelistAddFormProps) {
  const t = useTranslations("admin.ipWhitelist");
  const tError = useTranslations("errors");
  const router = useRouter();

  const [selectedAdminId, setSelectedAdminId] = useState("");
  const [newWhitelistEntry, setNewWhitelistEntry] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [lockoutIp, setLockoutIp] = useState<string | null>(null);
  const [pendingWhitelistValue, setPendingWhitelistValue] = useState<
    string | null
  >(null);

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

  const handleSave = async (
    payloadOverride?: string | null,
    acknowledgeSelfLockout = false,
  ) => {
    const admin = admins.find((item) => item.id === selectedAdminId);
    if (!admin) {
      setError(t("pickEmail"));
      return;
    }

    const entry = newWhitelistEntry.trim();
    const validation =
      payloadOverride === undefined && entry ? validateEntry(entry) : null;

    if (validation) {
      setError(tError(validation));
      return;
    }

    const ipWhitelist =
      payloadOverride !== undefined
        ? payloadOverride
        : entry
          ? serializeWhitelist([...parseWhitelist(admin.ipWhitelist), entry])
          : null;

    if ((ipWhitelist?.length ?? 0) > MAX_WHITELIST_LENGTH) {
      setError(t("tooLong", { max: MAX_WHITELIST_LENGTH }));
      return;
    }

    setError(null);
    setLockoutIp(null);

    try {
      await updateMutation.mutateAsync({
        id: admin.id,
        payload: {
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
        setPendingWhitelistValue(ipWhitelist);
        setLockoutIp(requestError.clientIp);
        setError(describeError(requestError));
        return;
      }
      if (
        requestError.status === 403 &&
        requestError.businessCode === SUPER_ADMIN_REQUIRED
      ) {
        onForbidden();
        setError(t("superAdminList"));
        return;
      }
      setError(requestError.message);
    }
  };

  return (
    <>
      <form
        id="add-ip-whitelist-form"
        className="mt-4 grid gap-4 border-t border-[#2D3B42]/10 pt-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSave();
        }}
      >
        <label className="block text-xs font-extrabold text-[#5C5049]">
          Email admin
          <span className="relative mt-2 block">
            <select
              value={selectedAdminId}
              onChange={(event) => {
                setSelectedAdminId(event.target.value);
                setError(null);
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
              setError(null);
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
            disabled={updateMutation.isPending}
            onClick={onClose}
            className="h-12 rounded-2xl px-4 text-sm font-extrabold text-[#5C5049] hover:bg-white/50 disabled:opacity-50"
          >
            {t("cancel")}
          </button>
          <button
            type="submit"
            disabled={updateMutation.isPending || !selectedAdminId}
            className="h-12 rounded-2xl bg-gradient-to-br from-[#EF4623] to-[#D8410F] px-5 text-sm font-extrabold text-white shadow-lg shadow-[#EF4623]/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {updateMutation.isPending ? t("saving") : t("saveWhitelist")}
          </button>
        </div>

        {error && !lockoutIp && (
          <p
            role="alert"
            className="rounded-2xl bg-red-500/10 px-4 py-3 text-xs font-semibold text-red-700 lg:col-span-3"
          >
            {error}
          </p>
        )}
      </form>

      {lockoutIp && (
        <SelfLockoutDialog
          clientIp={lockoutIp}
          pending={updateMutation.isPending}
          error={error}
          onAddCurrentIp={() => {
            const next = serializeWhitelist([
              ...parseWhitelist(pendingWhitelistValue),
              lockoutIp,
            ]);
            setPendingWhitelistValue(next);
            void handleSave(next);
          }}
          onForce={() => void handleSave(pendingWhitelistValue, true)}
          onDismiss={() => setLockoutIp(null)}
        />
      )}
    </>
  );
}
