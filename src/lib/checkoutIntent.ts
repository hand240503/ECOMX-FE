import { clearPostActionReturnPath } from './postActionReturnPath';

const CHECKOUT_LINE_KEYS_STORAGE = 'ecomx_checkout_line_keys';

export function saveCheckoutLineKeys(keys: string[]): void {
  sessionStorage.setItem(CHECKOUT_LINE_KEYS_STORAGE, JSON.stringify(keys));
}

export function clearStoredCheckoutLineKeys(): void {
  sessionStorage.removeItem(CHECKOUT_LINE_KEYS_STORAGE);
}

/** Đọc key dòng giỏ đã lưu (không xóa) — dự phòng khi cần xóa giỏ sau VNPAY. */
export function peekStoredCheckoutLineKeys(): string[] {
  try {
    const raw = sessionStorage.getItem(CHECKOUT_LINE_KEYS_STORAGE);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((k): k is string => typeof k === 'string' && k.length > 0);
  } catch {
    return [];
  }
}

/** Xóa session gắn luồng checkout (khi user chủ động hủy thanh toán). */
export function abandonCheckoutSessionStorage(): void {
  clearStoredCheckoutLineKeys();
  clearPostActionReturnPath();
}

/** Đọc và xóa — dùng một lần sau login hoặc khi vào /checkout không có state. */
export function consumeCheckoutLineKeys(): string[] | null {
  const raw = sessionStorage.getItem(CHECKOUT_LINE_KEYS_STORAGE);
  sessionStorage.removeItem(CHECKOUT_LINE_KEYS_STORAGE);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed.filter((k): k is string => typeof k === 'string');
  } catch {
    return null;
  }
}
