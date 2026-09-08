"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchAdmin,
  fetchAdmins,
} from "@/features/admin/ip-whitelist/services/admin-account.service";

import type { AdminQuery } from "@/features/admin/ip-whitelist/types";

export const ADMIN_ACCOUNTS_QUERY_KEY = "admin-accounts";
export const adminDetailQueryKey = (id: string) =>
  ["admin-account-detail", id] as const;

export function useAdmins(query?: Partial<AdminQuery>) {
  return useQuery({
    queryKey: [ADMIN_ACCOUNTS_QUERY_KEY, query],
    queryFn: ({ signal }) => fetchAdmins(query, signal),
    placeholderData: (previous) => previous,
  });
}

export function useAdminDetail(id: string | null) {
  return useQuery({
    queryKey: id ? adminDetailQueryKey(id) : ["admin-account-detail", ""],
    queryFn: () => (id ? fetchAdmin(id) : Promise.reject(new Error("No ID"))),
    enabled: Boolean(id),
  });
}
