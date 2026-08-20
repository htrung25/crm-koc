import { API_ROUTES } from "@/constants/routes";
import { apiFetch, readJson } from "@/lib/api/browser-client";
import type { BrandPage, BrandQuery } from "@/features/admin/brands/types";

/**
 * Danh sách brand. Lọc/sắp xếp/phân trang đều do backend làm, nên bộ lọc đi
 * thẳng vào query string chứ không cắt trên mảng đã tải.
 */
export async function fetchBrands(
  query: BrandQuery,
  signal?: AbortSignal,
): Promise<BrandPage> {
  const params = new URLSearchParams({
    page: String(query.page),
    limit: String(query.limit),
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
  });
  if (query.search) params.set("search", query.search);
  if (query.status) params.set("status", String(query.status));

  return readJson<BrandPage>(
    await apiFetch(`${API_ROUTES.admin.brands}?${params}`, { signal }),
  );
}
