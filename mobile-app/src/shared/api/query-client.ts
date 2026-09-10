import { QueryClient } from '@tanstack/react-query';

import { ApiError } from './errors';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        // Retry 4xx là vô ích: lỗi do request chứ không do đường truyền.
        retry: (failureCount, error) => {
          if (error instanceof ApiError && error.kind !== 'network' && error.kind !== 'server') {
            return false;
          }
          return failureCount < 2;
        },
      },
      mutations: {
        retry: false,
      },
    },
  });
}
