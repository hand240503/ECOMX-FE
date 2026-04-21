import { useInfiniteQuery } from '@tanstack/react-query';
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

export function useHomeRecommendations() {
  const userId = useRecommendationUserId();
  const sessionId = useMemo(() => getOrCreateSessionId(), []);

  const query = useInfiniteQuery({
    queryKey: ['recommendations', 'home', userId, sessionId],
    queryFn: ({ pageParam }) =>
      recommendationService.getHome({
        userId,
        sessionId,
        offset: pageParam,
        limit: PAGE_SIZE,
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
