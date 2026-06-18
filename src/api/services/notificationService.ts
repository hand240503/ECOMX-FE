import { axiosInstance } from '../config/axiosConfig';
import { API_ENDPOINTS } from '../config/apiEndpoints';
import type { ApiResponse } from '../types/common.types';
import type { NotificationDto } from '../types/notification.types';

export const notificationService = {
  /** `GET /notifications?limit=` — danh sách thông báo mới nhất của user hiện tại. */
  async list(limit = 20): Promise<NotificationDto[]> {
    const { data } = await axiosInstance.get<ApiResponse<NotificationDto[]>>(
      API_ENDPOINTS.NOTIFICATION.LIST,
      { params: { limit } }
    );
    return Array.isArray(data.data) ? data.data : [];
  },

  /** `GET /notifications/unread-count` — số thông báo chưa đọc. */
  async unreadCount(): Promise<number> {
    try {
      const { data } = await axiosInstance.get<ApiResponse<{ unreadCount: number }>>(
        API_ENDPOINTS.NOTIFICATION.UNREAD_COUNT
      );
      const n = data.data?.unreadCount;
      return typeof n === 'number' && Number.isFinite(n) ? n : 0;
    } catch {
      return 0;
    }
  },

  /** `POST /notifications/{id}/read`. */
  async markRead(id: number): Promise<void> {
    await axiosInstance.post(API_ENDPOINTS.NOTIFICATION.MARK_READ(id));
  },

  /** `POST /notifications/read-all`. */
  async markAllRead(): Promise<void> {
    await axiosInstance.post(API_ENDPOINTS.NOTIFICATION.MARK_ALL_READ);
  },
};
