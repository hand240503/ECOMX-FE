import type { ProductFullResponse } from '../api/types/product.types';

export type ProductSortMode = 'popular' | 'newest' | 'price_asc' | 'price_desc' | 'rating';

/** Trang tìm kiếm: thêm `relevant` (mặc định, giữ thứ tự API). */
export type SearchSortMode = 'relevant' | ProductSortMode;

export function getPrimaryPrice(product: ProductFullResponse): number {
  return product.prices?.[0]?.currentValue ?? 0;
}

export function isProductFreeship(product: ProductFullResponse): boolean {
  const t = (product.tag ?? '').toLowerCase();
  return t.includes('freeship') || t.includes('free ship');
}

export function parseProductTagTokens(tag: string | null | undefined): string[] {
  if (!tag?.trim()) return [];
  return tag
    .split(/[,;|]/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isProductInStock(product: ProductFullResponse): boolean {
  return product.status !== 0;
}

export interface ClientProductFilters {
  minPrice: number | null;
  maxPrice: number | null;
  brandIds: number[];
  minRating: number | null;
  inStock: boolean;
  freeship: boolean;
  tagCodes: string[];
}

export function applyClientFilters(
  products: ProductFullResponse[],
  f: ClientProductFilters
): ProductFullResponse[] {
  return products.filter((p) => {
    const price = getPrimaryPrice(p);
    if (f.minPrice != null && price < f.minPrice) return false;
    if (f.maxPrice != null && price > f.maxPrice) return false;
    if (f.brandIds.length && (!p.brand || !f.brandIds.includes(p.brand.id))) return false;
    if (f.minRating != null && (p.averageRating ?? 0) < f.minRating) return false;
    if (f.inStock && !isProductInStock(p)) return false;
    if (f.freeship && !isProductFreeship(p)) return false;
    if (f.tagCodes.length) {
      const toks = parseProductTagTokens(p.tag);
      if (!f.tagCodes.some((c) => toks.includes(c))) return false;
    }
    return true;
  });
}

export function sortProductsByMode(
  products: ProductFullResponse[],
  sort: SearchSortMode
): ProductFullResponse[] {
  const arr = [...products];
  switch (sort) {
    case 'relevant':
      return arr;
    case 'newest':
      arr.sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
      break;
    case 'price_asc':
      arr.sort((a, b) => getPrimaryPrice(a) - getPrimaryPrice(b));
      break;
    case 'price_desc':
      arr.sort((a, b) => getPrimaryPrice(b) - getPrimaryPrice(a));
      break;
    case 'rating':
      arr.sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0));
      break;
    case 'popular':
    default:
      arr.sort((a, b) => Number(b.soldCount ?? 0) - Number(a.soldCount ?? 0));
      break;
  }
  return arr;
}

export function uniqueBrandsFromProducts(products: ProductFullResponse[]) {
  const map = new Map<number, { id: number; name: string }>();
  for (const p of products) {
    if (p.brand) map.set(p.brand.id, { id: p.brand.id, name: p.brand.name });
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'vi'));
}

export function uniqueTagsFromProducts(products: ProductFullResponse[]) {
  const set = new Set<string>();
  for (const p of products) {
    for (const t of parseProductTagTokens(p.tag)) {
      if (t) set.add(t);
    }
  }
  return [...set].sort();
}
