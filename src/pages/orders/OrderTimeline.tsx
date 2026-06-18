import { format, isValid, parseISO } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import { Check, Package, ClipboardCheck, Truck, Star, XCircle, MapPin, RotateCcw } from 'lucide-react';
import type { ReactNode } from 'react';
import type { OrderTimelineStep } from '../../api/types/order.types';
import { cn } from '../../lib/cn';
import { useI18n } from '../../i18n/I18nProvider';
import type { Lang } from '../../utils/i18n';

// ─── helpers ─────────────────────────────────────────────────────────────────

const localeByLang: Record<Lang, typeof vi> = { vi, en: enUS };

function fmtTimestamp(iso: string | null | undefined, lang: Lang): string {
  if (!iso) return '';
  const d = parseISO(iso);
  if (!isValid(d)) return '';
  return format(d, 'HH:mm dd/MM', { locale: localeByLang[lang] });
}

// ─── icon per step index ──────────────────────────────────────────────────────

function StepIcon({
  stepIndex,
  statusCode,
  label,
  completed,
  current,
  cancelled,
}: {
  stepIndex: number;
  statusCode: number | null;
  label: string;
  completed: boolean;
  current: boolean;
  cancelled: boolean;
}) {
  const iconProps = { className: 'size-4 shrink-0', strokeWidth: 2, 'aria-hidden': true };

  // Bước virtual (statusCode=null): Trả hàng (mũi tên hoàn) hoặc Đánh giá (sao)
  if (statusCode === null) {
    return /trả|return|hoàn/i.test(label) ? <RotateCcw {...iconProps} /> : <Star {...iconProps} />;
  }
  // Bước Hủy
  if (cancelled && statusCode === 5) return <XCircle {...iconProps} />;

  // Bước đã qua → dấu check
  if (completed && !current) return <Check {...iconProps} />;

  // icon theo bước
  if (stepIndex === 1) return <Package {...iconProps} />;
  if (stepIndex === 2) return <ClipboardCheck {...iconProps} />;
  if (stepIndex === 3) return <Truck {...iconProps} />;
  if (stepIndex === 4) return <MapPin {...iconProps} />;
  return <Star {...iconProps} />;
}

// ─── single step ─────────────────────────────────────────────────────────────

function TimelineStepNode({
  step,
  isLast,
  cancelled,
  t,
  lang,
}: {
  step: OrderTimelineStep;
  isLast: boolean;
  cancelled: boolean;
  t: (key: string) => string;
  lang: Lang;
}) {
  const { completed, current, statusCode } = step;
  const isCancelledStep = cancelled && statusCode === 5;
  const isVirtual = statusCode === null; // "Đánh giá"

  // ── màu vòng tròn ────────────────────────────────────────────────
  const circleClass = cn(
    'relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
    current && isCancelledStep
      ? 'border-danger bg-danger text-white'
      : current
        ? 'border-primary bg-primary text-white shadow-md shadow-primary/30'
        : completed && isCancelledStep
          ? 'border-danger bg-danger/10 text-danger'
          : completed
            ? 'border-primary bg-primary/10 text-primary'
            : 'border-border bg-background text-text-disabled'
  );

  // ── màu label ────────────────────────────────────────────────────
  const labelClass = cn(
    'mt-2 text-center text-[11px] leading-snug font-medium',
    current && isCancelledStep
      ? 'text-danger'
      : current
        ? 'text-primary'
        : completed && isCancelledStep
          ? 'text-danger/80'
          : completed
            ? 'text-text-primary'
            : 'text-text-disabled'
  );

  // ── màu connector line ───────────────────────────────────────────
  const lineClass = cn(
    'absolute top-[17px] left-[calc(50%+18px)] h-0.5 w-[calc(100%-36px)]',
    completed && !current ? 'bg-primary' : 'bg-border'
  );

  const timestamp = fmtTimestamp(step.timestamp, lang);

  const actorName =
    step.updatedByFullName?.trim() ||
    step.updatedByUsername?.trim() ||
    null;

  return (
    <li className={cn('relative flex min-w-[72px] flex-1 flex-col items-center px-1', isLast && 'flex-none')}>
      {/* connector line — không vẽ ở bước cuối */}
      {!isLast && <div className={lineClass} aria-hidden />}

      {/* circle */}
      <div className={circleClass}>
        <StepIcon
          stepIndex={step.stepIndex}
          statusCode={statusCode}
          label={step.statusLabel}
          completed={completed}
          current={current}
          cancelled={cancelled}
        />
      </div>

      {/* label */}
      <p className={labelClass}>{step.statusLabel}</p>

      {/* timestamp */}
      {timestamp ? (
        <p className="mt-0.5 text-center text-[10px] leading-none text-text-secondary tabular-nums">
          {timestamp}
        </p>
      ) : null}

      {/* actor name — chỉ hiện khi bước đã completed & có người update */}
      {completed && actorName && !isVirtual ? (
        <p
          className="mt-0.5 max-w-[80px] truncate text-center text-[10px] leading-none text-text-disabled"
          title={t('orders_timeline_updated_by').replace('{name}', actorName)}
        >
          {actorName}
        </p>
      ) : null}
    </li>
  );
}

// ─── public component ─────────────────────────────────────────────────────────

export type OrderTimelineProps = {
  steps: OrderTimelineStep[];
  currentStatus: number;
  /** Extra className cho container ngoài cùng */
  className?: string;
  /** Render skeleton thay vì steps */
  loading?: boolean;
  /** Skeleton slot riêng (nếu muốn override) */
  skeleton?: ReactNode;
};

/**
 * Thanh tiến trình đơn hàng dạng stepper ngang.
 *
 * - Cuộn ngang trên mobile (overflow-x: auto).
 * - Responsive: trên màn rộng căn đều các bước.
 * - Màu primary (#green) cho completed/current, danger cho hủy, xám cho chưa đạt.
 */
export function OrderTimeline({
  steps,
  currentStatus,
  className,
  loading = false,
  skeleton,
}: OrderTimelineProps) {
  const { t, lang } = useI18n();
  const cancelled = currentStatus === 5;

  if (loading) {
    if (skeleton) return <>{skeleton}</>;
    return (
      <div className={cn('px-4 py-4 tablet:px-6', className)} aria-busy="true" aria-label={t('orders_timeline_loading')}>
        <div className="mb-3 h-4 w-36 animate-pulse rounded bg-border" />
        <div className="flex items-start gap-0 overflow-x-auto pb-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1 px-1">
              <div className="size-9 animate-pulse rounded-full bg-border" />
              <div className="h-3 w-14 animate-pulse rounded bg-border" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!steps.length) return null;

  return (
    <div className={cn('px-4 py-4 tablet:px-6', className)}>
      <p className="mb-3 text-caption font-semibold uppercase tracking-wide text-text-secondary">
        {t('orders_timeline_title')}
      </p>
      {/* overflow-x: auto để scroll ngang trên mobile */}
      <div className="overflow-x-auto pb-1" role="list" aria-label={t('orders_timeline_title')}>
        <ul className="flex min-w-max list-none items-start gap-0 p-0 m-0 tablet:min-w-0 tablet:w-full">
          {steps.map((step, idx) => (
            <TimelineStepNode
              key={step.stepIndex}
              step={step}
              isLast={idx === steps.length - 1}
              cancelled={cancelled}
              t={t}
              lang={lang}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}
