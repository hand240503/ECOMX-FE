/** Giá VNĐ — dùng thống nhất PDP / card (UI.md §6.2). Luôn là số nguyên, không hiển thị thập phân. */
export function formatPrice(amount: number): string {
  const n = Math.round(Number.isFinite(amount) ? amount : 0);
  return `${n.toLocaleString('vi-VN')} ₫`;
}

/** Ví dụ: 1200 → "1.2k" cho badge đã bán */
export function formatShortCount(n: number): string {
  if (!Number.isFinite(n) || n < 0) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(Math.floor(n));
}
