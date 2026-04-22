import { useAuth } from '../app/auth/AuthProvider';
import { useHomeRootCategories } from './useHomeRootCategories';
import { useHomeRecommendations } from './useHomeRecommendations';

/**
 * Trang chủ: chờ auth xong, danh mục gốc (khi đã đăng nhập), và trang gợi ý đầu tiên.
 */
export function useHomeBootstrap() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const categories = useHomeRootCategories();
  const recommendations = useHomeRecommendations();

  const waitingCategories = isAuthenticated && categories.isLoading;
  const waitingRecommendations = recommendations.isLoading;

  const isBootstrapping = authLoading || waitingCategories || waitingRecommendations;

  return { isBootstrapping };
}
