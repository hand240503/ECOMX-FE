/** Nhận diện COD / thu tiền khi nhận — dùng chọn PTTT mặc định trên checkout. */
function normalizePaymentMethodCode(code: string | undefined): string {
  if (code == null || String(code).trim() === '') return '';
  return String(code)
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
}

export function isCodPaymentMethod(code: string | undefined): boolean {
  const u = normalizePaymentMethodCode(code);
  if (u === '') return false;

  if (u === 'COD' || u.startsWith('COD_')) return true;

  return new Set([
    'CASH_ON_DELIVERY',
    'THU_TIEN_KHI_NHAN_HANG',
    'THU_TIEN_KHI_NHAN',
    'GIAO_HANG_THU_TIEN',
    'GH_CN',
    'PAY_ON_DELIVERY',
    'POD',
  ]).has(u);
}
