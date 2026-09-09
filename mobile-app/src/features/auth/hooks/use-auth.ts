import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { authApi } from '../api/auth.api';
import { authKeys } from '../api/query-keys';
import type { LoginInput, VerifyOtpInput } from '../model/schemas';
import { useSessionStore } from '../model/session-store';

// Selector trả object mới mỗi lần sẽ khiến zustand v5 re-render vô hạn; tách
// từng field ra là cách an toàn nhất.
export function useSession() {
  const status = useSessionStore((state) => state.status);
  const account = useSessionStore((state) => state.account);
  return { status, account };
}

export function useLogin() {
  return useMutation({
    mutationFn: (input: LoginInput) => authApi.login(input),
  });
}

export function useVerifyOtp() {
  const signIn = useSessionStore((state) => state.signIn);

  return useMutation({
    mutationFn: (input: VerifyOtpInput) => authApi.verifyOtp(input),
    onSuccess: async ({ account, accessToken, refreshToken }) => {
      await signIn({ accessToken, refreshToken }, account);
    },
  });
}

export function useResendOtp() {
  return useMutation({
    mutationFn: (email: string) => authApi.resendOtp(email),
  });
}

/** Nguồn sự thật cho account; chỉ chạy khi đã có token. */
export function useMe() {
  const status = useSessionStore((state) => state.status);
  const setAccount = useSessionStore((state) => state.setAccount);

  const query = useQuery({
    queryKey: authKeys.me(),
    queryFn: () => authApi.me(),
    enabled: status === 'authenticated',
  });

  useEffect(() => {
    if (query.data) setAccount(query.data);
  }, [query.data, setAccount]);

  return query;
}

export function useLogout() {
  const signOut = useSessionStore((state) => state.signOut);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logout(),
    // Token có thể đã chết ở server; dù sao vẫn phải dọn phía client.
    onSettled: async () => {
      await signOut();
      queryClient.clear();
    },
  });
}
