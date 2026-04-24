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
    /** @see docs/API_user_address.md */
    ADDRESSES: '/users/addresses',
    ADDRESS_BY_ID: (id: number | string) => `/users/addresses/${id}`,
    ADDRESS_SET_DEFAULT: (id: number | string) => `/users/addresses/${id}/default`,
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
    /**
     * `POST` body `{ productIds: number[] }` — tối đa 200 id; trả về `ProductFullResponse[]` theo thứ tự gửi.
     * @see docs/API_products_by_ids_FE.md
     */
    BY_IDS: '/products/by-ids',
  },

  RECOMMENDATIONS: {
    /** Trả JSON array thẳng (không bọc APIResponse) — xem docs/api_home.md */
    HOME: '/recommendations/home',
    /**
     * `GET` — `ProductFullResponse[]` (không envelope). Gợi ý theo 1 sản phẩm nguồn (CF+content hybrid).
     * @see docs/API_recommendation_item_hybrid_FE.md
     */
    ITEM_HYBRID: (productId: number | string) => `/recommendations/item-hybrid/${productId}`,
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

  /** @see docs/API_add_order.md */
  ORDER: {
    PAYMENT_METHODS: '/payment-methods',
    CREATE: '/orders',
    LIST: '/orders',
    BY_ID: (id: number | string) => `/orders/${id}`,
    CANCEL: (id: number | string) => `/orders/${id}/cancel`,
    RETURN_REQUEST: (id: number | string) => `/orders/${id}/return-request`,
    /** @see docs/VNPAY_CHECKOUT_SESSIONS_FE_GUIDE.md */
    VNPAY_PENDING: (transactionPublicId: string) => `/orders/vnpay-pending/${transactionPublicId}`,
    VNPAY_PENDING_TRANSACTION_STATUS: (transactionPublicId: string) =>
      `/orders/vnpay-pending/${transactionPublicId}/transaction-status`,
    VNPAY_ABANDON: (transactionPublicId: string) => `/orders/vnpay-pending/${transactionPublicId}/abandon`,
    /**
     * Dev: mô phỏng IPN thành công khi IPN không tới localhost — JWT, không body; BE bật `vnpay.dev-simulate-success-enabled`.
     * @see docs/VNPAY_CHECKOUT_SESSIONS_FE_GUIDE.md §4
     */
    VNPAY_DEV_SIMULATE_SUCCESS: (transactionPublicId: string) =>
      `/orders/vnpay-pending/${transactionPublicId}/dev-simulate-success`,
  },

  VNPAY: {
    CHECKOUT_SESSION_PAYMENT_URL: (checkoutSessionId: number | string) =>
      `/payment/vnpay/checkout-sessions/${checkoutSessionId}/payment-url`,
  },
};
