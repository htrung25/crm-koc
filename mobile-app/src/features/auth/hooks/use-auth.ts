import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { tokenStorage } from '@/shared/storage/token-storage';

import { authApi } from '@/features/auth/api/auth.api';
import { authKeys } from '@/features/auth/api/query-keys';
import type { LoginInput, VerifyOtpInput } from '@/features/auth/model/schemas';
import { useSessionStore } from '@/features/auth/model/session-store';
import type { RegisterInput, RegisterRole } from '@/features/auth/model/types';

// Selector trả object mới mỗi lần sẽ khiến zustand v5 re-render vô hạn; tách
// từng field ra là cách an toàn nhất.
export function useSession() {
  const status = useSessionStore((state) => state.status);
  const account = useSessionStore((state) => state.account);
  return { status, account };
}

/** Chữ cái đầu của tên để hiện ở avatar; account chưa nạp thì dùng "?". */
export function useAccountInitial(): string {
  const name = useSessionStore((state) => state.account?.name);
  return name?.trim().charAt(0).toLocaleUpperCase() || '?';
}

export function useLogin() {
  return useMutation({
    mutationFn: (input: LoginInput) => authApi.login(input),
  });
}

// Đăng ký chỉ phát OTP; token có sau bước verify như đăng nhập
export function useRegister() {
  return useMutation({
    mutationFn: ({
      role,
      input,
    }: {
      role: RegisterRole;
      input: RegisterInput;
    }) => authApi.register(role, input),
  });
}

export function useVerifyOtp() {
  const signIn = useSessionStore((state) => state.signIn);

  return useMutation({
    mutationFn: async (input: VerifyOtpInput) => {
      const version = tokenStorage.getSessionVersion();
      const result = await authApi.verifyOtp(input);
      tokenStorage.assertSession(version);
      const { account, accessToken, refreshToken } = result;
      await signIn({ accessToken, refreshToken }, account);
      return result;
    },
  });
}

export function useResendOtp() {
  return useMutation({
    mutationFn: (email: string) => authApi.resendOtp(email),
  });
}

// Nguồn sự thật cho account; chỉ chạy khi đã có token.
export function useMe() {
  const status = useSessionStore((state) => state.status);
  const setAccount = useSessionStore((state) => state.setAccount);
  const sessionVersion = useSessionStore((state) => state.sessionVersion);

  const query = useQuery({
    queryKey: [...authKeys.me(), sessionVersion],
    queryFn: ({ signal }) => authApi.me(signal),
    enabled: status === 'authenticated',
  });

  useEffect(() => {
    if (query.data) setAccount(query.data, sessionVersion);
  }, [query.data, sessionVersion, setAccount]);

  return query;
}

export function useLogout() {
  const signOut = useSessionStore((state) => state.signOut);

  return useMutation({
    mutationFn: async () => {
      const version = tokenStorage.getSessionVersion();
      try {
        await authApi.logout();
      } finally {
        // Logout A trả về muộn không được xóa phiên B đã đăng nhập sau đó.
        if (version === tokenStorage.getSessionVersion()) await signOut();
      }
    },
  });
}
