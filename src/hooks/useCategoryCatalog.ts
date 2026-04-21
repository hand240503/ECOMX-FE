import { useQuery } from '@tanstack/react-query';
import { categoryService } from '../api/services/categoryService';
import { flattenCategories } from '../lib/categoryCatalog';

/** Bước 2 luồng `docs/home-category-product-list-flow.md` — `GET /categories`, flatten để map `code` → `id`. */
export function useCategoryCatalog() {
  return useQuery({
    queryKey: ['categories', 'all-flat'],
    queryFn: async () => {
      const tree = await categoryService.getAll();
      return flattenCategories(tree);
    },
  });
}
