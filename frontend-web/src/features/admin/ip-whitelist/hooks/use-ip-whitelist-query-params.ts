import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from 'nuqs';
import type {
  AdminQuery,
  AdminRole,
} from '@/features/admin/ip-whitelist/types';

export const ipWhitelistSearchParams = {
  search: parseAsString.withDefault(''),
  role: parseAsStringLiteral([
    'all',
    'admin',
    'super_admin',
  ] as const).withDefault('all'),
  page: parseAsInteger.withDefault(1),
  rowsPerPage: parseAsInteger.withDefault(8),
};

export function useIpWhitelistQueryParams() {
  const [params, setParams] = useQueryStates(ipWhitelistSearchParams, {
    shallow: true,
    history: 'replace',
  });

  const query: AdminQuery = {
    page: params.page,
    limit: params.rowsPerPage,
    search: params.search,
    role: params.role as 'all' | AdminRole,
  };

  const setSearch = (search: string) => {
    return setParams((prev) => ({
      ...prev,
      search,
      page: 1,
    }));
  };

  const setRole = (role: 'all' | AdminRole) => {
    return setParams((prev) => ({
      ...prev,
      role,
      page: 1,
    }));
  };

  const setPage = (page: number) => {
    return setParams((prev) => ({
      ...prev,
      page,
    }));
  };

  const setRowsPerPage = (rowsPerPage: number) => {
    return setParams((prev) => ({
      ...prev,
      rowsPerPage,
      page: 1,
    }));
  };

  return {
    query,
    search: params.search,
    role: params.role as 'all' | AdminRole,
    page: params.page,
    rowsPerPage: params.rowsPerPage,
    setSearch,
    setRole,
    setPage,
    setRowsPerPage,
  };
}
