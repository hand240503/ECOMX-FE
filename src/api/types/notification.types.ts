/** Thông báo gửi tới user. Ánh xạ từ `NotificationResponse` (BE). */
export interface NotificationDto {
  id: number;
  title: string;
  message: string | null;
  /** ORDER_STATUS | RETURN_REFUND | PAYMENT */
  type: string | null;
  /** Đơn hàng liên quan (để điều hướng). */
  orderId: number | null;
  isRead: boolean;
  createdDate: string;
}
