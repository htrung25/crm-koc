"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  deleteAdmin,
  updateAdmin,
} from "@/features/admin/ip-whitelist/services/admin-account.service";
import { ADMIN_ACCOUNTS_QUERY_KEY } from "@/features/admin/ip-whitelist/hooks/use-admins";

type UpdateAdminParams = {
  id: string;
  payload: Record<string, unknown>;
};

export function useUpdateAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: UpdateAdminParams) =>
      updateAdmin(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_ACCOUNTS_QUERY_KEY });
      queryClient.setQueryData(
        ["admin-account-detail", updated.id],
        updated,
      );
    },
  });
}

export function useDeleteAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAdmin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_ACCOUNTS_QUERY_KEY });
    },
  });
}
