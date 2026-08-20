"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchBrands } from "@/features/admin/brands/services/brand.service";
import type { BrandQuery } from "@/features/admin/brands/types";

export function useBrands(query: BrandQuery) {
  return useQuery({
    // query nằm trong key nên đổi bộ lọc là react-query tự nạp lại và tự huỷ
    // request cũ — không phải tự dựng AbortController.
    queryKey: ["admin-brands", query],
    queryFn: ({ signal }) => fetchBrands(query, signal),
    // Giữ trang cũ trên màn hình khi đổi trang, tránh bảng nhấp nháy về rỗng.
    placeholderData: (previous) => previous,
  });
}
