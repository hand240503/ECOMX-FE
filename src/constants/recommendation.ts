/** Chỉ dùng cho API cần `userId` khi khách (vd. product detail theo hợp đồng BE) — không dùng cho `GET /recommendations/home` (guest bỏ `userId`). */
export const ANONYMOUS_USER_ID = 1;
