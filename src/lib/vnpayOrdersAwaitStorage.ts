const STORAGE_KEY = 'ecomx_vnpay_orders_await';

export type VnpayOrdersAwaitPayload = {
  transactionPublicId: string;
  lineKeys: string[];
};

export function setVnpayOrdersAwaitPayload(payload: VnpayOrdersAwaitPayload): void {
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        transactionPublicId: payload.transactionPublicId,
        lineKeys: payload.lineKeys,
      })
    );
  } catch {
    // ignore
  }
}

export function readVnpayOrdersAwaitPayload(): VnpayOrdersAwaitPayload | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as unknown;
    if (o == null || typeof o !== 'object') return null;
    const tid = (o as { transactionPublicId?: unknown }).transactionPublicId;
    const lineKeys = (o as { lineKeys?: unknown }).lineKeys;
    if (typeof tid !== 'string' || tid.trim() === '') return null;
    const keys = Array.isArray(lineKeys) ? lineKeys.filter((k): k is string => typeof k === 'string') : [];
    return { transactionPublicId: tid.trim(), lineKeys: keys };
  } catch {
    return null;
  }
}

export function clearVnpayOrdersAwaitPayload(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
