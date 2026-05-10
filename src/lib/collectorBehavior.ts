import { collectorLogService } from '../api/services/collectorLogService';
import type { UserInfo } from '../api/types/auth.types';
import type { CreateCollectorLogRequest } from '../api/types/collectorLog.types';
import { tokenStorage } from '../utils/tokenStorage';
import { getOrCreateSessionId } from './sessionId';
import { getCollectorDedupSnapshotForExport, tryConsumeCollectorDedup } from './collectorLogDedup';

export {
  getCollectorDedupRecordedAt,
  getCollectorDedupSnapshotForExport,
  type CollectorDedupSnapshotEntry
} from './collectorLogDedup';

function deviceTypeLabel(): string {
  if (typeof window === 'undefined' || !window.matchMedia) return 'desktop';
  return window.matchMedia('(max-width: 767px)').matches ? 'mobile' : 'desktop';
}

function basePayload(productId: number): Omit<CreateCollectorLogRequest, 'event' | 'metadata'> {
  const user = tokenStorage.getUser<UserInfo>();
  return {
    sessionId: getOrCreateSessionId(),
    deviceType: deviceTypeLabel(),
    platform: 'web',
    productId,
    ...(user?.id != null ? { userId: user.id } : {}),
  };
}

function sendQuiet(body: CreateCollectorLogRequest): void {
  void collectorLogService.create(body).catch(() => {});
}

/** Mở / xem trang chi tiết sản phẩm — tối đa một lần mỗi productId mỗi phiên tab. */
export function reportCollectorProductDetailsOnce(productId: number): void {
  if (!tryConsumeCollectorDedup('details', productId)) return;
  sendQuiet({ event: 'details', ...basePayload(productId) });
}

export type CollectorMoreDetailsSource = 'scroll' | 'add_to_cart';

/** Cuộn trang chi tiết hoặc thêm giỏ — chung một slot moreDetails / sản phẩm. */
export function reportCollectorProductMoreDetailsOnce(
  productId: number,
  source: CollectorMoreDetailsSource
): void {
  if (!tryConsumeCollectorDedup('moreDetails', productId)) return;
  sendQuiet({
    event: 'moreDetails',
    ...basePayload(productId),
    metadata: JSON.stringify({ source }),
  });
}

/** User bấm đặt hàng / thanh toán trên trang checkout — tối đa một lần buy / sản phẩm / phiên tab. */
export function reportCollectorBuyOnce(productId: number): void {
  if (!tryConsumeCollectorDedup('buy', productId)) return;
  sendQuiet({ event: 'buy', ...basePayload(productId) });
}

export function reportCollectorBuyOnceForLines(lines: readonly { productId: number }[]): void {
  const seen = new Set<number>();
  for (const line of lines) {
    if (seen.has(line.productId)) continue;
    seen.add(line.productId);
    reportCollectorBuyOnce(line.productId);
  }
}

/**
 * Gom mọi mục dedup trong `sessionStorage` thành danh sách body sẵn sàng cho API của bạn
 * (cùng cấu trúc `CreateCollectorLogRequest` / POST `collector-logs` trong docs).
 *
 * **Không** gọi mạng — chỉ build mảng để bạn tự `fetch` / gửi tới URL tùy chỉnh.
 *
 * ### Format mỗi phần tử (ví dụ)
 * ```json
 * {
 *   "event": "details",
 *   "sessionId": "8f3e…",
 *   "deviceType": "desktop",
 *   "platform": "web",
 *   "productId": 72,
 *   "userId": 42,
 *   "timestamp": "2026-05-03T10:15:30.123Z"
 * }
 * ```
 *
 * - `timestamp`: từ lần ghi dedup trên client; có thể `undefined` nếu value cũ là `"1"`.
 * - `moreDetails`: có thêm `metadata` (không còn biết scroll vs add_to_cart từ snapshot).
 */
export function aggregateCollectorDedupEvents(): CreateCollectorLogRequest[] {
  return getCollectorDedupSnapshotForExport().map((entry) => {
    const row: CreateCollectorLogRequest = {
      event: entry.event,
      ...basePayload(entry.productId),
      ...(entry.recordedAt != null ? { timestamp: entry.recordedAt } : {}),
    };
    if (entry.event === 'moreDetails') {
      row.metadata = JSON.stringify({ fromDedupSnapshot: true });
    }
    return row;
  });
}
