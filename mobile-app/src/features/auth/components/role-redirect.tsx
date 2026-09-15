import { Redirect } from 'expo-router';

import { useSession } from '@/features/auth/hooks/use-auth';
import { AccountScreen } from '@/features/auth/components/account-screen';

export function RoleRedirect() {
  const { account } = useSession();

  if (account?.accountRole === 'creator') return <Redirect href="/creator" />;
  if (account?.accountRole === 'brand') return <Redirect href="/brand" />;
  // ADMIN hoặc tài khoản chưa chọn vai trò chưa có giao diện riêng
  return <AccountScreen />;
}
