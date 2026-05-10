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
  /** PDP — nội dung chi tiết: ưu tiên `l_description` / `lDescription`, không thì `description`. */
  descriptionHtml: string | null;
  /** Mô tả ngắn (chỉ khi có mô tả dài và nội dung khác mô tả dài). */
  shortDescriptionHtml: string | null;
  /** `true` khi khối chi tiết đang hiển thị từ trường mô tả dài. */
  detailFromLongDescription: boolean;
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

function trimmedNonEmpty(s: string | null | undefined): string | null {
  if (typeof s !== 'string') return null;
  const t = s.trim();
  return t !== '' ? t : null;
}

/** `l_description` (snake) hoặc `lDescription` (camelCase) khi có. */
function pickLongDescriptionHtml(product: ProductFullResponse): string | null {
  return trimmedNonEmpty(product.l_description) ?? trimmedNonEmpty(product.lDescription);
}

function normalizeDetailFields(product: ProductFullResponse): {
  descriptionHtml: string | null;
  shortDescriptionHtml: string | null;
  detailFromLongDescription: boolean;
} {
  const longHtml = pickLongDescriptionHtml(product);
  const shortHtml = trimmedNonEmpty(product.description);

  if (longHtml != null) {
    const shortDistinct =
      shortHtml != null && shortHtml.trim() !== longHtml.trim() ? shortHtml : null;
    return {
      descriptionHtml: longHtml,
      shortDescriptionHtml: shortDistinct,
      detailFromLongDescription: true,
    };
  }
  if (shortHtml != null) {
    return {
      descriptionHtml: shortHtml,
      shortDescriptionHtml: null,
      detailFromLongDescription: false,
    };
  }
  return {
    descriptionHtml: null,
    shortDescriptionHtml: null,
    detailFromLongDescription: false,
  };
}

/** `status === 1` → còn hàng (PAGE_product_detail.md §7). */
export function mapProductFullToDetailModel(product: ProductFullResponse): ProductDetailModel {
  const rawPrices = product.prices;
  const prices = Array.isArray(rawPrices) ? rawPrices.map(mapPriceRow) : [];

  const sold = Number(product.soldCount ?? 0);

  const { descriptionHtml, shortDescriptionHtml, detailFromLongDescription } =
    normalizeDetailFields(product);

  return {
    id: product.id,
    productName: product.productName ?? '',
    descriptionHtml,
    shortDescriptionHtml,
    detailFromLongDescription,
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
