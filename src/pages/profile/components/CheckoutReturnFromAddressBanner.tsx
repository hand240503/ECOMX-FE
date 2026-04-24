import { ArrowLeft } from 'lucide-react';
import { useRouteLoadingNavigation } from '../../../app/loading/useRouteLoadingNavigation';
import { useI18n } from '../../../i18n/I18nProvider';
import { cn } from '../../../lib/cn';
import { peekPostActionReturnPath } from '../../../lib/postActionReturnPath';

const CHECKOUT_PATH = '/checkout';

/** Hiện khi user vào sổ địa chỉ từ trang thanh toán (`savePostActionReturnPath('/checkout')`). */
export default function CheckoutReturnFromAddressBanner() {
  const { t } = useI18n();
  const { navigateWithLoading, isRouteLoading } = useRouteLoadingNavigation();
  const returnPath = peekPostActionReturnPath();
  if (returnPath !== CHECKOUT_PATH) return null;

  return (
    <div
      className={cn(
        'mb-4 flex flex-wrap items-center justify-between gap-3 rounded-sm border border-primary/35 bg-primary/[0.08] px-4 py-3'
      )}
    >
      <p className="m-0 text-body text-text-primary">{t('profile_address_checkout_return_hint')}</p>
      <button
        type="button"
        disabled={isRouteLoading}
        onClick={() => navigateWithLoading(CHECKOUT_PATH, { delayMs: 450 })}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-sm border-0 bg-primary px-4 py-2.5',
          'text-body font-semibold text-white transition-[filter] hover:brightness-105',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50'
        )}
      >
        <ArrowLeft className="size-4 shrink-0" strokeWidth={2} aria-hidden />
        {t('profile_address_back_to_checkout')}
      </button>
    </div>
  );
}
