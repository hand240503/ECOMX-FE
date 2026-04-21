import { useQuery } from '@tanstack/react-query';
import { categoryService } from '../api/services/categoryService';

/** Bước 3 luồng `docs/home-category-product-list-flow.md` — `GET /categories/parent/{parentId}/children`. */
export function useCategoryChildren(parentId: number | undefined) {
  return useQuery({
    queryKey: ['categories', 'children', parentId],
    queryFn: () => categoryService.getChildren(parentId!),
    enabled: typeof parentId === 'number' && parentId > 0,
  });
}
