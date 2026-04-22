import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { recommendationService } from '../api/services/recommendationService';
import { useAuth } from '../app/auth/AuthProvider';
import { ANONYMOUS_USER_ID } from '../constants/recommendation';
import { getOrCreateSessionId } from '../lib/sessionId';
import type { ProductFullResponse } from '../api/types/product.types';

/** Số tối đa sản phẩm mẫu lấy từ giỏ (mỗi mẫu 1 lần gọi item-hybrid). */
const MAX_SEED_PRODUCTS = 5;
/** Số ứng viên tối đa từ mỗi sản phẩm mẫu. */
const LIMIT_PER_SEED = 10;
/** Số sản phẩm tối đa hiển thị sau khi gộp. */
const MERGED_LIMIT = 20;
const HOME_LIMIT = 20;

function uniqueSeedsInOrder(productIds: number[]): number[] {
  const seen = new Set<number>();
  const out: number[] = [];
  for (const id of productIds) {
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
    if (out.length >= MAX_SEED_PRODUCTS) break;
  }
  return out;
}

/**
 * Gộp nhiều mảng gợi ý, loại sản phẩm đang có trong giỏ, giữ score cao nhất theo từng `id`.
 */
function mergeItemHybridBatches(
  cartProductIds: number[],
  batches: ProductFullResponse[][]
): ProductFullResponse[] {
  const inCart = new Set(cartProductIds);
  const best = new Map<number, ProductFullResponse>();
  for (const batch of batches) {
    for (const p of batch) {
      if (inCart.has(p.id)) continue;
      const cur = best.get(p.id);
      const s = p.recommendationScore ?? 0;
      if (!cur || (cur.recommendationScore ?? 0) < s) {
        best.set(p.id, p);
      }
    }
  }
  return [...best.values()]
    .sort((a, b) => (b.recommendationScore ?? 0) - (a.recommendationScore ?? 0))
    .slice(0, MERGED_LIMIT);
}

export type CartRecommendationsSource = 'hybrid' | 'home';

export function useCartRecommendationsWithHomeFallback(cartProductIds: number[]) {
  const { user } = useAuth();
  const userId = user?.id ?? ANONYMOUS_USER_ID;
  const sessionId = useMemo(() => getOrCreateSessionId(), []);

  const idKey = useMemo(
    () => [...new Set(cartProductIds)].sort((a, b) => a - b).join(','),
    [cartProductIds]
  );

  return useQuery({
    queryKey: ['recommendations', 'cart', 'item-hybrid', userId, sessionId, idKey],
    queryFn: async ({ signal }): Promise<{ source: CartRecommendationsSource; products: ProductFullResponse[] }> => {
      if (cartProductIds.length === 0) {
        return { source: 'home', products: [] };
      }
      const seeds = uniqueSeedsInOrder(cartProductIds);
      const batches = await Promise.all(
        seeds.map((id) => recommendationService.getItemHybridSimilar(id, { limit: LIMIT_PER_SEED, signal }))
      );
      const merged = mergeItemHybridBatches(cartProductIds, batches);
      if (merged.length > 0) {
        return { source: 'hybrid', products: merged };
      }
      const home = await recommendationService.getHome({
        userId,
        sessionId,
        offset: 0,
        limit: HOME_LIMIT,
        signal
      });
      return { source: 'home', products: home };
    },
    enabled: cartProductIds.length > 0,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  });
}
