import { axiosInstance } from '../config/axiosConfig';
import { API_ENDPOINTS } from '../config/apiEndpoints';
import type { ApiResponse } from '../types/common.types';

export interface ProductComment {
  id: number;
  userId: number;
  username: string | null;
  userFullName: string | null;
  productId: number;
  productName: string | null;
  content: string;
  isHidden: boolean;
  createdDate: string;
  modifiedDate: string | null;
}

export interface ProductRating {
  id: number;
  userId: number;
  username: string | null;
  productId: number;
  rating: number;
  comment: string | null;
  createdDate: string;
}

export interface RatingsMetadata {
  count: number;
  averageRating: number;
  totalRatings: number;
}

export const commentService = {
  /** Lấy toàn bộ comment hiển thị của sản phẩm (public). */
  getByProduct: async (productId: number, signal?: AbortSignal): Promise<ProductComment[]> => {
    const res = await axiosInstance.get<ApiResponse<ProductComment[]>>(
      API_ENDPOINTS.PRODUCT_COMMENTS.BY_PRODUCT(productId),
      { signal }
    );
    return res.data.data ?? [];
  },

  /** Lấy danh sách rating + metadata avg của sản phẩm (public). */
  getRatingsByProduct: async (
    productId: number,
    signal?: AbortSignal
  ): Promise<{ ratings: ProductRating[]; avg: number; total: number }> => {
    const res = await axiosInstance.get<ApiResponse<ProductRating[]> & { metadata?: RatingsMetadata }>(
      API_ENDPOINTS.USER_RATINGS_BY_PRODUCT(productId),
      { signal }
    );
    const meta = (res.data as { metadata?: RatingsMetadata }).metadata;
    return {
      ratings: res.data.data ?? [],
      avg: meta?.averageRating ?? 0,
      total: meta?.totalRatings ?? 0,
    };
  },

  /** Tạo comment mới — yêu cầu đã đăng nhập + đã mua hàng. */
  create: async (productId: number, content: string): Promise<ProductComment> => {
    const res = await axiosInstance.post<ApiResponse<ProductComment>>(
      API_ENDPOINTS.PRODUCT_COMMENTS.CREATE,
      { productId, content }
    );
    return res.data.data!;
  },

  /** Xoá comment của chính mình. */
  deleteOwn: async (commentId: number): Promise<void> => {
    await axiosInstance.delete(API_ENDPOINTS.PRODUCT_COMMENTS.DELETE(commentId));
  },
};
