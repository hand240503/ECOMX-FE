import { axiosInstance } from '../config/axiosConfig';
import { API_ENDPOINTS } from '../config/apiEndpoints';
import type { ProductFullResponse } from '../types/product.types';

export interface HomeRecommendationsParams {
  userId: number;
  sessionId?: string;
  offset?: number;
  limit?: number;
  signal?: AbortSignal;
}

export const recommendationService = {
  /**
   * Mảng thô `ProductFullResponse[]` (không `APIResponse`) — docs/api_search.md §4, api_home.md.
   */
  async getHome(params: HomeRecommendationsParams): Promise<ProductFullResponse[]> {
    const { data } = await axiosInstance.get<ProductFullResponse[]>(API_ENDPOINTS.RECOMMENDATIONS.HOME, {
      params: {
        userId: params.userId,
        sessionId: params.sessionId,
        offset: params.offset ?? 0,
        limit: params.limit ?? 20,
      },
      signal: params.signal,
    });
    return Array.isArray(data) ? data : [];
  },
};
