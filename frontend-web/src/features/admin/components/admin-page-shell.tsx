import type { ReactNode } from "react";

import { AdminMobileNav } from "@/features/admin/components/admin-mobile-nav";
import { AdminTopbar } from "@/features/admin/components/admin-topbar";

/**
 * Khung đầu trang của mọi màn hình quản trị: topbar + dải điều hướng cho màn
 * nhỏ. Nằm ở đây chứ không ở layout vì tiêu đề và lời chào khác nhau theo
 * từng trang, mà layout thì không biết mình đang bọc trang nào.
 */
export function AdminPageShell({
  title,
  greeting,
  children,
}: {
  title: string;
  greeting: string;
  children: ReactNode;
}) {
  return (
    <>
      <AdminTopbar title={title} greeting={greeting} />
      <AdminMobileNav />
      {children}
    </>
  );
}
