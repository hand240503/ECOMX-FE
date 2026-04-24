/** @see docs/API_add_order.md */

/** JSON string: `{"unit":"","message":"","note":""}` */
export type OrderDescriptionJsonString = string;

export type PaymentMethodDto = {
  id: number;
  name: string;
  code: string;
  sortOrder?: number;
};

export type CreateOrderRequestBody = {
  order: {
    description?: OrderDescriptionJsonString;
    typeOrder?: number;
    deliveryAddress: string;
    paymentMethodId: number;
  };
  orderDetails: Array<{
    productId: number;
    quantity: number;
    description?: OrderDescriptionJsonString;
  }>;
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
};

/** Kết quả `POST /orders`. @see docs/API_add_order.md */
export type CreateOrderOutcome = 'ORDER_CREATED' | 'PENDING_VNPAY_PAYMENT';

export type CreateOrderResult =
  | { outcome: 'ORDER_CREATED'; order: CreatedOrder }
  | {
      outcome: 'PENDING_VNPAY_PAYMENT';
      checkoutSessionId: number;
      transactionPublicId: string;
      pendingTotal?: number;
      paymentMethod?: { id: number; name: string; code: string };
      message?: string;
    };

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
};

/** Đơn từ `GET /orders` / `GET /orders/{id}` — cùng cấu trúc phản hồi tạo đơn. */
export type OrderDto = CreatedOrder;

