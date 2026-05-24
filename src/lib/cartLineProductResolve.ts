import type { ProductFullResponse, ProductPrice } from '../api/types/product.types';
import type { CartLine } from './cartStorage';
import { normalizedVariantsFromProduct } from './productVariantNormalize';

function pricesForCartLine(
  p: ProductFullResponse | undefined,
  line: Pick<CartLine, 'productVariantId'>
): ProductPrice[] | null {
  if (!p) return null;
  const vid = line.productVariantId;
  if (vid != null && vid > 0) {
    const vars = normalizedVariantsFromProduct(p);
    const v = vars.find((x) => x.id === vid);
    if (v?.prices?.length) return v.prices;
  }
  return p.prices ?? null;
}

export function productPriceForUnit(
  p: ProductFullResponse | undefined,
  unitId: number,
  line?: Pick<CartLine, 'productVariantId'>
): ProductPrice | null {
  const list = line ? pricesForCartLine(p, line) : p?.prices ?? null;
  if (!list?.length) return null;
  return list.find((row) => row.unitId === unitId) ?? null;
}

export function currentUnitPrice(
  p: ProductFullResponse | undefined,
  unitId: number,
  line?: Pick<CartLine, 'productVariantId'>
): number {
  const row = productPriceForUnit(p, unitId, line);
  return row ? row.currentValue : 0;
}

export function currentUnitName(
  p: ProductFullResponse | undefined,
  unitId: number,
  line?: Pick<CartLine, 'productVariantId'>
): string {
  const row = productPriceForUnit(p, unitId, line);
  return row?.unitName?.trim() ? row.unitName.trim() : '—';
}

export function cartLineVariantSummary(
  p: ProductFullResponse | undefined,
  line: Pick<CartLine, 'productVariantId'>
): string | null {
  const vid = line.productVariantId;
  if (!p || vid == null || vid <= 0) return null;
  const v = normalizedVariantsFromProduct(p).find((x) => x.id === vid);
  if (!v?.optionValues || Object.keys(v.optionValues).length === 0) return null;
  return Object.entries(v.optionValues)
    .map(([k, val]) => `${k}: ${val}`)
    .join(' · ');
}
