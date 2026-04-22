import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { recommendationService } from '../api/services/recommendationService';
import { useAuth } from '../app/auth/AuthProvider';
import { ANONYMOUS_USER_ID } from '../constants/recommendation';
import { getOrCreateSessionId } from '../lib/sessionId';

const PAGE_SIZE = 20;
const MAX_RANK = 500;

function useRecommendationUserId(): number {
  const { user } = useAuth();
  return user?.id ?? ANONYMOUS_USER_ID;
}

export function useHomeRecommendations(options?: { enabled?: boolean }) {
  const userId = useRecommendationUserId();
  const sessionId = useMemo(() => getOrCreateSessionId(), []);
  const enabled = options?.enabled !== false;

  const query = useInfiniteQuery({
    queryKey: ['recommendations', 'home', userId, sessionId],
    queryFn: ({ pageParam, signal }) =>
      recommendationService.getHome({
        userId,
        sessionId,
        offset: pageParam,
        limit: PAGE_SIZE,
        signal,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) {
        return undefined;
      }
      const nextOffset = allPages.length * PAGE_SIZE;
      if (nextOffset >= MAX_RANK) {
        return undefined;
      }
      return nextOffset;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled,
  });

  const products = useMemo(
    () => query.data?.pages.flatMap((p) => p) ?? [],
    [query.data?.pages]
  );

  return {
    ...query,
    products,
    pageSize: PAGE_SIZE,
  };
}

/**
 * Một lần gọi `GET /recommendations/home` (offset=0) — dùng khi chỉ cần vài sản phẩm, ví dụ giỏ trống.
 */
export function useHomeRecommendationsSnapshot(limit: number) {
  const userId = useRecommendationUserId();
  const sessionId = useMemo(() => getOrCreateSessionId(), []);
  const enabled = limit > 0;

  return useQuery({
    queryKey: ['recommendations', 'home', 'snapshot', userId, sessionId, limit],
    queryFn: ({ signal }) =>
      recommendationService.getHome({
        userId,
        sessionId,
        offset: 0,
        limit,
        signal,
      }),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled,
  });
}
