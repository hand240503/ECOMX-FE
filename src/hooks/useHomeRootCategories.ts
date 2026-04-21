import { useQuery } from '@tanstack/react-query';
import { categoryService } from '../api/services/categoryService';
import { useAuth } from '../app/auth/AuthProvider';

/**
 * Home sidebar — bước 1 `docs/home-category-product-list-flow.md` (`GET /categories/roots`, JWT).
 * Chỉ gọi khi đã đăng nhập (policy FE; backend vẫn yêu cầu JWT cho mọi caller).
 */
export function useHomeRootCategories() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  return useQuery({
    queryKey: ['categories', 'roots'],
    queryFn: () => categoryService.getRootCategories(),
    enabled: isAuthenticated && !authLoading,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
