"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchAdmin,
  fetchAdmins,
} from "@/features/admin/ip-whitelist/services/admin-account.service";

export const ADMIN_ACCOUNTS_QUERY_KEY = ["admin-accounts"] as const;
export const adminDetailQueryKey = (id: string) =>
  ["admin-account-detail", id] as const;

export function useAdmins() {
  return useQuery({
    queryKey: ADMIN_ACCOUNTS_QUERY_KEY,
    queryFn: fetchAdmins,
  });
}

export function useAdminDetail(id: string | null) {
  return useQuery({
    queryKey: id ? adminDetailQueryKey(id) : ["admin-account-detail", ""],
    queryFn: () => (id ? fetchAdmin(id) : Promise.reject(new Error("No ID"))),
    enabled: Boolean(id),
  });
}
