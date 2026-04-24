const STORAGE_KEY = 'ecomx_checkout_vnpay_fail';

/** Gắn cờ để CheckoutPage hiện popup một lần (sau redirect từ VnpayCallback). */
export function setVnpayCheckoutFailureFlag(code: string): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ code: code.trim() }));
  } catch {
    // ignore
  }
}

/** Đọc và xóa — gọi một lần khi vào checkout. */
export function consumeVnpayCheckoutFailure(): { code: string } | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(STORAGE_KEY);
    const o = JSON.parse(raw) as unknown;
    if (o == null || typeof o !== 'object') return null;
    const code = (o as { code?: unknown }).code;
    if (typeof code === 'string' && code.trim() !== '') return { code: code.trim() };
  } catch {
    // ignore
  }
  return null;
}
