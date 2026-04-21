const STORAGE_KEY = 'search_history';
const MAX_ITEMS = 8;

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

export function readSearchHistory(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === 'string' && x.trim() !== '');
  } catch {
    return [];
  }
}

export function pushSearchHistory(query: string): void {
  const q = query.trim();
  if (!q) return;
  const prev = readSearchHistory();
  const next = [q, ...prev.filter((x) => normalize(x) !== normalize(q))].slice(0, MAX_ITEMS);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota */
  }
}

export function clearSearchHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
