"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getProfile,
  updateProfile,
} from "@/features/admin/profile/services/profile.service";
import type { AdminProfile } from "@/features/admin/profile/types";

export const PROFILE_KEY = ["admin-profile"] as const;

export function useAdminProfile() {
  return useQuery({ queryKey: PROFILE_KEY, queryFn: getProfile });
}

type UpdateCallbacks = {
  onSuccess: (updated: AdminProfile) => void;
  onError: (failure: unknown) => void;
  onMutate: () => void;
};

export function useUpdateAdminProfile({
  onSuccess,
  onError,
  onMutate,
}: UpdateCallbacks) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfile,
    onMutate,
    onSuccess: (updated) => {
      queryClient.setQueryData(PROFILE_KEY, updated);
      onSuccess(updated);
    },
    onError,
  });
}
