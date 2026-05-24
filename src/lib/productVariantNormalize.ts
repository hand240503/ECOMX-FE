import type { ProductPrice, ProductVariantResponse } from '../api/types/product.types';
import { coerceActivePriceChangeSnapshot } from './productPricingDisplay';

function asFiniteInt(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return Math.trunc(v);
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number.parseInt(v, 10);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function asFiniteNumber(v: unknown): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number.parseFloat(v.replace(',', '.'));
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

function coerceOptionValues(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const o = raw as Record<string, unknown>;
  const out: Record<string, string> = {};
  for (const [k, val] of Object.entries(o)) {
    if (val == null) continue;
    const s = String(val).trim();
    if (s !== '') out[k] = s;
  }
  return out;
}

/** Chuẩn hoá một dòng giá từ BE (camelCase hoặc snake_case). */
export function coerceProductPrice(raw: unknown): ProductPrice | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const id = asFiniteInt(o.id) ?? 0;
  const unitId = asFiniteInt(o.unitId ?? o.unit_id);
  if (unitId == null) return null;
  const unitNameRaw = o.unitName ?? o.unit_name;
  const unitName = typeof unitNameRaw === 'string' ? unitNameRaw : '';
  const unitRatioRaw = o.unitRatio ?? o.unit_ratio;
  const unitRatio =
    typeof unitRatioRaw === 'number' && Number.isFinite(unitRatioRaw)
      ? unitRatioRaw
      : typeof unitRatioRaw === 'string' && unitRatioRaw.trim() !== ''
        ? Number.parseFloat(unitRatioRaw)
        : 1;
  const currentValue = asFiniteNumber(o.currentValue ?? o.current_value);
  const oldRaw = o.oldValue ?? o.old_value;
  const oldValue =
    oldRaw == null
      ? null
      : typeof oldRaw === 'number' || (!Array.isArray(oldRaw) && typeof oldRaw !== 'object')
        ? asFiniteNumber(oldRaw)
        : null;
  const pvid = asFiniteInt(o.productVariantId ?? o.product_variant_id);

  const row: ProductPrice = {
    id,
    currentValue: Math.round(currentValue),
    oldValue: oldValue != null && oldValue > 0 ? Math.round(oldValue) : null,
    unitId,
    unitName,
    unitRatio: Number.isFinite(unitRatio) ? unitRatio : 1,
    ...(pvid != null && pvid > 0 ? { productVariantId: pvid } : {}),
  };
  return row;
}

/** Chuẩn hoá một biến thể SKU từ BE. */
export function coerceProductVariant(raw: unknown): ProductVariantResponse | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const id = asFiniteInt(o.id);
  if (id == null || id <= 0) return null;
  const skuRaw = o.skuCode ?? o.sku_code;
  const skuCode = skuRaw == null || skuRaw === '' ? null : String(skuRaw);
  const sortOrder = asFiniteInt(o.sortOrder ?? o.sort_order) ?? 0;
  const active = Boolean(o.active);
  const optionValues = coerceOptionValues(o.optionValues ?? o.option_values);
  const pricesRaw = o.prices;
  const prices = Array.isArray(pricesRaw)
    ? (pricesRaw.map(coerceProductPrice).filter((p): p is ProductPrice => p != null) as ProductPrice[])
    : null;

  const optStr = (x: unknown): string | null => {
    if (typeof x !== 'string') return null;
    const t = x.trim();
    return t !== '' ? t : null;
  };
  const mainImageUrl = optStr(o.mainImageUrl ?? o.main_image_url);
  const thumbnailUrl = optStr(o.thumbnailUrl ?? o.thumbnail_url);
  const imageUrl = optStr(o.imageUrl ?? o.image_url);
  const coverImageUrl = optStr(o.coverImageUrl ?? o.cover_image_url);
  const imageUrlsRaw = o.imageUrls ?? o.image_urls;
  const imageUrls = Array.isArray(imageUrlsRaw)
    ? imageUrlsRaw.filter((u): u is string => typeof u === 'string' && u.trim() !== '')
    : null;
  const documents = Array.isArray(o.documents) ? (o.documents as ProductVariantResponse['documents']) : undefined;

  const effRaw = o.effectiveUnitPrice ?? o.effective_unit_price;
  let effectiveUnitPrice: number | undefined;
  if (typeof effRaw === 'number' && Number.isFinite(effRaw)) effectiveUnitPrice = Math.round(effRaw);
  else if (typeof effRaw === 'string' && effRaw.trim() !== '') {
    const n = Number.parseFloat(effRaw.replace(',', '.'));
    if (Number.isFinite(n)) effectiveUnitPrice = Math.round(n);
  }

  const pcRaw = o.activePriceChange ?? o.active_price_change;
  const activePriceChange = coerceActivePriceChangeSnapshot(pcRaw);

  return {
    id,
    skuCode,
    optionValues,
    active,
    sortOrder,
    prices: prices && prices.length > 0 ? prices : null,
    ...(effectiveUnitPrice != null && effectiveUnitPrice > 0 ? { effectiveUnitPrice } : {}),
    ...(activePriceChange != null ? { activePriceChange } : {}),
    ...(mainImageUrl != null ? { mainImageUrl } : {}),
    ...(thumbnailUrl != null ? { thumbnailUrl } : {}),
    ...(imageUrl != null ? { imageUrl } : {}),
    ...(coverImageUrl != null ? { coverImageUrl } : {}),
    ...(imageUrls != null && imageUrls.length > 0 ? { imageUrls } : {}),
    ...(documents != null && documents.length > 0 ? { documents } : {}),
  };
}

export function normalizedVariantsFromProduct(product: {
  variants?: unknown[] | null;
}): ProductVariantResponse[] {
  const raw = product.variants;
  if (!Array.isArray(raw) || raw.length === 0) return [];
  return raw.map(coerceProductVariant).filter((v): v is ProductVariantResponse => v != null);
}

export function pickDefaultVariant(variants: ProductVariantResponse[]): ProductVariantResponse | null {
  if (!variants.length) return null;
  const active = variants.filter((v) => v.active).sort((a, b) => a.sortOrder - b.sortOrder);
  if (active.length > 0) return active[0]!;
  return [...variants].sort((a, b) => a.sortOrder - b.sortOrder)[0] ?? null;
}
