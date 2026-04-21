import type { ProductFullResponse, ProductPrice } from '../types/product.types';
import { formatPrice, formatShortCount } from '../../lib/formatPrice';

export interface ProductDetailPriceRow {
  id: number;
  unitId: number;
  unitName: string;
  currentValue: number;
  oldValue: number | null;
  /** Chỉ khi `oldValue > currentValue > 0` — tính trong mapper (PAGE_product_detail.md §7). */
  discountPercent: number | null;
  formattedCurrent: string;
  formattedOld: string | null;
}

export interface ProductDetailModel {
  id: number;
  productName: string;
  descriptionHtml: string | null;
  inStock: boolean;
  isFeatured: boolean;
  soldCountLabel: string;
  tag: string | null;
  brand: ProductFullResponse['brand'];
  category: ProductFullResponse['category'];
  prices: ProductDetailPriceRow[];
  averageRating: number | null;
  ratingCount: number;
}

function mapPriceRow(p: ProductPrice): ProductDetailPriceRow {
  const current = Math.round(Number.isFinite(p.currentValue) ? p.currentValue : 0);
  const oldRaw = p.oldValue;
  const old =
    oldRaw != null && Number.isFinite(oldRaw) && oldRaw > 0 ? Math.round(oldRaw) : null;
  const discountPercent =
    old != null && current > 0 && old > current
      ? Math.round((1 - current / old) * 100)
      : null;

  return {
    id: p.id,
    unitId: p.unitId,
    unitName: p.unitName,
    currentValue: current,
    oldValue: old,
    discountPercent,
    formattedCurrent: formatPrice(current),
    formattedOld: old != null && old > current ? formatPrice(old) : null,
  };
}

/** `status === 1` → còn hàng (PAGE_product_detail.md §7). */
export function mapProductFullToDetailModel(product: ProductFullResponse): ProductDetailModel {
  const rawPrices = product.prices;
  const prices = Array.isArray(rawPrices) ? rawPrices.map(mapPriceRow) : [];

  const sold = Number(product.soldCount ?? 0);

  return {
    id: product.id,
    productName: product.productName ?? '',
    descriptionHtml:
      typeof product.description === 'string' && product.description.trim() !== ''
        ? product.description
        : null,
    inStock: product.status === 1,
    isFeatured: Boolean(product.isFeatured),
    soldCountLabel: formatShortCount(sold),
    tag: typeof product.tag === 'string' && product.tag.trim() !== '' ? product.tag.trim() : null,
    brand: product.brand,
    category: product.category,
    prices,
    averageRating: product.averageRating ?? null,
    ratingCount: Number(product.ratingCount ?? 0),
  };
}
