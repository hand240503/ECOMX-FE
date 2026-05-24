/** @see docs/API_add_order.md */

/** JSON string: `{"unit":"","message":"","note":""}` */
export type OrderDescriptionJsonString = string;

export type PaymentMethodDto = {
  id: number;
  name: string;
  code: string;
  sortOrder?: number;
};

/**
 * @see docs/API_SHIPPING_AND_ORDERS_UPDATE.md
 *
 * Bắt buộc một trong hai:
 * - `userAddressId` (địa chỉ đã geocode/OSRM trên BE). Nếu chưa có khoảng cách trên bản ghi,
 *   gửi thêm `deliveryDistanceMeters` làm fallback.
 * - Hoặc `deliveryDistanceMeters` (≥ 0) **và** `deliveryAddress` (text) khi không có `userAddressId`.
 *
 * Chỉ gửi mỗi `deliveryAddress` không còn hợp lệ → BE 400.
 */
export type CreateOrderRequestBody = {
  order: {
    description?: OrderDescriptionJsonString;
    typeOrder?: number;
    /**
     * Khi có `userAddressId`, BE tự ghép địa chỉ đầy đủ — có thể `''`.
     * Khi không có `userAddressId`: bắt buộc chuỗi snapshot giao hàng.
     */
    deliveryAddress?: string;
    paymentMethodId: number;
    /** Id địa chỉ lưu — BE đọc khoảng cách + phí từ `user_address`. */
    userAddressId?: number;
    /** Mét; có thể gửi kèm `userAddressId` làm fallback hoặc bắt buộc nếu không có id. */
    deliveryDistanceMeters?: number;
  };
  orderDetails: Array<{
    /** Legacy — khi không có `productVariantId` BE chọn biến thể mặc định. */
    productId?: number;
    /** Khuyến nghị cho SP đa biến thể (id SKU). */
    productVariantId?: number;
    quantity: number;
    description?: OrderDescriptionJsonString;
  }>;
};

// ─── Typed promo sub-snapshots (snake_case khớp với @JsonProperty BE) ──────────

/**
 * Snapshot chương trình Price Change (PC) trên một dòng đơn.
 * Ánh xạ từ `OrderLinePricingProgramsDto.PriceChangeProgramDto` (BE).
 */
export type PriceChangeProgramSnapshot = {
  id?: number | null;
  product_variant_id?: number | null;
  /** Giá gốc (niêm yết) tại thời điểm PC được tạo. */
  base_price?: number | null;
  /** Giá khuyến mãi; null = không có giảm giá (dùng base_price). */
  sale_price?: number | null;
  /** Giá thực sự áp dụng: sale_price ?? base_price. */
  resolved_unit_price?: number | null;
  start_at_epoch_ms?: number | null;
  end_at_epoch_ms?: number | null;
};

/**
 * Snapshot bậc giá theo số lượng (Volume Tier / mix-and-match).
 * Ánh xạ từ `OrderLinePricingProgramsDto.VolumeTierProgramDto` (BE).
 */
export type VolumeTierProgramSnapshot = {
  id?: number | null;
  /** Số lượng tối thiểu để kích hoạt bậc này. */
  min_quantity?: number | null;
  /** Đơn giá của bậc. */
  tier_unit_price?: number | null;
  /** Tổng SL cùng SKU trên toàn đơn — để chọn bậc phù hợp. */
  aggregate_quantity_for_variant_on_order?: number | null;
};

/**
 * Snapshot chương trình Purchase with Purchase (PwP) trên dòng companion.
 * Ánh xạ từ `OrderLinePricingProgramsDto.PwpProgramDto` (BE).
 */
export type PwpProgramSnapshot = {
  offer_id?: number | null;
  anchor_product_id?: number | null;
  companion_product_id?: number | null;
  anchor_variant_id?: number | null;
  companion_variant_id?: number | null;
  /** Đơn giá khuyến mãi áp cho phần promo_quantity đơn vị. */
  promo_unit_price?: number | null;
  /** Số lượng được hưởng giá PwP. */
  promo_quantity?: number | null;
  /** Số lượng còn lại tính giá thường (sau volume tier). */
  regular_quantity?: number | null;
  /** Đơn giá áp cho regular_quantity (đã qua volume tier). */
  regular_unit_price_after_programs?: number | null;
};

