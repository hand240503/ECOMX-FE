import type { CollectorLogEvent } from '../api/types/collectorLog.types';

const PREFIX = 'ecomx_cl:v1';
const memory = new Set<string>();

/** Khớp toàn bộ key dạng `ecomx_cl:v1:<event>:<productId>`. */
const STORAGE_KEY_RE = new RegExp(
  `^${PREFIX.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:(details|moreDetails|buy):(\\d+)$`
);

function key(event: CollectorLogEvent, productId: number): string {
  return `${PREFIX}:${event}:${productId}`;
}

function parseStoredValue(raw: string | null): { consumed: boolean; recordedAt: string | null } {
  if (raw == null || raw === '') return { consumed: false, recordedAt: null };
  if (raw === '1') return { consumed: true, recordedAt: null };
  try {
    const o = JSON.parse(raw) as { at?: unknown };
    if (typeof o.at === 'string') return { consumed: true, recordedAt: o.at };
  } catch {
    /* ignore */
  }
  return { consumed: true, recordedAt: null };
}

/**
 * Trả về true nếu lần đầu (theo tab + sessionStorage) cho cặp event + productId.
 * Lưu `{ "at": "<ISO-8601>" }`; bản cũ chỉ có `"1"` (không có mốc thời gian).
 */
export function tryConsumeCollectorDedup(event: CollectorLogEvent, productId: number): boolean {
  const k = key(event, productId);
  if (memory.has(k)) return false;
  try {
    const { consumed } = parseStoredValue(sessionStorage.getItem(k));
    if (consumed) {
      memory.add(k);
      return false;
    }
    sessionStorage.setItem(
      k,
      JSON.stringify({ at: new Date().toISOString() })
    );
  } catch {
    // sessionStorage không khả dụng (private mode, v.v.)
  }
  memory.add(k);
  return true;
}

/** Thời điểm lần đầu ghi nhận dedup cho cặp event + productId (`null` nếu chưa có hoặc dữ liệu cũ `"1"`). */
export function getCollectorDedupRecordedAt(
  event: CollectorLogEvent,
  productId: number
): string | null {
  const k = key(event, productId);
  try {
    return parseStoredValue(sessionStorage.getItem(k)).recordedAt;
  } catch {
    return null;
  }
}

export type CollectorDedupSnapshotEntry = {
  key: string;
  event: CollectorLogEvent;
  productId: number;
  /** ISO-8601 từ lần đầu consume; `null` nếu key cũ `"1"` hoặc parse lỗi */
  recordedAt: string | null;
};

/** Liệt kê mọi mục dedup collector trong session hiện tại (tiện export JSON / debug). */
export function getCollectorDedupSnapshotForExport(): CollectorDedupSnapshotEntry[] {
  const out: CollectorDedupSnapshotEntry[] = [];
  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const storageKey = sessionStorage.key(i);
      if (!storageKey) continue;
      const m = STORAGE_KEY_RE.exec(storageKey);
      if (!m) continue;
      const event = m[1] as CollectorLogEvent;
      const productId = Number(m[2]);
      const { recordedAt } = parseStoredValue(sessionStorage.getItem(storageKey));
      out.push({ key: storageKey, event, productId, recordedAt });
    }
  } catch {
    /* ignore */
  }
  return out.sort((a, b) => a.key.localeCompare(b.key));
}
