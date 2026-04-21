import type { ProductFullResponse } from '../types/product.types';
import { DEFAULT_PRODUCT_IMAGE } from '../../constants/defaultImages';
import { isProductFreeship } from '../../lib/categoryProductUtils';
import { getProductImageUrl } from '../../lib/productImage';

export interface HomeProductCardModel {
  id: number;
  name: string;
  image: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  rating: number;
  soldCount: number;
  location: string;
  isFreeship: boolean;
}

export function mapProductFullToCard(product: ProductFullResponse): HomeProductCardModel {
  const priceRow = product.prices?.[0];
  const current = priceRow?.currentValue ?? 0;
  const old = priceRow?.oldValue;
  const discount =
    old != null && old > current ? Math.round((1 - current / old) * 100) : undefined;

  return {
    id: product.id,
    name: product.productName,
    image: getProductImageUrl(product) ?? DEFAULT_PRODUCT_IMAGE,
    price: current,
    originalPrice: old != null && old > current ? old : undefined,
    discountPercent: discount != null && discount > 0 ? discount : undefined,
    rating: product.averageRating ?? 0,
    soldCount: Number(product.soldCount ?? 0),
    location: product.category?.name ?? '—',
    isFreeship: isProductFreeship(product),
  };
}
