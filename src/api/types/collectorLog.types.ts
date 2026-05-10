export type CollectorLogEvent = 'details' | 'moreDetails' | 'buy';

export interface CreateCollectorLogRequest {
  event: CollectorLogEvent;
  sessionId?: string;
  deviceType?: string;
  platform?: string;
  metadata?: string;
  ipAddress?: string;
  timestamp?: string;
  productId?: number;
  userId?: number;
}
