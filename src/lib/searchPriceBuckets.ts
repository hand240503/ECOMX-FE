import type { ProductFullResponse } from '../api/types/product.types';
import { getPrimaryPrice } from './categoryProductUtils';

export type SearchPriceBucketId =
  | 'lt_1m'
  | '1m_5m'
  | '5m_10m'
  | '10m_20m'
  | '20m_40m'
  | 'gt_40m';

export type SearchPriceBucket = {
  id: SearchPriceBucketId;
  /** i18n key — `search_price_bucket_*` */
  labelKey: string;
  min: number | null;
  max: number | null;
};

/**
 * Khoảng giá cố định trên trang tìm kiếm (VND; khớp `applyClientFilters` min/max đóng).
 * "Trên 40 triệu": giá > 40.000.000 (min = 40_000_001).
 */
export const SEARCH_PRICE_BUCKETS: readonly SearchPriceBucket[] = [
  { id: 'lt_1m', labelKey: 'search_price_bucket_lt_1m', min: null, max: 999_999 },
  { id: '1m_5m', labelKey: 'search_price_bucket_1m_5m', min: 1_000_000, max: 5_000_000 },
  { id: '5m_10m', labelKey: 'search_price_bucket_5m_10m', min: 5_000_000, max: 10_000_000 },
  { id: '10m_20m', labelKey: 'search_price_bucket_10m_20m', min: 10_000_000, max: 20_000_000 },
  { id: '20m_40m', labelKey: 'search_price_bucket_20m_40m', min: 20_000_000, max: 40_000_000 },
  { id: 'gt_40m', labelKey: 'search_price_bucket_gt_40m', min: 40_000_001, max: null },
] as const;

export function productMatchesSearchPriceBucket(
  product: ProductFullResponse,
  bucket: SearchPriceBucket
): boolean {
  const price = getPrimaryPrice(product);
  if (!Number.isFinite(price)) return false;
  if (bucket.min != null && price < bucket.min) return false;
  if (bucket.max != null && price > bucket.max) return false;
  return true;
}

export function findSearchPriceBucketForFilters(
  minPrice: number | null,
  maxPrice: number | null
): SearchPriceBucket | null {
  for (const b of SEARCH_PRICE_BUCKETS) {
    if (b.min === minPrice && b.max === maxPrice) return b;
  }
  return null;
}
