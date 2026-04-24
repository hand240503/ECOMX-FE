import { getProductsByIds } from '../api/services/productService';
import type { OrderDto } from '../api/types/order.types';
import type { ProductFullResponse } from '../api/types/product.types';
import type { CartLineInput } from './cartStorage';
import { getProductImageUrl } from './productImage';

function pickUnitForLine(
  product: ProductFullResponse,
  detail: { unitPrice?: number; unitId?: number }
): { unitId: number; unitName: string; unitPrice: number } {
  const prices = product.prices ?? [];
  if (detail.unitId != null) {
    const pr = prices.find((p) => p.unitId === detail.unitId);
    if (pr) {
      return { unitId: pr.unitId, unitName: pr.unitName, unitPrice: pr.currentValue };
    }
  }
  if (detail.unitPrice != null && Number.isFinite(detail.unitPrice)) {
    const unitPrice = detail.unitPrice;
    const pr =
      prices.find((p) => Math.abs(p.currentValue - unitPrice) < 0.5) ?? prices[0];
    if (pr) return { unitId: pr.unitId, unitName: pr.unitName, unitPrice: pr.currentValue };
  }
  const pr = prices[0];
  if (!pr) {
    throw new Error('Product has no price');
  }
  return { unitId: pr.unitId, unitName: pr.unitName, unitPrice: pr.currentValue };
}

/** Dựng dòng giỏ từ `orderDetails` + catalog (ảnh, đơn vị, giá hiện tại). */
export async function cartLineInputsFromOrderDto(
  order: OrderDto,
  options?: { signal?: AbortSignal }
): Promise<CartLineInput[]> {
  const details = order.orderDetails ?? [];
  if (!details.length) return [];
  const ids = [...new Set(details.map((d) => d.productId))];
  const products = await getProductsByIds(ids, { signal: options?.signal });
  const byId = new Map(products.map((p) => [p.id, p]));
  const out: CartLineInput[] = [];
  for (const d of details) {
    const p = byId.get(d.productId);
    if (!p) continue;
    try {
      const { unitId, unitName, unitPrice } = pickUnitForLine(p, {
        unitPrice: d.unitPrice,
        unitId: d.unitId,
      });
      out.push({
        productId: d.productId,
        productName: (d.productName?.trim() || p.productName).trim(),
        thumbnailUrl: getProductImageUrl(p) ?? null,
        unitId,
        unitName,
        unitPrice,
        quantity: d.quantity,
      });
    } catch {
      /* bỏ dòng không gán được giá */
    }
  }
  return out;
}
