import { apiClient } from '@/shared/api';

import type { Account, LoginResponse, OtpChallenge } from '../model/types';
import type { LoginInput, VerifyOtpInput } from '../model/schemas';

export const authApi = {
  async login(input: LoginInput): Promise<OtpChallenge> {
    const { data } = await apiClient.post<OtpChallenge>('/login/brand-creator', input);
    return data;
  },

  async verifyOtp(input: VerifyOtpInput): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>('/verify-otp', input);
    return data;
  },

  async resendOtp(email: string): Promise<OtpChallenge> {
    const { data } = await apiClient.post<OtpChallenge>('/resend-otp', { email });
    return data;
  },

  async me(): Promise<Account> {
    const { data } = await apiClient.get<Account>('/auth/me');
    return data;
  },

  async logout(): Promise<void> {
    await apiClient.post('/logout');
  },
};
