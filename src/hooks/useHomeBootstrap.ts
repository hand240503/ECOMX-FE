import { useAuth } from '../app/auth/AuthProvider';
import { useHomeRecommendations } from './useHomeRecommendations';

/**
 * Trang chủ: chờ auth xong và trang gợi ý đầu tiên.
 */
export function useHomeBootstrap() {
  const { isLoading: authLoading } = useAuth();
  const recommendations = useHomeRecommendations();

  const isBootstrapping = authLoading || recommendations.isLoading;

  return { isBootstrapping };
}
