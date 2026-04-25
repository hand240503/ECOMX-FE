/**
 * Giỏ hàng guest / client — lưu `localStorage` (theo thiết bị & trình duyệt).
 * Chỉ lưu productId, unitId, quantity, addedAt. Giá/ảnh/tên sản phẩm lấy từ API (by-ids) khi xem /cart, checkout, v.v.
 * Đồng bộ đa tab qua sự kiện `storage` (xử lý ở CartProvider).
 * Mỗi dòng có `addedAt` (ISO-8601): thời điểm **lần đầu** mặt hàng (product+unit) được thêm vào giỏ; cộng số lượng sau đó **không** đổi `addedAt`.
 */

export const CART_STORAGE_KEY = 'ecomx_cart';

const SCHEMA_VERSION = 2 as const;
/** Legacy — migrate sang schema 2 (bỏ snapshot giá/tên) khi load. */
const LEGACY_SCHEMA_VERSION = 1 as const;

export type CartLine = {
  productId: number;
  unitId: number;
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

type StoredCartV2 = {
  schema: typeof SCHEMA_VERSION;
  lines: CartLine[];
};

function clampQty(n: number): number {
  if (!Number.isFinite(n)) return 1;
  return Math.min(999, Math.max(1, Math.floor(n)));
}

function normalizeLineV2(entry: unknown): CartLine | null {
  if (!entry || typeof entry !== 'object') return null;
  const e = entry as Record<string, unknown>;
  const productId = Number(e.productId);
  if (!Number.isFinite(productId) || productId <= 0) return null;

  const unitId = Number(e.unitId);
  if (!Number.isFinite(unitId)) return null;

  const quantity = clampQty(Number(e.quantity));
  const addedAt =
    typeof e.addedAt === 'string' && e.addedAt.trim() !== '' ? e.addedAt : new Date().toISOString();

  return { productId, unitId, quantity, addedAt };
}

/** Đọc bản cũ (schema 1) — giữ bất kỳ dòng hợp lệ nào về `productId`/`unitId`/`quantity`/`addedAt`. */
function normalizeLineV1ToV2(entry: unknown): CartLine | null {
  return normalizeLineV2(entry);
}

export function parseCartFromStorage(raw: string | null): CartLine[] {
  if (raw == null || raw === '') return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return [];
    const o = parsed as { schema?: number; lines?: unknown[] };
    if (!Array.isArray(o.lines)) return [];
    if (o.schema === SCHEMA_VERSION) {
      return o.lines.map(normalizeLineV2).filter((l): l is CartLine => l != null);
    }
    if (o.schema === LEGACY_SCHEMA_VERSION) {
      return o.lines.map(normalizeLineV1ToV2).filter((l): l is CartLine => l != null);
    }
    return [];
  } catch {
    return [];
  }
}

export function loadCartLines(): CartLine[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(CART_STORAGE_KEY);
  const lines = parseCartFromStorage(raw);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { schema?: number };
      if (parsed?.schema === LEGACY_SCHEMA_VERSION) {
        saveCartLines(lines);
      }
    } catch {
      // ignore
    }
  }
  return lines;
}

export function saveCartLines(lines: CartLine[]): void {
  if (typeof window === 'undefined') return;
  const payload: StoredCartV2 = { schema: SCHEMA_VERSION, lines };
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(payload));
}

export function clearCartStorage(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(CART_STORAGE_KEY);
}

export function totalQuantityInCart(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.quantity, 0);
}

/**
 * Khi thêm từ PDP có thể gửi thêm tên/ảnh/giá (UI tức thì); không ghi xuống storage.
 */
export type CartLineInput = {
  productId: number;
  unitId: number;
  quantity: number;
  productName?: string;
  thumbnailUrl?: string | null;
  unitName?: string;
  unitPrice?: number;
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
    next[idx] = { ...cur, quantity: mergedQty };
    return next;
  }

  return [
    ...lines,
    {
      productId: incoming.productId,
      unitId: incoming.unitId,
      quantity: addQty,
      addedAt: coalesceAddedAt(incoming.addedAt, now)
    }
  ];
}

export function setLineQuantity(
  lines: CartLine[],
  productId: number,
  unitId: number,
  quantity: number
): CartLine[] {
  const q = clampQty(quantity);
  return lines
    .map((l) => (l.productId === productId && l.unitId === unitId ? { ...l, quantity: q } : l))
    .filter((l) => l.quantity > 0);
}

export function removeCartLine(lines: CartLine[], productId: number, unitId: number): CartLine[] {
  return lines.filter((l) => !(l.productId === productId && l.unitId === unitId));
}

/** Tổng tiền không tính được từ storage — dùng giá từ API. Luôn 0. */
export function cartSubtotal(_lines: CartLine[]): number {
  return 0;
}
