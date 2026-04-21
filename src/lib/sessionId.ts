const SESSION_KEY = 'ecomx_session_id';

export function getOrCreateSessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return 'session-fallback';
  }
}
