import { useQuery } from '@tanstack/react-query';
import { productService } from '../api/services/productService';

function normalizeCategoryId(categoryId: number | undefined): number | undefined {
  if (categoryId == null || typeof categoryId !== 'number') return undefined;
  if (!Number.isFinite(categoryId)) return undefined;
  const n = Math.trunc(categoryId);
  return n > 0 ? n : undefined;
}

/**
 * `GET /products/category/{id}/brands` — toàn bộ brand có SP trong category.
 * Dùng cho sidebar filter (không phụ thuộc trang sản phẩm hiện tại).
 */
export function useCategoryBrands(categoryId: number | undefined) {
  const id = normalizeCategoryId(categoryId);

  return useQuery({
    queryKey: ['products', 'category-brands', id] as const,
    queryFn: ({ signal }) => productService.getCategoryBrands(id!, { signal }),
    enabled: id != null,
    staleTime: 5 * 60 * 1000,
  });
}
