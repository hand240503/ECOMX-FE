import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { productService } from '../api/services/productService';
import type { ProductFullResponse } from '../api/types/product.types';
import type { CartLine } from '../lib/cartStorage';
import { getProductImageUrl } from '../lib/productImage';

/** Thứ tự id trùng thứ tự xuất hiện trong `lines` (trùng `productId` một lần). */
function uniqueProductIdsInCartOrder(lines: CartLine[]): number[] {
  const seen = new Set<number>();
  const out: number[] = [];
  for (const l of lines) {
    if (seen.has(l.productId)) continue;
    seen.add(l.productId);
    out.push(l.productId);
  }
  return out;
}

/**
 * `POST /products/by-ids` **chỉ** với `productId` đang lưu trong `ecomx_cart` (các dòng giỏ).
 * Dùng bổ sung tên/ảnh catalog; giá & đơn vị bán vẫn theo snapshot trong `CartLine`.
 */
export function useEcomxCartProductDetails(lines: CartLine[]) {
  const productIds = useMemo(() => uniqueProductIdsInCartOrder(lines), [lines]);
  const idKey = useMemo(() => productIds.join(','), [productIds]);

  const query = useQuery({
    queryKey: ['products', 'by-ids', 'ecomx_cart', idKey],
    queryFn: ({ signal }) => productService.getByIds(productIds, { signal }),
    enabled: productIds.length > 0,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const byId = useMemo(() => {
    const m = new Map<number, ProductFullResponse>();
    for (const p of query.data ?? []) m.set(p.id, p);
    return m;
  }, [query.data]);

  return { ...query, byId, productIds };
}

export function cartLineDisplayFromByIds(
  line: CartLine,
  byId: Map<number, ProductFullResponse>
): { productName: string; thumbnailUrl: string | null } {
  const p = byId.get(line.productId);
  if (!p) {
    return { productName: line.productName, thumbnailUrl: line.thumbnailUrl };
  }
  return {
    productName: p.productName,
    thumbnailUrl: getProductImageUrl(p) ?? line.thumbnailUrl,
  };
}
