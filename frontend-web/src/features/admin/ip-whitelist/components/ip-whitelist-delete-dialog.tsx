"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { IconTrash } from "@/components/ui/icons";
import type { AdminResponse } from "@/features/admin/ip-whitelist/types";
import { useDeleteAdmin } from "@/features/admin/ip-whitelist/hooks/use-admin-mutations";

type IpWhitelistDeleteDialogProps = {
  admin: AdminResponse;
  onClose: () => void;
};

export function IpWhitelistDeleteDialog({
  admin,
  onClose,
}: IpWhitelistDeleteDialogProps) {
  const t = useTranslations("admin.ipWhitelist");
  const [error, setError] = useState<string | null>(null);

  const deleteMutation = useDeleteAdmin();

  const handleConfirmDelete = async () => {
    setError(null);
    try {
      await deleteMutation.mutateAsync(admin.id);
      onClose();
    } catch (failure) {
      setError((failure as Error).message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#1E282D]/45 p-4 backdrop-blur-sm">
      <div
        role="alertdialog"
        aria-modal="true"
        className="glass w-full max-w-md rounded-[26px] p-6"
      >
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-red-500/12 text-red-600">
          <IconTrash className="h-5 w-5" />
        </span>
        <h2 className="mt-4 text-lg font-extrabold text-[#2D3B42]">
          {t("deleteTitle")}
        </h2>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-[#8A7768]">
          {t.rich("deleteBody", {
            email: admin.email,
            strong: (chunks) => (
              <strong className="text-[#2D3B42]">{chunks}</strong>
            ),
          })}
        </p>

        {error && (
          <p className="mt-3 rounded-xl bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-700">
            {error}
          </p>
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
            disabled={deleteMutation.isPending}
            onClick={() => void handleConfirmDelete()}
            className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-extrabold text-white disabled:opacity-50"
          >
            {deleteMutation.isPending ? t("deleting") : t("deleteConfirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
