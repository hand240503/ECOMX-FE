import { CreditCard, Headphones, RotateCcw, Truck, type LucideIcon } from 'lucide-react';
import { useId } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { cn } from '../../lib/cn';

type HighlightItem = {
  Icon: LucideIcon;
  titleKey: string;
  subtitleKey: string;
};

const ITEMS: HighlightItem[] = [
  { Icon: Truck, titleKey: 'home_service_delivery_title', subtitleKey: 'home_service_delivery_sub' },
  { Icon: RotateCcw, titleKey: 'home_service_returns_title', subtitleKey: 'home_service_returns_sub' },
  { Icon: CreditCard, titleKey: 'home_service_payment_title', subtitleKey: 'home_service_payment_sub' },
  { Icon: Headphones, titleKey: 'home_service_support_title', subtitleKey: 'home_service_support_sub' },
];

/**
 * Khối cam kết (tiêu đề + banner icon skew) — đặt dưới gợi ý sản phẩm trang chủ.
 */
export function ServiceHighlights({ className }: { className?: string }) {
  const { t } = useI18n();
  const headingId = useId();

  return (
    <section className={cn('mt-4', className)} aria-labelledby={headingId}>
      <div className="bg-background py-8 text-center tablet:py-10">
        <p className="m-0 text-sm font-bold leading-snug text-text-primary tablet:text-base">
          {t('home_commitment_experience_prefix')}{' '}
          <span className="font-bold text-[#E74C4C]">{t('home_commitment_brand')}</span>
        </p>
        <h2
          id={headingId}
          className="m-0 mt-3 text-xl font-bold leading-tight tracking-tight tablet:mt-4 tablet:text-2xl"
        >
          <span className="text-text-primary">{t('home_commitment_title_black')}</span>{' '}
          <span className="text-[#FF7A00]">{t('home_commitment_title_accent')}</span>
        </h2>
      </div>

      <div
        className={cn(
          'mt-4 flex w-full flex-wrap items-end justify-between gap-[16px]',
          'bg-white border border-[#ECECEC] rounded-[12px]',
          'p-3 skew-x-[-3deg] md:skew-x-[-10deg] md:p-7 min-[1620px]:p-[38px]',
          'overflow-hidden'
        )}
        aria-describedby={headingId}
      >
        <ul className="contents m-0 list-none p-0">
          {ITEMS.map(({ Icon, titleKey, subtitleKey }) => (
            <li
              key={titleKey}
              className="box-border flex min-w-0 w-[calc(50%-8px)] flex-col items-center text-center skew-x-[3deg] md:w-[calc(25%-12px)] md:skew-x-[10deg]"
            >
              <span className="inline-flex items-center justify-center rounded-full bg-danger/10 p-1.5 text-danger">
                <Icon className="h-10 w-10" strokeWidth={2} aria-hidden />
              </span>
              <p
                className={cn(
                  'm-[8px_0_4px] text-[12px] font-bold uppercase leading-snug tracking-wide text-text-primary',
                  'min-[386px]:text-[13px] sm:text-[15px] min-[1620px]:mt-[12px] min-[1620px]:text-[17px]'
                )}
              >
                {t(titleKey)}
              </p>
              <p className="mt-1.5 m-0 max-w-[11.5rem] text-[0.65rem] leading-snug text-text-secondary tablet:text-caption">
                {t(subtitleKey)}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
