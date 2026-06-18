/** Đánh giá explicit của người dùng cho sản phẩm. Ánh xạ từ `UserRatingResponse` (BE). */
export interface UserRating {
  id: number;
  userId: number;
  username?: string;
  productId: number;
  productName?: string;
  rating: number;
  comment?: string | null;
  createdDate?: string;
  modifiedDate?: string;
}

/** Body `POST /user-ratings`. */
export interface CreateUserRatingPayload {
  userId: number;
  productId: number;
  /** 1–5 */
  rating: number;
  comment?: string;
}

/** Body `PUT /user-ratings/{id}`. */
export interface UpdateUserRatingPayload {
  rating?: number;
  comment?: string;
}
