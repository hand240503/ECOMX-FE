import { useMemo } from 'react';
import { cn } from '../../lib/cn';
import { getVnpayResponseCodeMeta } from '../../lib/vnpayResponseCodeMap';

type Props = {
  vnpResponseCode: string | null;
  t: (key: string) => string;
  className?: string;
};

/**
 * Hiển thị ý nghĩa vnp_ResponseCode từ query URL (VNPAY Return). Chỉ hỗ trợ UX; nguồn chuẩn: IPN + API poll.
 */
export function VnpayUrlResponseBanner({ vnpResponseCode, t, className }: Props) {
  const meta = useMemo(() => getVnpayResponseCodeMeta(vnpResponseCode), [vnpResponseCode]);
  if (!meta) return null;

  const body = meta.isKnown
    ? t(meta.i18nKey)
    : t(meta.i18nKey).replace(/\{code\}/g, meta.rawCode);

  return (
    <div
      className={cn(
        'rounded-md border p-4',
        meta.tone === 'success' && 'border-emerald-300 bg-emerald-50/90 text-emerald-950',
        meta.tone === 'warning' && 'border-amber-300 bg-amber-50 text-amber-950',
        meta.tone === 'error' && 'border-border bg-surface',
        className
      )}
      role="status"
    >
      <p className="m-0 text-caption font-medium text-text-secondary">{t('vnpay_callback_url_param_title')}</p>
      <p className="m-0 mt-2 text-body leading-relaxed text-text-primary">{body}</p>
      <p className="m-0 mt-1.5 text-caption text-text-secondary">{t('vnpay_callback_url_param_hint')}</p>
    </div>
  );
}
