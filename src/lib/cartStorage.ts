/**
 * Giỏ hàng guest / client — lưu `localStorage` (theo thiết bị & trình duyệt).
 * Đồng bộ đa tab qua sự kiện `storage` (xử lý ở CartProvider).
 * Mỗi dòng có `addedAt` (ISO-8601): thời điểm **lần đầu** mặt hàng (product+unit) được thêm vào giỏ; cộng số lượng sau đó **không** đổi `addedAt`.
 */

export const CART_STORAGE_KEY = 'ecomx_cart';

const SCHEMA_VERSION = 1 as const;

export type CartLine = {
  productId: number;
  productName: string;
  thumbnailUrl: string | null;
  unitId: number;
  unitName: string;
  /** Đơn giá snapshot (VNĐ) */
  unitPrice: number;
  quantity: number;
  /** Lần đầu thêm dòng này vào giỏ — chuỗi ISO-8601 (UTC). */
  addedAt: string;
};

export function cartLineKey(line: { productId: number; unitId: number }): string {
  return `${line.productId}-${line.unitId}`;
}

export function parseCartLineKey(key: string): { productId: number; unitId: number } | null {
  const m = /^(\d+)-(\d+)$/.exec(key);
  if (!m) return null;
  return { productId: Number(m[1]), unitId: Number(m[2]) };
}

type StoredCart = {
  schema: typeof SCHEMA_VERSION;
  lines: CartLine[];
};

function clampQty(n: number): number {
  if (!Number.isFinite(n)) return 1;
  return Math.min(999, Math.max(1, Math.floor(n)));
}

function normalizeLine(entry: unknown): CartLine | null {
  if (!entry || typeof entry !== 'object') return null;
  const e = entry as Record<string, unknown>;
  const productId = Number(e.productId);
  if (!Number.isFinite(productId) || productId <= 0) return null;

  const unitId = Number(e.unitId);
  if (!Number.isFinite(unitId)) return null;

  const productName = typeof e.productName === 'string' ? e.productName.trim() : '';
  const unitName = typeof e.unitName === 'string' ? e.unitName.trim() : '';
  if (!productName || !unitName) return null;

  const unitPrice = Number(e.unitPrice);
  if (!Number.isFinite(unitPrice) || unitPrice < 0) return null;

  const quantity = clampQty(Number(e.quantity));
  const thumbnailUrl =
    e.thumbnailUrl === null || e.thumbnailUrl === undefined
      ? null
      : typeof e.thumbnailUrl === 'string'
        ? e.thumbnailUrl.trim() || null
        : null;

  const addedAt =
    typeof e.addedAt === 'string' && e.addedAt.trim() !== '' ? e.addedAt : new Date().toISOString();

  return {
    productId,
    productName,
    thumbnailUrl,
    unitId,
    unitName,
    unitPrice: Math.round(unitPrice),
    quantity,
    addedAt
  };
}

export function parseCartFromStorage(raw: string | null): CartLine[] {
  if (raw == null || raw === '') return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return [];
    const o = parsed as StoredCart;
    if (o.schema !== SCHEMA_VERSION || !Array.isArray(o.lines)) return [];
    return o.lines.map(normalizeLine).filter((l): l is CartLine => l != null);
  } catch {
    return [];
  }
}

export function loadCartLines(): CartLine[] {
  if (typeof window === 'undefined') return [];
  return parseCartFromStorage(window.localStorage.getItem(CART_STORAGE_KEY));
}

export function saveCartLines(lines: CartLine[]): void {
  if (typeof window === 'undefined') return;
  const payload: StoredCart = { schema: SCHEMA_VERSION, lines };
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(payload));
}

export function clearCartStorage(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(CART_STORAGE_KEY);
}

export function totalQuantityInCart(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.quantity, 0);
}

export type CartLineInput = {
  productId: number;
  productName: string;
  thumbnailUrl: string | null;
  unitId: number;
  unitName: string;
  unitPrice: number;
  quantity: number;
  /** Tùy chọn — nếu hợp lệ sẽ dùng thay thời điểm mặc định khi tạo dòng mới. */
  addedAt?: string;
};

function coalesceAddedAt(explicit: string | undefined, fallback: string): string {
  if (explicit == null || explicit.trim() === '') return fallback;
  const t = Date.parse(explicit);
  if (Number.isNaN(t)) return fallback;
  return new Date(t).toISOString();
}

/** Cùng `productId` + `unitId` → cộng dồn số lượng (giới hạn 999 / dòng). `addedAt` giữ từ lần thêm đầu tiên. */
export function mergeCartLine(lines: CartLine[], incoming: CartLineInput): CartLine[] {
  const addQty = clampQty(incoming.quantity);
  const now = new Date().toISOString();
  const idx = lines.findIndex((l) => l.productId === incoming.productId && l.unitId === incoming.unitId);

  if (idx >= 0) {
    const next = [...lines];
    const cur = next[idx]!;
    const mergedQty = clampQty(cur.quantity + addQty);
    next[idx] = {
      ...cur,
      quantity: mergedQty,
      unitPrice: Math.round(incoming.unitPrice),
      productName: incoming.productName,
      thumbnailUrl: incoming.thumbnailUrl,
      unitName: incoming.unitName
      // addedAt không đổi khi chỉ tăng số lượng
    };
    return next;
  }

  return [
    ...lines,
    {
      productId: incoming.productId,
      productName: incoming.productName,
      thumbnailUrl: incoming.thumbnailUrl,
      unitId: incoming.unitId,
      unitName: incoming.unitName,
      unitPrice: Math.round(incoming.unitPrice),
      quantity: addQty,
      addedAt: coalesceAddedAt(incoming.addedAt, now)
    }
  ];
}

export function setLineQuantity(lines: CartLine[], productId: number, unitId: number, quantity: number): CartLine[] {
  const q = clampQty(quantity);
  return lines
    .map((l) =>
      l.productId === productId && l.unitId === unitId ? { ...l, quantity: q } : l
    )
    .filter((l) => l.quantity > 0);
}

export function removeCartLine(lines: CartLine[], productId: number, unitId: number): CartLine[] {
  return lines.filter((l) => !(l.productId === productId && l.unitId === unitId));
}

export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
}
