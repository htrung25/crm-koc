import { apiClient } from '@/shared/api';

import type {
  Account,
  LoginResponse,
  OtpChallenge,
  RegisterInput,
  RegisterRole,
} from '@/features/auth/model/types';
import type { LoginInput, VerifyOtpInput } from '@/features/auth/model/schemas';
import {
  accountSchema,
  loginResponseSchema,
} from '@/features/auth/model/schemas';

export const authApi = {
  async login(input: LoginInput): Promise<OtpChallenge> {
    const { data } = await apiClient.post<OtpChallenge>(
      '/login/brand-creator',
      input
    );
    return data;
  },

  async register(
    role: RegisterRole,
    input: RegisterInput
  ): Promise<OtpChallenge> {
    const { data } = await apiClient.post<OtpChallenge>(
      `/register/${role}`,
      input
    );
    return data;
  },

  async verifyOtp(input: VerifyOtpInput): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>('/verify-otp', input);
    return loginResponseSchema.parse(data);
  },

  async resendOtp(email: string): Promise<OtpChallenge> {
    const { data } = await apiClient.post<OtpChallenge>('/resend-otp', {
      email,
    });
    return data;
  },

  async me(signal?: AbortSignal): Promise<Account> {
    const { data } = await apiClient.get<Account>('/auth/me', { signal });
    return accountSchema.parse(data);
  },

  async logout(): Promise<void> {
    await apiClient.post('/logout');
  },
};
