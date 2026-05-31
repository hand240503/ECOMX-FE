import axios from 'axios';
import { axiosInstance } from '../config/axiosConfig';
import { API_ENDPOINTS } from '../config/apiEndpoints';
import type { ApiResponse } from '../types/common.types';
import type {
  CheckoutPricingPreviewData,
  CheckoutPricingPreviewRequestBody,
  CreatedOrder,
  CreateOrderRequestBody,
  CreateOrderResult,
  OrderDto,
  OrderLinePricingProgramsSnapshot,
  OrderShippingSnapshot,
  OrderTimelineDto,
  PaymentMethodDto,
  VnpayPaymentUrlData,
  VnpayPendingDto,
  VnpayTransactionStatusDto,
} from '../types/order.types';

function asPositiveInt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return Math.trunc(value);
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number.parseInt(value, 10);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

function readOutcome(d: Record<string, unknown>): string | undefined {
  const o = d.outcome;
  if (typeof o === 'string' && o.trim() !== '') return o.trim();
  return undefined;
}

function readNonEmptyString(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim() !== '') return value.trim();
  return undefined;
}

/** `transactionPublicId` từ BE có thể là chuỗi hoặc số (ví dụ 42 / "42") — không dùng UUID do FE tạo. */
function readTransactionPublicIdFromPayload(d: Record<string, unknown>): string | undefined {
  const raw = d.transactionPublicId ?? d.transaction_public_id;
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    const s = String(Math.trunc(raw));
    return s !== '' ? s : undefined;
  }
  return readNonEmptyString(raw);
}

