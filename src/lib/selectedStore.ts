/**
 * Kho (store) mà khách đang chọn — lưu ở localStorage để dùng chung giữa header,
 * trang địa chỉ và checkout (tính phí ship theo kho đang chọn).
 */
const KEY = 'ecomx_selected_store_id';
export const SELECTED_STORE_EVENT = 'ecomx:selected-store-changed';

export function getSelectedStoreId(): number | null {
  try {
    const v = localStorage.getItem(KEY);
    const n = v ? Number(v) : NaN;
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

export function setSelectedStoreId(id: number | null): void {
  try {
    if (id == null) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, String(id));
    window.dispatchEvent(new CustomEvent(SELECTED_STORE_EVENT, { detail: id }));
  } catch {
    /* ignore */
  }
}
