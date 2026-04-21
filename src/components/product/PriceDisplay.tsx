import { cn } from '../../lib/cn';

type PriceDisplayProps = {
  formattedCurrent: string;
  formattedOld?: string | null;
  /** Ví dụ: "Giảm 12%" — từ i18n ở page */
  discountBadgeText?: string | null;
  /** `neutral` — giá đậm đen kiểu marketplace; `promo` — giá đỏ (mặc định) */
  tone?: 'promo' | 'neutral';
  className?: string;
};

export function PriceDisplay({
  formattedCurrent,
  formattedOld,
  discountBadgeText,
  tone = 'promo',
  className,
}: PriceDisplayProps) {
  const showOld = Boolean(formattedOld);
  const showBadge = Boolean(discountBadgeText?.trim());

  return (
    <div className={cn('flex flex-wrap items-baseline gap-2.5', className)}>
      <span
        className={cn(
          'text-[1.65rem] font-bold leading-none tracking-tight tablet:text-[1.75rem]',
          tone === 'neutral' ? 'text-text-primary' : 'text-danger'
        )}
      >
        {formattedCurrent}
      </span>
      {showOld && (
        <span className="text-body text-text-secondary line-through decoration-border">
          {formattedOld}
        </span>
      )}
      {showBadge && (
        <span className="rounded-md bg-danger px-2 py-0.5 text-caption font-bold uppercase tracking-wide text-white shadow-sm">
          {discountBadgeText}
        </span>
      )}
    </div>
  );
}
