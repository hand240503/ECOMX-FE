import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { commentService } from '../api/services/commentService';

export function useProductComments(productId: number | null) {
  const enabled = productId != null && productId > 0;

  const commentsQuery = useQuery({
    queryKey: ['product-comments', productId],
    queryFn: ({ signal }) => commentService.getByProduct(productId!, signal),
    enabled,
    staleTime: 60 * 1000,
  });

  const ratingsQuery = useQuery({
    queryKey: ['product-ratings', productId],
    queryFn: ({ signal }) => commentService.getRatingsByProduct(productId!, signal),
    enabled,
    staleTime: 60 * 1000,
  });

  return {
    comments: commentsQuery.data ?? [],
    commentsLoading: commentsQuery.isPending,
    commentsError: commentsQuery.isError,

    ratings: ratingsQuery.data?.ratings ?? [],
    avgRating: ratingsQuery.data?.avg ?? 0,
    totalRatings: ratingsQuery.data?.total ?? 0,
    ratingsLoading: ratingsQuery.isPending,
  };
}

export function useCreateComment(productId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) => commentService.create(productId, content),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['product-comments', productId] });
    },
  });
}

export function useDeleteComment(productId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: number) => commentService.deleteOwn(commentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['product-comments', productId] });
    },
  });
}
