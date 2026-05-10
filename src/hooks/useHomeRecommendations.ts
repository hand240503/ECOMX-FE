import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { recommendationService } from '../api/services/recommendationService';
import { useAuth } from '../app/auth/AuthProvider';
import type { ProductFullResponse } from '../api/types/product.types';
import { getOrCreateSessionId } from '../lib/sessionId';

const PAGE_SIZE = 25;
const MAX_RANK = 500;
/** Một lần bấm «Xem thêm»: tối đa bao nhiêu request nối tiếp nếu API trả trùng id giữa các offset. */
const MAX_FETCH_CHAIN = 8;

/** Backend có thể trả cùng `id` ở nhiều offset — gộp trang không được trùng `key` trong React. */
function dedupeProductsById(products: ProductFullResponse[]): ProductFullResponse[] {
  const seen = new Set<number>();
  const out: ProductFullResponse[] = [];
  for (const p of products) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    out.push(p);
  }
  return out;
}

export function useHomeRecommendations(options?: { enabled?: boolean }) {
  const { user, isAuthenticated } = useAuth();
  const userId = isAuthenticated && user?.id != null ? user.id : undefined;
  const sessionId = useMemo(() => getOrCreateSessionId(), []);
  const enabled = options?.enabled !== false;

  const query = useInfiniteQuery({
    queryKey: ['recommendations', 'home', isAuthenticated ? userId : 'guest', sessionId],
    queryFn: ({ pageParam, signal }) =>
      recommendationService.getHome({
        ...(userId != null ? { userId } : {}),
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
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    enabled,
  });

  const products = useMemo(
    () => dedupeProductsById(query.data?.pages.flatMap((p) => p) ?? []),
    [query.data?.pages]
  );

  const fetchNextPagePreferUnique = useCallback(async () => {
    const startUnique = dedupeProductsById(query.data?.pages.flatMap((p) => p) ?? []).length;
    let prevUnique = startUnique;
    let iterations = 0;

    while (iterations < MAX_FETCH_CHAIN) {
      const result = await query.fetchNextPage();
      iterations += 1;

      const pages = result.data?.pages ?? [];
      const flat = pages.flatMap((p) => p);
      const lastPage = pages[pages.length - 1] ?? [];
      const nowUnique = dedupeProductsById(flat).length;

      if (nowUnique - startUnique >= PAGE_SIZE) break;
      if (lastPage.length < PAGE_SIZE) break;
      if (!result.hasNextPage) break;
      if (nowUnique === prevUnique) break;

      prevUnique = nowUnique;
    }
  }, [query]);

  return {
    ...query,
    fetchNextPage: fetchNextPagePreferUnique,
    products,
    pageSize: PAGE_SIZE,
  };
}

/**
 * Một lần gọi `GET /recommendations/home` (offset=0) — dùng khi chỉ cần vài sản phẩm, ví dụ giỏ trống.
 */
export function useHomeRecommendationsSnapshot(limit: number) {
  const { user, isAuthenticated } = useAuth();
  const userId = isAuthenticated && user?.id != null ? user.id : undefined;
  const sessionId = useMemo(() => getOrCreateSessionId(), []);
  const enabled = limit > 0;

  return useQuery({
    queryKey: ['recommendations', 'home', 'snapshot', isAuthenticated ? userId : 'guest', sessionId, limit],
    queryFn: ({ signal }) =>
      recommendationService.getHome({
        ...(userId != null ? { userId } : {}),
        sessionId,
        offset: 0,
        limit,
        signal,
      }),
    select: (data): ProductFullResponse[] => dedupeProductsById(Array.isArray(data) ? data : []),
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    enabled,
  });
}
