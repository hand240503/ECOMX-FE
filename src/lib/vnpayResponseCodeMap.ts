/**
 * Mã vnp_ResponseCode theo tài liệu VNPAY (IPN / Return). Chỉ dùng cho UX; trạng thái chuẩn nên lấy từ API / poll.
 * @see docs/VNPAY_CHECKOUT_SESSIONS_FE_GUIDE.md
 */

const CODE_TO_KEY: Record<string, string> = {
  '00': 'vnpay_response_code_00',
  '07': 'vnpay_response_code_07',
  '09': 'vnpay_response_code_09',
  '10': 'vnpay_response_code_10',
  '11': 'vnpay_response_code_11',
  '12': 'vnpay_response_code_12',
  '13': 'vnpay_response_code_13',
  '24': 'vnpay_response_code_24',
  '51': 'vnpay_response_code_51',
  '65': 'vnpay_response_code_65',
  '75': 'vnpay_response_code_75',
  '79': 'vnpay_response_code_79',
  '99': 'vnpay_response_code_99',
};

export type VnpayResponseCodeTone = 'success' | 'warning' | 'error';

/**
 * Chuyển về trang checkout + popup: thanh toán **không** thành công theo URL.
 * Giữ 00 (thành công) và 07 (đã trừ tiền, nghi ngờ) trên trang callback để xử lý / poll.
 */
export function isVnpayPaymentFailedRedirectToCheckout(vnpResponseCode: string | null | undefined): boolean {
  if (vnpResponseCode == null) return false;
  const c = vnpResponseCode.trim();
  if (c === '') return false;
  if (c === '00' || c === '07') return false;
  return true;
}

export function getVnpayResponseCodeMeta(
  vnpResponseCode: string | null
): { i18nKey: string; tone: VnpayResponseCodeTone; rawCode: string; isKnown: boolean } | null {
  if (vnpResponseCode == null) return null;
  const raw = vnpResponseCode.trim();
  if (raw === '') return null;
  const isKnown = Object.prototype.hasOwnProperty.call(CODE_TO_KEY, raw);
  const i18nKey = isKnown
    ? CODE_TO_KEY[raw]!
    : 'vnpay_response_code_unlisted';
  const tone: VnpayResponseCodeTone = raw === '00' ? 'success' : raw === '07' ? 'warning' : 'error';
  return { i18nKey, tone, rawCode: raw, isKnown };
}
