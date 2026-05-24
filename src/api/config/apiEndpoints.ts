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
    /**
     * Backend cũng có variant query string: `GET /products/by-ids?ids=1,2,3` (FE hiện chưa dùng).
     * FE chỉ khai báo path, phần `?ids=` sẽ được build từ service nếu cần.
     */
    BY_IDS_QUERY: '/products/by-ids',
    /** `GET ?limit=&all=` — `is_featured` / `hot_sale`. @see docs/FRONTEND_PRODUCT_FEATURED_HOT_SALE.md */
    IS_FEATURED: '/products/is-featured',
    HOT_SALE: '/products/hot-sale',
    /** Backend có nhưng FE hiện chưa dùng */
    FEATURED: '/products/featured',
    /** Backend có nhưng FE hiện chưa dùng */
    BEST_SELLERS: '/products/best-sellers',
    /** `GET /products/active-promotions` */
    ACTIVE_PROMOTIONS: '/products/active-promotions',
  },

  RECOMMENDATIONS: {
    /** Trả JSON array thẳng (không bọc APIResponse) — xem docs/api_home.md */
    HOME: '/recommendations/home',
    /**
     * `GET` — `ProductFullResponse[]` (không envelope). Gợi ý theo 1 sản phẩm nguồn (CF+content hybrid).
     * @see docs/API_recommendation_item_hybrid_FE.md
     */
    ITEM_HYBRID: (productId: number | string) => `/recommendations/item-hybrid/${productId}`,
    /** Backend có nhưng FE hiện chưa dùng */
    PDP: (productId: number | string) => `/recommendations/pdp/${productId}`,
    /** Backend có nhưng FE hiện chưa dùng */
    POST_PURCHASE: (productId: number | string) => `/recommendations/post-purchase/${productId}`,
    /** Backend có nhưng FE hiện chưa dùng */
    SESSION: '/recommendations/session',
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
    /** @see docs/CHECKOUT_ORDER_PRICING_UI.md */
    CHECKOUT_PRICING_PREVIEW: '/orders/checkout-pricing-preview',
    PAYMENT_METHODS: '/payment-methods',
    CREATE: '/orders',
    LIST: '/orders',
    BY_ID: (id: number | string) => `/orders/${id}`,
    CANCEL: (id: number | string) => `/orders/${id}/cancel`,
    RETURN_REQUEST: (id: number | string) => `/orders/${id}/return-request`,
    /** Backend có nhưng FE hiện chưa dùng */
    CONFIRM_PAYMENT: (id: number | string) => `/orders/${id}/confirm-payment`,
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

  /** @see docs/API_SHIPPING_AND_ORDERS_UPDATE.md §1 */
  SHIPPING: {
    DISTANCE_TO_WAREHOUSE: '/shipping/distance-to-warehouse',
  },

  /** @see docs/COLLECTOR_LOG_API.md */
  COLLECTOR_LOGS: '/collector-logs',
  /** Backend có nhưng FE hiện chưa dùng */
  COLLECTOR_LOGS_BY_ID: (id: number | string) => `/collector-logs/${id}`,
  /** Backend có nhưng FE hiện chưa dùng */
  COLLECTOR_LOGS_BY_USER: (userId: number | string) => `/collector-logs/user/${userId}`,
  /** Backend có nhưng FE hiện chưa dùng */
  COLLECTOR_LOGS_BY_PRODUCT: (productId: number | string) => `/collector-logs/product/${productId}`,
  /** Backend có nhưng FE hiện chưa dùng */
  COLLECTOR_LOGS_BY_EVENT: (event: string) => `/collector-logs/event/${event}`,
  /** Backend có nhưng FE hiện chưa dùng */
  COLLECTOR_LOGS_BY_SESSION: (sessionId: string) => `/collector-logs/session/${sessionId}`,
  /** Backend có nhưng FE hiện chưa dùng */
  COLLECTOR_LOGS_DATE_RANGE: '/collector-logs/date-range',
  /** Backend có nhưng FE hiện chưa dùng */
  COLLECTOR_LOGS_FILTER: '/collector-logs/filter',

  /** Backend có nhưng FE hiện chưa dùng */
  USER_RATINGS: '/user-ratings',
  /** Backend có nhưng FE hiện chưa dùng */
  USER_RATINGS_BY_ID: (id: number | string) => `/user-ratings/${id}`,
  /** Backend có nhưng FE hiện chưa dùng */
  USER_RATINGS_BY_USER_PRODUCT: (userId: number | string, productId: number | string) =>
    `/user-ratings/user/${userId}/product/${productId}`,
  /** Backend có nhưng FE hiện chưa dùng */
  USER_RATINGS_BY_USER: (userId: number | string) => `/user-ratings/user/${userId}`,
  /** Backend có nhưng FE hiện chưa dùng */
  USER_RATINGS_BY_PRODUCT: (productId: number | string) => `/user-ratings/product/${productId}`,
  /** Backend có nhưng FE hiện chưa dùng */
  USER_RATINGS_PRODUCT_AVERAGE: (productId: number | string) => `/user-ratings/product/${productId}/average`,

  PRODUCT_COMMENTS: {
    BY_PRODUCT: (productId: number | string) => `/product-comments/product/${productId}`,
    CREATE: '/product-comments',
    UPDATE: (id: number | string) => `/product-comments/${id}`,
    DELETE: (id: number | string) => `/product-comments/${id}`,
  },

  /** Backend có nhưng FE hiện chưa dùng */
  ADMIN: {
    USERS: '/admin/users',
    USER_BY_ID: (id: number | string) => `/admin/users/${id}`,
  },

  /**
   * Upload: `POST` multipart — `files`, optional `entityId` + `entityType` (SP = 100000),
   * optional `mainFileIndex` (0-based, file phải là ảnh; video/PDF → 400).
   */
  DOCUMENT: {
    UPLOAD: '/document/upload',
    BY_FILENAME: (filename: string) => `/document/${filename}`,
  },

  /** Backend có nhưng FE hiện chưa dùng */
  JOB: {
    ROOT: '/job',
    DETAILS: '/job/details',
  },
};
