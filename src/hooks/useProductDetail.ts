import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { productService, ProductNotFoundError } from '../api/services/productService';
import { mapProductFullToDetailModel } from '../api/mappers/productDetailMapper';
import { useAuth } from '../app/auth/AuthProvider';
import { ANONYMOUS_USER_ID } from '../constants/recommendation';
import { getOrCreateSessionId } from '../lib/sessionId';

const REC_LIMIT = 10;

export function useProductDetail(productId: string | undefined) {
  const { user } = useAuth();
  const userId = user?.id ?? ANONYMOUS_USER_ID;
  const sessionId = useMemo(() => getOrCreateSessionId(), []);

  const idNum = productId != null && /^\d+$/.test(productId.trim()) ? Number(productId) : NaN;
  const enabled = Number.isFinite(idNum) && idNum > 0;

  const query = useQuery({
    queryKey: ['product', 'detail', idNum, userId, sessionId],
    queryFn: ({ signal }) =>
      productService.getDetail({
        id: idNum,
        userId,
        sessionId,
        recommendationLimit: REC_LIMIT,
        signal,
      }),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled,
  });

  const detailModel = query.data?.product ? mapProductFullToDetailModel(query.data.product) : null;

  const isNotFound = query.error instanceof ProductNotFoundError;

  return {
    ...query,
    detailModel,
    recommendations: query.data?.recommendations ?? [],
    isNotFound,
  };
}
