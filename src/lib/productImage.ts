import type { ProductFullResponse } from '../api/types/product.types';

export function getProductImageUrl(product: ProductFullResponse): string | undefined {
  const candidates = [
    product.thumbnailUrl,
    product.mainImageUrl,
    product.imageUrl,
    product.coverImageUrl,
  ];

  for (const c of candidates) {
    if (typeof c === 'string' && c.trim() !== '') {
      return c.trim();
    }
  }

  return undefined;
}

/** Các URL ảnh khác nhau (dedupe) cho gallery PDP. */
export function getProductImageUrls(product: ProductFullResponse): string[] {
  const candidates = [
    product.mainImageUrl,
    product.thumbnailUrl,
    product.imageUrl,
    product.coverImageUrl,
  ];

  const seen = new Set<string>();
  const out: string[] = [];

  for (const c of candidates) {
    if (typeof c !== 'string') continue;
    const t = c.trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }

  return out;
}