/**
 * Snapshot chương trình giá trên dòng đơn / preview checkout.
 * Tất cả field đều snake_case khớp `@JsonProperty` của BE.
 * @see docs/CHECKOUT_ORDER_PRICING_UI.md
 */
export type OrderLinePricingProgramsSnapshot = {
  priced_at_epoch_ms?: number | null;
  /** Giá catalog (niêm yết SKU) trước mọi chương trình. */
  catalog_unit_price?: number | null;
  /** Giá sau PC, trước volume tier. */
  effective_unit_before_volume_tier?: number | null;
  /** Đơn giá cuối (có thể là trung bình trọng số khi PwP kết hợp regular). */
  final_unit_price?: number | null;
  line_total?: number | null;
  price_change?: PriceChangeProgramSnapshot | null;
  volume_tier?: VolumeTierProgramSnapshot | null;
  purchase_with_purchase?: PwpProgramSnapshot | null;
};

export type CreatedOrderDetail = {
  id: number;
  productId: number;
  productName?: string;
  quantity: number;
  unitPrice?: number;
  lineTotal?: number;
  description?: OrderDescriptionJsonString | null;
  /** Một số bản BE gửi kèm (VNPAY / chi tiết đơn). */
  unitId?: number;
  productVariantId?: number;
  variantSkuCode?: string | null;
  variantOptions?: Record<string, string> | null;
  /** Snapshot JSON từ BE; đơn cũ có thể không có. Snake_case: `pricing_programs`. */
  pricingPrograms?: OrderLinePricingProgramsSnapshot | null;
};

/** `POST /orders/checkout-pricing-preview` — body.field `lines` giống `orderDetails` khi tạo đơn. */
export type CheckoutPricingPreviewRequestBody = {
  lines: CreateOrderRequestBody['orderDetails'];
};

/**
 * Một dòng trong response của `POST /orders/checkout-pricing-preview`.
 * Ánh xạ từ `CheckoutPricingLineItemResponse` (BE) — các field snake_case từ `@JsonProperty`.
 */
export type CheckoutPricingPreviewLineDto = {
  /** Id SPU. */
  productId?: number | null;
  /** Id SKU (biến thể). Dùng để map chính xác với cart line khi có đa biến thể. */
  productVariantId?: number | null;
  productName?: string | null;
  variantSkuCode?: string | null;
  variantOptions?: Record<string, string> | null;
  quantity?: number | null;
  /** Đơn giá cuối sau tất cả chương trình (có thể là weighted avg nếu PwP). */
  unitPrice: number | null;
  lineTotal: number | null;
  /** Snapshot đầy đủ các chương trình đã áp dụng. */
  pricingPrograms: OrderLinePricingProgramsSnapshot | null;
};

/**
 * Gợi ý mua kèm PwP: SP neo đang có trong giỏ nhưng companion chưa được thêm.
 * Ánh xạ từ `CheckoutPwpSuggestionDto` (BE).
 */
export type CheckoutPwpSuggestionDto = {
  offer_id: number;
  /** Id SPU neo đang có trong giỏ. */
  anchor_product_id?: number | null;
  anchor_variant_id?: number | null;
  /** Id SPU companion chưa có trong giỏ. */
  companion_product_id?: number | null;
  companion_variant_id?: number | null;
  companion_product_name?: string | null;
  companion_variant_sku_code?: string | null;
  companion_variant_options?: Record<string, string> | null;
  companion_thumbnail_url?: string | null;
  /** Giá KM khi mua kèm. */
  promo_unit_price: number;
  /** Giá niêm yết / catalog của companion (để so sánh). */
  companion_regular_price?: number | null;
  min_anchor_quantity?: number | null;
  companion_promo_units_per_anchor?: number | null;
  max_companion_promo_units?: number | null;
};

