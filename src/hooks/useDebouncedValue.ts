import { useEffect, useState } from 'react';

/** Giá trị `value` sau khi ngừng thay đổi trong `delayMs` ms (debounce). */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}
