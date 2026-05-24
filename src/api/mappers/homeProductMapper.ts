import type { ProductFullResponse, ProductVariantResponse } from '../types/product.types';
import { DEFAULT_PRODUCT_IMAGE } from '../../constants/defaultImages';
import { isProductFreeship } from '../../lib/categoryProductUtils';
import { getProductImageUrl } from '../../lib/productImage';
import {
  extractFromEffectiveUnitPrice,
  extractPurchaseWithPurchasePrograms,
  extractVolumePriceTiers,
  productHasAnyVariantPcSale,
} from '../../lib/productPricingDisplay';
import { normalizedVariantsFromProduct } from '../../lib/productVariantNormalize';

export interface HomeProductCardModel {
  id: number;
  name: string;
  /** Tên thương hiệu — `ProductCard` / promo row */
  brand: string | null;
  image: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  /** `true` khi có >1 SKU — nhãn “Từ …” trên card. */
  priceIsFrom?: boolean;
  rating: number;
  soldCount: number;
  location: string;
  isFreeship: boolean;
  /** Đa SKU + có SKU đang Price Change giảm giá — badge marketing. */
  showPcSaleBadge?: boolean;
  /** Có `volume_price_tiers` enabled — gợi ý “mua nhiều”. */
  volumeTierHint?: boolean;
  /** Có chương trình PWP snapshot trên response. */
  pwpHint?: boolean;
}

function pickLowestCurrentPriceRow(product: ProductFullResponse) {
  const rows = product.prices;
  if (!rows?.length) return undefined;
  return rows.reduce((best, p) => (p.currentValue < best.currentValue ? p : best));
}

function minEffectiveAmongActiveVariants(variants: ProductVariantResponse[]): number | undefined {
  const vals = variants
    .filter((v) => v.active)
    .map((v) => v.effectiveUnitPrice)
    .filter((n): n is number => typeof n === 'number' && Number.isFinite(n) && n > 0);
  if (!vals.length) return undefined;
  return Math.min(...vals);
}

export function mapProductFullToCard(product: ProductFullResponse): HomeProductCardModel {
  const variants = normalizedVariantsFromProduct(product);
  const fromEff = extractFromEffectiveUnitPrice(product);
  const catalogRow = pickLowestCurrentPriceRow(product);
  const minEff = minEffectiveAmongActiveVariants(variants);
  const multi = variants.length > 1;
  const single = variants.length === 1 ? variants[0] : undefined;

  let current = 0;
  let originalPrice: number | undefined;
  let discountPercent: number | undefined;

  if (multi) {
    current = fromEff ?? minEff ?? catalogRow?.currentValue ?? 0;
  } else if (single) {
    const pc = single.activePriceChange;
    if (pc != null && pc.basePrice > pc.salePrice) {
      current = pc.salePrice;
      originalPrice = pc.basePrice;
      discountPercent = Math.round((1 - pc.salePrice / pc.basePrice) * 100);
    } else {
      const eff =
        typeof single.effectiveUnitPrice === 'number' && single.effectiveUnitPrice > 0
          ? single.effectiveUnitPrice
          : undefined;
      current = eff ?? fromEff ?? catalogRow?.currentValue ?? 0;
      const old = catalogRow?.oldValue;
      if (old != null && old > current) {
        originalPrice = old;
        discountPercent = Math.round((1 - current / old) * 100);
      }
    }
  } else {
    current = fromEff ?? catalogRow?.currentValue ?? 0;
    const old = catalogRow?.oldValue;
    if (old != null && old > current) {
      originalPrice = old;
      discountPercent = Math.round((1 - current / old) * 100);
    }
  }

  const tiers = extractVolumePriceTiers(product);
  const pwps = extractPurchaseWithPurchasePrograms(product);

  const brandName = product.brand?.name?.trim() ?? null;

  return {
    id: product.id,
    name: product.productName,
    brand: brandName && brandName.length > 0 ? brandName : null,
    image: getProductImageUrl(product) ?? DEFAULT_PRODUCT_IMAGE,
    price: current,
    originalPrice,
    discountPercent: discountPercent != null && discountPercent > 0 ? discountPercent : undefined,
    priceIsFrom: multi ? true : undefined,
    rating: product.averageRating ?? 0,
    soldCount: Number(product.soldCount ?? 0),
    location: product.category?.name ?? '—',
    isFreeship: isProductFreeship(product),
    showPcSaleBadge: multi && productHasAnyVariantPcSale(product) ? true : undefined,
    volumeTierHint: tiers.length > 0 ? true : undefined,
    pwpHint: pwps.length > 0 ? true : undefined,
  };
}
