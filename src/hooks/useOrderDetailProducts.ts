import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { CreatedOrderDetail, OrderDto } from '../api/types/order.types';
import { productService } from '../api/services/productService';
import type { ProductFullResponse } from '../api/types/product.types';
import { getProductImageUrl } from '../lib/productImage';
import { parseOrderDescriptionJson } from '../lib/orderDescriptionJson';

function readVariantOptionsFromLine(
  line: CreatedOrderDetail & { variant_options?: Record<string, string> | null }
): Record<string, string> | null {
  const m = line.variantOptions ?? line.variant_options;
  if (m && typeof m === 'object' && !Array.isArray(m)) return m;
  return null;
}

/** Nhãn biến thể ưu tiên `variantOptions` từ BE, sau đó mô tả JSON, cuối cùng SKU code. */
export function orderLineVariantCaption(line: CreatedOrderDetail): string {
  const opts = readVariantOptionsFromLine(
    line as CreatedOrderDetail & { variant_options?: Record<string, string> }
  );
  if (opts && Object.keys(opts).length > 0) {
    return Object.entries(opts)
      .map(([k, v]) => `${k}: ${String(v).trim()}`)
      .join(' · ');
  }
  const rawSku = line.variantSkuCode ?? (line as { variant_sku_code?: string }).variant_sku_code;
  if (typeof rawSku === 'string' && rawSku.trim() !== '') return rawSku.trim();
  const unit = parseOrderDescriptionJson(line.description ?? null)?.unit?.trim();
  if (unit) return unit;
  return '—';
}

/** Giữ thứ tự xuất hiện đầu tiên trong đơn (trùng `productId` chỉ gửi một lần). */
export function uniqueProductIdsFromOrderDetails(lines: CreatedOrderDetail[]): number[] {
  const seen = new Set<number>();
  const out: number[] = [];
  for (const l of lines) {
    if (seen.has(l.productId)) continue;
    seen.add(l.productId);
    out.push(l.productId);
  }
  return out;
}

/** Gom `productId` từ nhiều đơn (thứ tự: lần lượt từng đơn, mỗi id chỉ một lần). */
export function uniqueProductIdsFromOrders(orders: OrderDto[]): number[] {
  const seen = new Set<number>();
  const out: number[] = [];
  for (const o of orders) {
    for (const l of o.orderDetails ?? []) {
      if (seen.has(l.productId)) continue;
      seen.add(l.productId);
      out.push(l.productId);
    }
  }
  return out;
}

/**
 * Sau khi có đơn: `POST /products/by-ids` để bổ sung ảnh & tên catalog cho từng dòng.
 * @see docs/API_products_by_ids_FE.md
 */
export function useOrderDetailProducts(orderDetailId: number, lines: CreatedOrderDetail[] | undefined) {
  const productIds = useMemo(() => uniqueProductIdsFromOrderDetails(lines ?? []), [lines]);

  const idKey = useMemo(() => productIds.join(','), [productIds]);

  const query = useQuery({
    queryKey: ['products', 'by-ids', 'order-detail', orderDetailId, idKey] as const,
    queryFn: ({ signal }) => productService.getByIds(productIds, { signal }),
    enabled: productIds.length > 0 && Number.isFinite(orderDetailId) && orderDetailId > 0,
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

export function orderLineDisplayFromProduct(
  line: CreatedOrderDetail,
  byId: Map<number, ProductFullResponse>
): { productName: string; thumbnailUrl: string | null } {
  const p = byId.get(line.productId);
  if (!p) {
    return {
      productName: line.productName ?? `#${line.productId}`,
      thumbnailUrl: null,
    };
  }
  return {
    productName: p.productName || line.productName || `#${line.productId}`,
    thumbnailUrl: getProductImageUrl(p) ?? null,
  };
}