export type CheckoutPricingPreviewData = {
  itemsSubtotal: number;
  lines: CheckoutPricingPreviewLineDto[];
  /**
   * Danh sách gợi ý mua kèm PwP: companion chưa có trong giỏ, neo đã đủ SL.
   * FE hiển thị lựa chọn "Mua kèm giá ưu đãi" / "Không áp dụng" bên dưới anchor line.
   */
  pwp_suggestions?: CheckoutPwpSuggestionDto[] | null;
};

/** Snapshot từ `POST /orders` — @see docs/API_SHIPPING_AND_ORDERS_UPDATE.md §3 */
export type OrderShippingSnapshot = {
  shippingFeeVnd?: number | null;
  deliveryDistanceMeters?: number | null;
};

/** Kết quả `POST /orders`. @see docs/API_add_order.md */
export type CreateOrderOutcome = 'ORDER_CREATED' | 'PENDING_VNPAY_PAYMENT';

export type CreateOrderResult =
  | ({ outcome: 'ORDER_CREATED'; order: CreatedOrder } & OrderShippingSnapshot)
  | ({
      outcome: 'PENDING_VNPAY_PAYMENT';
      checkoutSessionId: number;
      /** Id phiên thanh toán do BE gán (ví dụ `"42"`), không phải UUID do FE tạo. */
      transactionPublicId: string;
      pendingTotal?: number;
      paymentMethod?: { id: number; name: string; code: string };
      message?: string;
    } & OrderShippingSnapshot);

/** `POST /payment/vnpay/checkout-sessions/{id}/payment-url` */
export type VnpayPaymentUrlData = {
  paymentUrl: string;
  txnRef?: string;
  vnpAmount?: number;
};

export type VnpayPendingState = 'PENDING' | 'EXPIRED' | 'FAILED' | 'CANCELLED' | 'COMPLETED';

/** `GET /orders/vnpay-pending/{transactionPublicId}` */
export type VnpayPendingDto = {
  state: VnpayPendingState | string;
  order?: CreatedOrder;
  transactionPublicId?: string;
  checkoutSessionId?: number;
  pendingTotal?: number;
  paymentMethod?: { id: number; name: string; code: string };
  deliveryAddress?: string;
  expiresAt?: string;
  message?: string;
};

/** `GET /orders/vnpay-pending/{transactionPublicId}/transaction-status` */
export type VnpayTransactionStatusDto = {
  vnpTransactionStatus?: string;
  vnpTransactionStatusMessage?: string;
  internalState?: string;
  vnpayTxnRef?: string | null;
  orderId?: number | null;
};

export type CreatedOrder = {
  id: number;
  orderCode: string;
  status: number;
  /** Theo API ship mới: thường = tổng dòng + phí (xem `API_SHIPPING_AND_ORDERS_UPDATE.md` §3). */
  total: number;
  typeOrder?: number;
  deliveryAddress: string;
  /** Ghi chú đơn (FE thường gửi chuỗi JSON `OrderDescriptionPayload`). */
  description?: string | null;
  paymentMethod?: { id: number; name: string; code: string };
  orderDetails?: CreatedOrderDetail[];
  /** @see docs/API_add_order.md — trả hàng/hoàn tiền */
  returnRefundStatus?: number | null;
  returnRefundNote?: string | null;
  createdDate?: string;
  modifiedDate?: string;
  /** Cập nhật sau IPN VNPAY (nếu backend trả). */
  paid?: boolean;
  paidAt?: string | null;
  /** Gắn với phiên checkout (BE có thể trả khi tra cứu sau thanh toán thất bại). */
  checkoutSessionId?: number | null;
  /** @see docs/API_SHIPPING_AND_ORDERS_UPDATE.md §4 */
  deliveryDistanceMeters?: number | null;
  shippingFeeVnd?: number | null;
  /** Nếu BE trả: mức giảm phí vận chuyển (VND, số dương). */
  shippingDiscountVnd?: number | null;
  /** Nếu BE trả: giảm giá voucher shop (VND, số dương). */
  shopVoucherDiscountVnd?: number | null;
};

/** Đơn từ `GET /orders` / `GET /orders/{id}` — cùng cấu trúc phản hồi tạo đơn. */
export type OrderDto = CreatedOrder;

