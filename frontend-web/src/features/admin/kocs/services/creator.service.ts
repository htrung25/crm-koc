import { API_ROUTES } from '@/constants/routes';
import { apiFetch, readJson, ApiRequestError } from '@/lib/api/browser-client';
import {
  creatorPageSchema,
  creatorDetailSchema,
  type CreatorListQuery,
} from '../creator-types';

export async function fetchCreators(
  query: CreatorListQuery,
  signal?: AbortSignal
) {
  const params = new URLSearchParams({
    page: String(query.page),
    limit: String(query.limit),
    sortBy: 'createdAt',
    sortOrder: 'DESC',
  });
  if (query.search) params.set('search', query.search);
  if (query.status) params.set('status', query.status);
  const result = creatorPageSchema.safeParse(
    await readJson(
      await apiFetch(`${API_ROUTES.admin.creators}?${params}`, { signal })
    )
  );
  if (!result.success)
    throw new ApiRequestError(
      'Invalid Creator response',
      502,
      'INVALID_SERVER_RESPONSE'
    );
  return result.data;
}

export async function fetchCreator(
  id: string,
  historyPage: number,
  signal?: AbortSignal
) {
  const result = creatorDetailSchema.safeParse(
    await readJson(
      await apiFetch(
        `${API_ROUTES.admin.creator(id)}?historyPage=${historyPage}&historyLimit=10`,
        { signal }
      )
    )
  );
  if (!result.success || result.data.id !== id)
    throw new ApiRequestError(
      'Invalid Creator response',
      502,
      'INVALID_SERVER_RESPONSE'
    );
  return result.data;
}
