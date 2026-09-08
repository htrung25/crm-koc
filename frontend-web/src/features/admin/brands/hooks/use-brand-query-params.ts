import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";
import type { AccountStatus } from "@/features/admin/types";
import {
  SORT_FIELDS,
  type BrandQuery,
  type SortField,
  type SortOrder,
} from "@/features/admin/brands/types";

export const brandSearchParams = {
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(10),
  search: parseAsString.withDefault(""),
  status: parseAsString.withDefault(""),
  sortBy: parseAsStringLiteral(SORT_FIELDS).withDefault("createdAt"),
  sortOrder: parseAsStringLiteral(["ASC", "DESC"] as const).withDefault("DESC"),
};

export function useBrandQueryParams() {
  const [params, setParams] = useQueryStates(brandSearchParams, {
    shallow: true,
    history: "replace",
  });

  const query: BrandQuery = {
    page: params.page,
    limit: params.limit,
    search: params.search,
    status: (params.status !== "" ? (Number(params.status) as AccountStatus) : "") as AccountStatus | "",
    sortBy: params.sortBy as SortField,
    sortOrder: params.sortOrder as SortOrder,
  };

  const updateQuery = (updater: BrandQuery | ((prev: BrandQuery) => BrandQuery)) => {
    const next = typeof updater === "function" ? updater(query) : updater;
    return setParams({
      page: next.page,
      limit: next.limit,
      search: next.search,
      status: next.status === "" ? "" : String(next.status),
      sortBy: next.sortBy,
      sortOrder: next.sortOrder,
    });
  };

  const resetQuery = () => {
    return setParams({
      page: 1,
      limit: 10,
      search: "",
      status: "",
      sortBy: "createdAt",
      sortOrder: "DESC",
    });
  };

  return {
    query,
    updateQuery,
    resetQuery,
  };
}
