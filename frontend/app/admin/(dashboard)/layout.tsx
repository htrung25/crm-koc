import type { ReactNode } from "react";

import { AdminSidebar } from "@/components/admin/admin-sidebar";

/**
 * Khung dùng chung cho mọi trang quản trị: nền aurora ấm + sidebar bên trái.
 * Route group (dashboard) nên trang đăng nhập ở /admin không bị bọc layout này.
 */
export default function AdminDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen font-sans text-[#2D3B42] selection:bg-[#EF4623] selection:text-white">
      <div className="admin-aurora" aria-hidden="true" />

      <div className="mx-auto flex max-w-[1600px] gap-4 p-4">
        <AdminSidebar />
        <div className="flex min-w-0 flex-1 flex-col gap-4">{children}</div>
      </div>
    </div>
  );
}
