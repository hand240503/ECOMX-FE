/** Đánh giá explicit của người dùng cho sản phẩm. Ánh xạ từ `UserRatingResponse` (BE). */
export interface UserRating {
  id: number;
  userId: number;
  username?: string;
  productId: number;
  productName?: string;
  /** Thang sao 1–5 (explicit). */
  rating: number;
  /** 0/null = explicit (người dùng chấm), 1 = implicit (recommend builder sinh). */
  type?: number | null;
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
