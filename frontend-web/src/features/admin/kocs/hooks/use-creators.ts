'use client';
import { useQuery } from '@tanstack/react-query';
import { fetchCreator, fetchCreators } from '../services/creator.service';
import type { CreatorListQuery } from '../creator-types';
import { ApiRequestError } from '@/lib/api/browser-client';

const retry = (count: number, error: Error) =>
  count < 1 && (!(error instanceof ApiRequestError) || error.status >= 500);
export function useCreators(query: CreatorListQuery) {
  return useQuery({
    queryKey: ['admin-creators', query],
    queryFn: ({ signal }) => fetchCreators(query, signal),
    retry,
  });
}
export function useCreator(id: string, historyPage: number) {
  // No placeholder from another Creator: changing ID must show its own loading state.
  return useQuery({
    queryKey: ['admin-creator', id, historyPage],
    queryFn: ({ signal }) => fetchCreator(id, historyPage, signal),
    retry,
  });
}
