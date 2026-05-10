import { axiosInstance } from '../config/axiosConfig';
import { API_ENDPOINTS } from '../config/apiEndpoints';
import type { ProductFullResponse } from '../types/product.types';

export interface HomeRecommendationsParams {
  /** Đã đăng nhập: bắt buộc (> 0). Guest: không gửi (xem FRONTEND_GUEST_HOME_RECOMMENDATIONS.md). */
  userId?: number;
  sessionId?: string;
  offset?: number;
  limit?: number;
  signal?: AbortSignal;
}

export const recommendationService = {
  /**
   * Mảng thô `ProductFullResponse[]` (không `APIResponse`).
   * Guest: `GET .../home?sessionId=...` — không `userId`.
   * Đã login: `?userId=...&sessionId=...` — FRONTEND_COLLECTOR_AND_HOME_RECOMMENDATIONS.md.
   */
  async getHome(params: HomeRecommendationsParams): Promise<ProductFullResponse[]> {
    const { data } = await axiosInstance.get<ProductFullResponse[]>(API_ENDPOINTS.RECOMMENDATIONS.HOME, {
      params: {
        ...(params.userId != null && params.userId > 0 ? { userId: params.userId } : {}),
        ...(params.sessionId != null && params.sessionId !== '' ? { sessionId: params.sessionId } : {}),
        offset: params.offset ?? 0,
        limit: params.limit ?? 25,
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
