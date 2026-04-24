const STORAGE_KEY = 'ecomx_post_action_return_path';
const MAX_AGE_MS = 30 * 60 * 1000;

type Stored = { path: string; savedAt: number };

/** Chỉ cho phép path nội bộ (tránh open redirect). */
export function isSafeInternalPath(path: string): boolean {
  const p = path.trim();
  if (p === '' || !p.startsWith('/') || p.startsWith('//')) return false;
  return true;
}

function parseStored(raw: string): string | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object' && 'path' in parsed && 'savedAt' in parsed) {
      const rec = parsed as Stored;
      if (typeof rec.path !== 'string' || typeof rec.savedAt !== 'number') return null;
      if (!isSafeInternalPath(rec.path)) return null;
      if (Date.now() - rec.savedAt > MAX_AGE_MS) return null;
      return rec.path;
    }
  } catch {
    /* ignore */
  }
  if (isSafeInternalPath(raw)) return raw.trim();
  return null;
}

/**
 * Lưu path để sau thao tác (vd. lưu địa chỉ) có thể `consumePostActionReturnPath()` và điều hướng.
 * Ghi đè mỗi lần gọi; hết hạn sau ~30 phút.
 */
export function savePostActionReturnPath(path: string): void {
  if (!isSafeInternalPath(path)) return;
  const payload: Stored = { path: path.trim(), savedAt: Date.now() };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function peekPostActionReturnPath(): string | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (raw == null || raw === '') return null;
  const path = parseStored(raw);
  if (path == null) sessionStorage.removeItem(STORAGE_KEY);
  return path;
}

/** Đọc và xóa — gọi một lần khi hoàn tất thao tác (vd. sau API lưu địa chỉ thành công). */
export function consumePostActionReturnPath(): string | null {
  const path = peekPostActionReturnPath();
  sessionStorage.removeItem(STORAGE_KEY);
  return path;
}

export function clearPostActionReturnPath(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}
