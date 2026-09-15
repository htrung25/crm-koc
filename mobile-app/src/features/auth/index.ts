export { AccountGate } from '@/features/auth/components/account-gate';
export { FormError } from '@/features/auth/components/form-error';
export { LoginForm } from '@/features/auth/components/login-form';
export { OtpForm } from '@/features/auth/components/otp-form';
export { RoleRedirect } from '@/features/auth/components/role-redirect';
export {
  useAccountInitial,
  useLogin,
  useLogout,
  useMe,
  useRegister,
  useResendOtp,
  useSession,
  useVerifyOtp,
} from '@/features/auth/hooks/use-auth';
export {
  useSessionStore,
  type SessionStatus,
} from '@/features/auth/model/session-store';
export type { Account, Role } from '@/features/auth/model/types';

export { AccountScreen } from '@/features/auth/components/account-screen';
export { useAppEntry } from '@/features/auth/hooks/use-app-entry';

export { SignInScreen } from '@/features/auth/components/sign-in-screen';
export { RegisterScreen } from '@/features/auth/components/register-screen';
