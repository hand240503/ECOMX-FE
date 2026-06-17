/**
 * Cửa sổ thời gian tối đa FE poll trạng thái phiên VNPAY trước khi DỪNG.
 * Khớp với `vnpay.reconcile-window-seconds` của BE (~2 phút): sau khoảng này
 * BE cũng ngừng gọi querydr nên FE không cần poll vô hạn.
 */
export const VNPAY_POLL_MAX_MS = 120_000;
