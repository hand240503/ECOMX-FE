import { useQuery } from '@tanstack/react-query';
import { productService } from '../api/services/productService';
import { CATEGORY_PRODUCTS_PAGE_SIZE } from './useProductListUrlState';

function normalizeCategoryId(categoryId: number | undefined): number | undefined {
  if (categoryId == null || typeof categoryId !== 'number') return undefined;
  if (!Number.isFinite(categoryId)) return undefined;
  const n = Math.trunc(categoryId);
  return n > 0 ? n : undefined;
}

function normalizePage(page: number): number {
  if (typeof page !== 'number' || !Number.isFinite(page) || page < 0) return 0;
  return Math.trunc(page);
}

/**
 * Bước 4 luồng `docs/home-category-product-list-flow.md` — `GET /products/category/{id}?page=&limit=`.
 * Phạm vi subtree (id + descendant): `docs/product-by-category.md`.
 * `staleTime: 0` + `refetchOnMount: 'always'` để luôn thấy request sau khi đổi danh mục (tránh nhầm với cache global 5 phút).
 */
export function useProductsByCategory(categoryId: number | undefined, page: number) {
  const id = normalizeCategoryId(categoryId);
  const safePage = normalizePage(page);

  return useQuery({
    queryKey: ['products', 'by-category', id, safePage, CATEGORY_PRODUCTS_PAGE_SIZE] as const,
    queryFn: ({ signal }) =>
      productService.getByCategory(id!, {
        page: safePage,
        limit: CATEGORY_PRODUCTS_PAGE_SIZE,
        signal,
      }),
    enabled: id != null,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}
