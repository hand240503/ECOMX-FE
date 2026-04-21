export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH_TOKEN: '/auth/refresh',
    VERIFY_EMAIL: '/auth/otp/verify',
    SEND_OTP: '/auth/otp/send',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password'
  },

  USER: {
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    CHANGE_PASSWORD: '/users/profile/password',
    CHANGE_CONTACT: '/users/profile/contact',
  },

  PRODUCT: {
    LIST: '/products',
    DETAIL: (id: string) => `/products/${id}`,
    /** `GET` — `ProductDetailResponse` (product + recommendations). @see docs/product_api.md */
    DETAIL_WITH_RECOMMENDATIONS: (id: number | string) => `/products/${id}/detail`,
    /** @see docs/api_search.md §1 */
    SEARCH: '/products/search',
    /**
     * Danh sách SP theo phạm vi danh mục (categoryId + toàn bộ descendant), phân trang `page`/`limit`.
     * JWT. Chi tiết: docs/product-by-category.md — bước 4 luồng: docs/home-category-product-list-flow.md
     */
    BY_CATEGORY: (categoryId: number | string) => `/products/category/${categoryId}`,
  },

  RECOMMENDATIONS: {
    /** Trả JSON array thẳng (không bọc APIResponse) — xem docs/api_home.md */
    HOME: '/recommendations/home',
  },

  /**
   * Cần JWT. Hợp đồng: docs/category.md.
   * Thứ tự gọi trên trang danh mục: docs/home-category-product-list-flow.md (bước 2–3).
   */
  CATEGORY: {
    LIST: '/categories',
    ROOTS: '/categories/roots',
    CHILDREN: (parentId: number | string) => `/categories/parent/${parentId}/children`,
    BY_ID: (id: number | string) => `/categories/${id}`,
  },

  /** @see docs/api_search.md §2 */
  SEARCH: {
    TRENDING: '/search/trending',
  },
};
