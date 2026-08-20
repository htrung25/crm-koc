"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

/**
 * QueryClient phải tạo trong `useState`, KHÔNG phải ở cấp module.
 *
 * Một instance ở cấp module bị chia sẻ giữa mọi request khi render phía server
 * — dữ liệu của người dùng này rò sang người dùng khác. `useState` với hàm
 * khởi tạo cho mỗi cây React một client riêng.
 */
export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60_000, retry: 1 },
          // Mutation KHÔNG được tự thử lại: PATCH bị 422 mà retry là bỏ qua
          // cảnh báo tự khoá, còn DELETE thử lại lần hai sẽ ăn 404 vì phần tử
          // đã bị xoá ở lần đầu.
          mutations: { retry: false },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
