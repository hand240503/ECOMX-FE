import { clearCartStorage } from './cartStorage';
import { clearSearchHistory } from './searchHistory';
import { storage } from '../utils/storage';

/** Bắn sau khi xóa giỏ / session liên quan đăng xuất để `CartProvider` đồng bộ state (cùng tab không nhận `StorageEvent`). */
export const LOGOUT_STORAGE_CLEANUP_EVENT = 'ecomx:logout-storage-cleanup';

/**
 * Xóa dữ liệu gắn phiên/người dùng trên trình duyệt khi đăng xuất (ngoài token/user đã xử lý trong `tokenStorage.clear()`).
 */
export function clearClientStorageOnLogout(): void {
  try {
    sessionStorage.clear();
  } catch {
    /* ignore */
  }
  clearSearchHistory();
  clearCartStorage();
  storage.clear();
  window.dispatchEvent(new Event(LOGOUT_STORAGE_CLEANUP_EVENT));
}
