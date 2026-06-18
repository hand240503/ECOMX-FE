import { axiosInstance } from '../config/axiosConfig';
import { API_ENDPOINTS } from '../config/apiEndpoints';
import type { ApiResponse } from '../types/common.types';
import type {
  CreateUserRatingPayload,
  UpdateUserRatingPayload,
  UserRating,
} from '../types/rating.types';

/**
 * Đánh giá explicit của người dùng cho sản phẩm.
 * @see backend README §5 "Quản lý Đánh giá Người dùng" — `/user-ratings`
 */
export const ratingService = {
  /** `GET /user-ratings/user/{userId}` — toàn bộ đánh giá của 1 user. */
  async getByUser(userId: number, options?: { signal?: AbortSignal }): Promise<UserRating[]> {
    const { data } = await axiosInstance.get<ApiResponse<UserRating[]>>(
      API_ENDPOINTS.USER_RATINGS_BY_USER(userId),
      { signal: options?.signal }
    );
    return Array.isArray(data.data) ? data.data : [];
  },

  /** `POST /user-ratings` — tạo đánh giá explicit (rating 1–5 + comment). */
  async create(payload: CreateUserRatingPayload): Promise<UserRating> {
    const { data } = await axiosInstance.post<ApiResponse<UserRating>>(
      API_ENDPOINTS.USER_RATINGS,
      payload
    );
    if (data.success === false || !data.data) {
      throw new Error(
        typeof data.message === 'string' && data.message.trim() !== ''
          ? data.message.trim()
          : 'Tạo đánh giá thất bại'
      );
    }
    return data.data;
  },

  /** `PUT /user-ratings/{id}` — cập nhật đánh giá đã có. */
  async update(id: number, payload: UpdateUserRatingPayload): Promise<UserRating> {
    const { data } = await axiosInstance.put<ApiResponse<UserRating>>(
      API_ENDPOINTS.USER_RATINGS_BY_ID(id),
      payload
    );
    if (data.success === false || !data.data) {
      throw new Error(
        typeof data.message === 'string' && data.message.trim() !== ''
          ? data.message.trim()
          : 'Cập nhật đánh giá thất bại'
      );
    }
    return data.data;
  },

  /** `DELETE /user-ratings/{id}` — xoá đánh giá của chính mình. */
  async remove(id: number): Promise<void> {
    const { data } = await axiosInstance.delete<ApiResponse<void>>(
      API_ENDPOINTS.USER_RATINGS_BY_ID(id)
    );
    if (data.success === false) {
      throw new Error(
        typeof data.message === 'string' && data.message.trim() !== ''
          ? data.message.trim()
          : 'Xoá đánh giá thất bại'
      );
    }
  },
};
