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

  /**
   * Mảng thô `ProductFullResponse[]` (không `APIResponse`) — tương tự theo 1 sản phẩm nguồn.
   * @see docs/API_recommendation_item_hybrid_FE.md
   */
  async getItemHybridSimilar(
    productId: number,
    options?: { limit?: number; signal?: AbortSignal }
  ): Promise<ProductFullResponse[]> {
    const { data } = await axiosInstance.get<ProductFullResponse[]>(
      API_ENDPOINTS.RECOMMENDATIONS.ITEM_HYBRID(productId),
      {
        params: { limit: options?.limit ?? 10 },
        signal: options?.signal,
      }
    );
    return Array.isArray(data) ? data : [];
  },
};
