import { useQuery } from '@tanstack/react-query';
import { ratingService } from '../api/services/ratingService';

/** Toàn bộ đánh giá của user hiện tại — dùng để biết sản phẩm nào đã đánh giá. */
export function useUserRatings(userId: number | undefined) {
  const id = typeof userId === 'number' && userId > 0 ? userId : undefined;
  return useQuery({
    queryKey: ['user-ratings', 'by-user', id] as const,
    queryFn: ({ signal }) => ratingService.getByUser(id!, { signal }),
    enabled: id != null,
    staleTime: 60 * 1000,
  });
}
