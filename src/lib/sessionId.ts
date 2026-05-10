const SESSION_KEY = 'ecomx_session_id';

/**
 * UUID phiên analytics / gợi ý — **localStorage** để khớp docs guest + nối hành vi trước/sau login
 * (không mất khi đóng tab / khi `sessionStorage` bị xóa lúc đăng xuất).
 */
export function getOrCreateSessionId(): string {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      try {
        const legacy = sessionStorage.getItem(SESSION_KEY);
        if (legacy) {
          localStorage.setItem(SESSION_KEY, legacy);
          sessionStorage.removeItem(SESSION_KEY);
          return legacy;
        }
      } catch {
        /* ignore */
      }
      id = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return 'session-fallback';
  }
}
