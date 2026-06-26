import { axiosInstance } from '../config/axiosConfig';
import { API_ENDPOINTS } from '../config/apiEndpoints';
import type { ApiResponse } from '../types/common.types';
import type { StoreResponse } from '../types/store.types';

/** Kho công khai (web khách) — `/{api.prefix}/stores`. */
export const storeService = {
  /** Danh sách kho đang hoạt động. */
  async listActive(options?: { signal?: AbortSignal }): Promise<StoreResponse[]> {
    const { data } = await axiosInstance.get<ApiResponse<StoreResponse[]>>(
      API_ENDPOINTS.STORES.LIST,
      { signal: options?.signal }
    );
    if (!data.success || !Array.isArray(data.data)) return [];
    return data.data;
  },

  /** Kho mặc định (isDefault) — fallback kho hoạt động đầu tiên. Null nếu chưa có kho. */
  async getDefault(options?: { signal?: AbortSignal }): Promise<StoreResponse | null> {
    const list = await storeService.listActive(options);
    if (list.length === 0) return null;
    return list.find((s) => s.isDefault) ?? list[0];
  },

  /**
   * Kho đang hoạt động mà CÓ ĐỦ tồn cho tất cả sản phẩm yêu cầu.
   * Truyền variantIds và/hoặc productIds. Rỗng → trả tất cả kho hoạt động.
   */
  async listStocking(
    params: { variantIds?: number[]; productIds?: number[] },
    options?: { signal?: AbortSignal }
  ): Promise<StoreResponse[]> {
    const query: Record<string, string> = {};
    if (params.variantIds && params.variantIds.length > 0) query.variantIds = params.variantIds.join(',');
    if (params.productIds && params.productIds.length > 0) query.productIds = params.productIds.join(',');
    const { data } = await axiosInstance.get<ApiResponse<StoreResponse[]>>(
      API_ENDPOINTS.STORES.STOCKING,
      { params: query, signal: options?.signal }
    );
    if (!data.success || !Array.isArray(data.data)) return [];
    return data.data;
  },
};