function readPendingTotalFromPayload(d: Record<string, unknown>): number | undefined {
  const raw = d.pendingTotal ?? d.pending_total;
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string' && raw.trim() !== '') {
    const n = Number.parseFloat(raw.replace(',', '.'));
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function hasOrderCreatedShape(d: Record<string, unknown>): boolean {
  const id = asPositiveInt(d.id ?? d.orderId);
  const orderCode = d.orderCode ?? d.order_code;
  return id != null && typeof orderCode === 'string';
}

function readShippingSnapshot(d: Record<string, unknown>): OrderShippingSnapshot {
  const out: OrderShippingSnapshot = {};
  if (d.shippingFeeVnd !== undefined || d.shipping_fee_vnd !== undefined) {
    const v = d.shippingFeeVnd !== undefined ? d.shippingFeeVnd : d.shipping_fee_vnd;
    if (v === null) out.shippingFeeVnd = null;
    else if (typeof v === 'number' && Number.isFinite(v)) out.shippingFeeVnd = Math.round(v);
  }
  if (d.deliveryDistanceMeters !== undefined || d.delivery_distance_meters !== undefined) {
    const v =
      d.deliveryDistanceMeters !== undefined ? d.deliveryDistanceMeters : d.delivery_distance_meters;
    if (v === null) out.deliveryDistanceMeters = null;
    else if (typeof v === 'number' && Number.isFinite(v)) out.deliveryDistanceMeters = Math.round(v);
  }
  return out;
}

/** Chuẩn hóa `data` từ `POST /orders` (hợp đồng mới + snake_case + tương thích đơn phẳng). */
function readFiniteNumberLoose(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = typeof v === 'number' ? v : Number.parseFloat(String(v).replace(',', '.'));
  if (!Number.isFinite(n)) return null;
  return n;
}

function readOptionalString(value: unknown): string | null {
  if (typeof value === 'string' && value.trim() !== '') return value.trim();
  return null;
}

function readOptionalRecord(value: unknown): Record<string, string> | null {
  if (value != null && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, string>;
  }
  return null;
}

function normalizeCheckoutPricingPreview(raw: unknown): CheckoutPricingPreviewData {
  if (raw == null || typeof raw !== 'object') {
    throw new Error('Invalid checkout pricing preview response');
  }
  const d = raw as Record<string, unknown>;
  const itemsSubtotal =
    readFiniteNumberLoose(d.items_subtotal) ?? readFiniteNumberLoose(d.itemsSubtotal);
  if (itemsSubtotal == null || itemsSubtotal < 0) {
    throw new Error('Invalid checkout pricing preview: items_subtotal');
  }

  const linesRaw = d.lines;
  const lines: CheckoutPricingPreviewData['lines'] = [];
  if (Array.isArray(linesRaw)) {
    for (const item of linesRaw) {
      if (item == null || typeof item !== 'object') continue;
      const L = item as Record<string, unknown>;

      // IDs — BE trả snake_case từ @JsonProperty
      const productId =
        asPositiveInt(L.product_id) ?? asPositiveInt(L.productId) ?? null;
      const productVariantId =
        asPositiveInt(L.product_variant_id) ?? asPositiveInt(L.productVariantId) ?? null;

      const productName =
        readOptionalString(L.product_name) ?? readOptionalString(L.productName);
      const variantSkuCode =
        readOptionalString(L.variant_sku_code) ?? readOptionalString(L.variantSkuCode);
      const variantOptions =
        readOptionalRecord(L.variant_options) ?? readOptionalRecord(L.variantOptions);
      const quantity =
        asPositiveInt(L.quantity) ?? null;

      const unitPrice =
        readFiniteNumberLoose(L.unit_price) ?? readFiniteNumberLoose(L.unitPrice);
      const lineTotal =
        readFiniteNumberLoose(L.line_total) ??
        readFiniteNumberLoose(L.lineTotal) ??
        readFiniteNumberLoose(L.line_tototal);

      // pricingPrograms — giữ nguyên object từ BE (snake_case fields)
      const ppRaw = L.pricing_programs ?? L.pricingPrograms;
      const pricingPrograms: OrderLinePricingProgramsSnapshot | null =
        ppRaw != null && typeof ppRaw === 'object' && !Array.isArray(ppRaw)
          ? (ppRaw as OrderLinePricingProgramsSnapshot)
          : null;

      lines.push({
        productId,
        productVariantId,
        productName,
        variantSkuCode,
        variantOptions,
        quantity,
        unitPrice,
        lineTotal,
        pricingPrograms,
      });
    }
  }

  return { itemsSubtotal, lines };
}

function normalizeCreateOrderResult(raw: unknown): CreateOrderResult {
  if (raw == null || typeof raw !== 'object') {
    throw new Error('Invalid create order response');
  }
  const d = raw as Record<string, unknown>;
  const outcome = readOutcome(d);

  if (outcome === 'ORDER_CREATED') {
    const orderPayload = d.order;
    if (orderPayload != null && typeof orderPayload === 'object') {
      return {
        outcome: 'ORDER_CREATED',
        order: orderPayload as CreatedOrder,
        ...readShippingSnapshot(d),
      };
    }
  }

  if (outcome === 'PENDING_VNPAY_PAYMENT') {
    const checkoutSessionId = asPositiveInt(
      d.checkoutSessionId ?? d.checkout_session_id
    );
    const transactionPublicId = readTransactionPublicIdFromPayload(d);
    if (checkoutSessionId != null && transactionPublicId) {
      const pmRaw = d.paymentMethod ?? d.payment_method;
      const paymentMethod =
        pmRaw != null && typeof pmRaw === 'object'
          ? (pmRaw as { id: number; name: string; code: string })
          : undefined;
      const pendingTotal = readPendingTotalFromPayload(d);
      return {
        outcome: 'PENDING_VNPAY_PAYMENT',
        checkoutSessionId,
        transactionPublicId,
        pendingTotal,
        paymentMethod,
        message: readNonEmptyString(d.message),
        ...readShippingSnapshot(d),
      };
    }
  }

  if (hasOrderCreatedShape(d)) {
    return {
      outcome: 'ORDER_CREATED',
      order: raw as CreatedOrder,
      ...readShippingSnapshot(d),
    };
  }

  throw new Error('Unknown create order response shape');
}

const parseApiErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as ApiResponse<unknown> | undefined;
    const fieldMsg = body?.errors?.find((e) => e.message)?.message;
    if (fieldMsg) return fieldMsg;
    if (body?.message) return body.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

export const orderService = {
  /** `POST /orders/checkout-pricing-preview` — @see docs/CHECKOUT_ORDER_PRICING_UI.md */
  async checkoutPricingPreview(
    lines: CheckoutPricingPreviewRequestBody['lines'],
    opts?: { signal?: AbortSignal }
  ): Promise<CheckoutPricingPreviewData> {
    try {
      const body: CheckoutPricingPreviewRequestBody = { lines };
      const { data } = await axiosInstance.post<ApiResponse<unknown>>(
        API_ENDPOINTS.ORDER.CHECKOUT_PRICING_PREVIEW,
        body,
        { signal: opts?.signal }
      );
      if (!data.success || data.data === undefined) {
        throw new Error(data.message || 'Không lấy được bảng giá thanh toán');
      }
      return normalizeCheckoutPricingPreview(data.data);
    } catch (error) {
      throw new Error(parseApiErrorMessage(error, 'Không lấy được bảng giá thanh toán'));
    }
  },

  async listPaymentMethods(): Promise<PaymentMethodDto[]> {
    try {
      const { data } = await axiosInstance.get<ApiResponse<PaymentMethodDto[]>>(
        API_ENDPOINTS.ORDER.PAYMENT_METHODS
      );
      if (!data.success || data.data === undefined) {
        throw new Error(data.message || 'Không tải được phương thức thanh toán');
      }
      return data.data;
    } catch (error) {
      throw new Error(parseApiErrorMessage(error, 'Không tải được phương thức thanh toán'));
    }
  },

  /**
   * `GET /orders` — `status` 1..5 theo tài liệu; bỏ qua = tất cả.
   * @see docs/API_add_order.md
   */
  async listOrders(status?: number): Promise<OrderDto[]> {
    try {
      const { data } = await axiosInstance.get<ApiResponse<OrderDto[]>>(API_ENDPOINTS.ORDER.LIST, {
        params: status != null ? { status } : undefined,
      });
      if (!data.success || data.data === undefined) {
        throw new Error(data.message || 'Không tải được danh sách đơn hàng');
      }
      return data.data;
    } catch (error) {
      throw new Error(parseApiErrorMessage(error, 'Không tải được danh sách đơn hàng'));
    }
  },

  async getOrderById(id: number): Promise<OrderDto> {
    try {
      const { data } = await axiosInstance.get<ApiResponse<OrderDto>>(API_ENDPOINTS.ORDER.BY_ID(id));
      if (!data.success || data.data === undefined) {
        throw new Error(data.message || 'Không tải được đơn hàng');
      }
      return data.data;
    } catch (error) {
      throw new Error(parseApiErrorMessage(error, 'Không tải được đơn hàng'));
    }
  },

  /**
   * `GET /orders/{id}/timeline` — tiến trình đơn hàng dạng stepper.
   * Chỉ trả về đơn thuộc về user đang đăng nhập.
   */
  async getOrderTimeline(id: number): Promise<OrderTimelineDto> {
    try {
      const { data } = await axiosInstance.get<ApiResponse<OrderTimelineDto>>(
        API_ENDPOINTS.ORDER.TIMELINE(id)
      );
      if (!data.success || data.data === undefined) {
        throw new Error(data.message || 'Không tải được tiến trình đơn hàng');
      }
      return data.data;
    } catch (error) {
      throw new Error(parseApiErrorMessage(error, 'Không tải được tiến trình đơn hàng'));
    }
  },

  /**
   * Hủy đơn (chỉ khi đơn ở trạng thái cho phép — thường `status === 1`).
   * `POST /orders/{id}/cancel`
   * @see docs/API_add_order.md
   */
  async cancelOrder(id: number, reason: string): Promise<OrderDto> {
    try {
      const { data } = await axiosInstance.post<ApiResponse<OrderDto>>(
        API_ENDPOINTS.ORDER.CANCEL(id),
        { reason },
      );
      if (!data.success || data.data === undefined) {
        throw new Error(data.message || 'Không hủy được đơn hàng');
      }
      return data.data;
    } catch (error) {
      throw new Error(parseApiErrorMessage(error, 'Không hủy được đơn hàng'));
    }
  },

  async submitReturnRequest(
    id: number,
    body?: {
      reason?: string;
      refundMethod?: string;
      bankAccountNumber?: string;
      bankName?: string;
      bankEmail?: string;
    }
  ): Promise<OrderDto> {
    try {
      const { data } = await axiosInstance.post<ApiResponse<OrderDto>>(
        API_ENDPOINTS.ORDER.RETURN_REQUEST(id),
        body ?? {}
      );
      if (!data.success || data.data === undefined) {
        throw new Error(data.message || 'Không gửi được yêu cầu trả hàng');
      }
      return data.data;
    } catch (error) {
      throw new Error(parseApiErrorMessage(error, 'Không gửi được yêu cầu trả hàng'));
    }
  },

  async createOrder(body: CreateOrderRequestBody): Promise<CreateOrderResult> {
    try {
      const { data, status } = await axiosInstance.post<ApiResponse<unknown>>(API_ENDPOINTS.ORDER.CREATE, body);
      if ((status === 201 || data.success) && data.data !== undefined) {
        return normalizeCreateOrderResult(data.data);
      }
      throw new Error(data.message || 'create_order_error');
    } catch (error) {
      throw new Error(parseApiErrorMessage(error, 'Không tạo được đơn hàng'));
    }
  },

  /** `POST /payment/vnpay/checkout-sessions/{sessionId}/payment-url` */
  async createVnpayPaymentUrl(checkoutSessionId: number): Promise<VnpayPaymentUrlData> {
    try {
      const { data } = await axiosInstance.post<ApiResponse<Record<string, unknown>>>(
        API_ENDPOINTS.VNPAY.CHECKOUT_SESSION_PAYMENT_URL(checkoutSessionId),
        {}
      );
      if (!data.success || data.data == null || typeof data.data !== 'object') {
        throw new Error(data.message || 'Không tạo được liên kết VNPAY');
      }
      const d = data.data;
      const paymentUrl = readNonEmptyString(d.paymentUrl ?? d.payment_url);
      if (!paymentUrl) {
        throw new Error(data.message || 'Thiếu paymentUrl từ máy chủ');
      }
      return {
        paymentUrl,
        txnRef: readNonEmptyString(d.txnRef ?? d.txn_ref),
        vnpAmount: typeof d.vnpAmount === 'number' ? d.vnpAmount : typeof d.vnp_amount === 'number' ? d.vnp_amount : undefined,
      };
    } catch (error) {
      throw new Error(parseApiErrorMessage(error, 'Không tạo được liên kết VNPAY'));
    }
  },

  /** `GET /orders/vnpay-pending/{transactionPublicId}/transaction-status` — JWT. */
  async getVnpayTransactionStatus(transactionPublicId: string): Promise<VnpayTransactionStatusDto | null> {
    try {
      const { data } = await axiosInstance.get<ApiResponse<VnpayTransactionStatusDto>>(
        API_ENDPOINTS.ORDER.VNPAY_PENDING_TRANSACTION_STATUS(transactionPublicId)
      );
      if (!data.success || data.data === undefined) return null;
      return data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) return null;
      return null;
    }
  },

  /** `GET /orders/vnpay-pending/{transactionPublicId}` */
  async getVnpayPending(transactionPublicId: string): Promise<VnpayPendingDto> {
    try {
      const { data } = await axiosInstance.get<ApiResponse<VnpayPendingDto>>(
        API_ENDPOINTS.ORDER.VNPAY_PENDING(transactionPublicId)
      );
      if (!data.success || data.data === undefined) {
        throw new Error(data.message || 'Không tải được trạng thái phiên thanh toán');
      }
      return data.data;
    } catch (error) {
      throw new Error(parseApiErrorMessage(error, 'Không tải được trạng thái phiên thanh toán'));
    }
  },

  /**
   * `POST /orders/vnpay-pending/{transactionPublicId}/abandon` — không body.
   * Thành công: `data` có thể `null`. Idempotent khi đã CANCELLED.
   */
  async abandonVnpayPending(transactionPublicId: string): Promise<void> {
    try {
      const { data } = await axiosInstance.post<ApiResponse<null>>(
        API_ENDPOINTS.ORDER.VNPAY_ABANDON(transactionPublicId)
      );
      if (!data.success) {
        throw new Error(data.message || 'Không hủy được phiên thanh toán');
      }
    } catch (error) {
      throw new Error(parseApiErrorMessage(error, 'Không hủy được phiên thanh toán'));
    }
  },

  /**
   * **DEV / staging cần tường minh:** mô phỏng IPN thành công khi VNPAY không gọi được IPN tới `localhost` — JWT, không body.
   * Cần BE bật `vnpay.dev-simulate-success-enabled`. Idempotent nếu phiên đã `COMPLETED` (tài liệu: trả lại cùng đơn). `null` nếu 403/400/404 hoặc tắt tính năng.
   * @see docs/VNPAY_CHECKOUT_SESSIONS_FE_GUIDE.md §4
   */
  async devSimulateVnpaySuccess(transactionPublicId: string): Promise<CreatedOrder | null> {
    try {
      const { data } = await axiosInstance.post<ApiResponse<Record<string, unknown>>>(
        API_ENDPOINTS.ORDER.VNPAY_DEV_SIMULATE_SUCCESS(transactionPublicId),
        {}
      );
      if (!data.success || data.data == null || typeof data.data !== 'object') return null;
      const d = data.data as Record<string, unknown>;
      if (hasOrderCreatedShape(d)) return d as CreatedOrder;
      return null;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const s = error.response?.status;
        if (s === 403 || s === 400 || s === 404) return null;
      }
      return null;
    }
  },
};
