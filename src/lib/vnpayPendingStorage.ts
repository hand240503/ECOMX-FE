const STORAGE_KEY = 'ecomx_vnpay_pending_ctx';

export type VnpayPendingClientContext = {
  transactionPublicId: string;
  /** `productId-unitId` — dùng xóa giỏ khi thanh toán thành công */
  lineKeys: string[];
};

export function saveVnpayPendingContext(ctx: VnpayPendingClientContext): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ctx));
  } catch {
    // ignore
  }
}

export function readVnpayPendingContext(): VnpayPendingClientContext | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (parsed == null || typeof parsed !== 'object') return null;
    const o = parsed as Record<string, unknown>;
    const transactionPublicId =
      typeof o.transactionPublicId === 'string' && o.transactionPublicId.trim() !== ''
        ? o.transactionPublicId.trim()
        : '';
    const lineKeys = Array.isArray(o.lineKeys)
      ? o.lineKeys.filter((k): k is string => typeof k === 'string' && k.length > 0)
      : [];
    if (!transactionPublicId) return null;
    return { transactionPublicId, lineKeys };
  } catch {
    return null;
  }
}

export function clearVnpayPendingContext(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
