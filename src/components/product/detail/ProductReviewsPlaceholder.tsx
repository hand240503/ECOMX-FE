import { useState } from 'react';
import {
  CheckCircle2,
  ImageIcon,
  MessageCircle,
  Share2,
  Star,
  ThumbsUp,
} from 'lucide-react';
import { useI18n } from '../../../i18n/I18nProvider';
import { cn } from '../../../lib/cn';

/** 0–5 with fractional stars (visual only). */
function FractionalStars({ value, size = 20 }: { value: number; size?: number }) {
  const v = Math.min(5, Math.max(0, value));
  return (
    <div className="flex items-center gap-0.5" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => {
        const fill = Math.min(1, Math.max(0, v - i));
        return (
          <div
            key={i}
            className="relative shrink-0"
            style={{ width: size, height: size }}
          >
            <Star
              size={size}
              className="absolute text-border"
              strokeWidth={2}
              fill="none"
            />
            <div
              className="absolute inset-y-0 left-0 overflow-hidden"
              style={{ width: `${fill * 100}%` }}
            >
              <Star size={size} className="fill-warning text-warning" strokeWidth={0} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

type Distribution = { stars: number; count: number };

const MOCK_DISTRIBUTION: Distribution[] = [
  { stars: 5, count: 15 },
  { stars: 4, count: 2 },
  { stars: 3, count: 1 },
  { stars: 2, count: 2 },
  { stars: 1, count: 1 },
];

const MOCK_TOTAL = MOCK_DISTRIBUTION.reduce((s, d) => s + d.count, 0);
const MOCK_AVG = 4.4;

type FilterId = 'newest' | 'images' | 'verified' | '5' | '4' | '3' | '2' | '1';

type ProductReviewsPlaceholderProps = {
  id?: string;
  className?: string;
};

export function ProductReviewsPlaceholder({ id, className }: ProductReviewsPlaceholderProps) {
  const { t } = useI18n();
  const [filter, setFilter] = useState<FilterId>('newest');

  const filters: { id: FilterId; label: string }[] = [
    { id: 'newest', label: t('pdp_reviews_filter_newest') },
    { id: 'images', label: t('pdp_reviews_filter_images') },
    { id: 'verified', label: t('pdp_reviews_filter_verified') },
    { id: '5', label: t('pdp_reviews_filter_star').replace('{n}', '5') },
    { id: '4', label: t('pdp_reviews_filter_star').replace('{n}', '4') },
    { id: '3', label: t('pdp_reviews_filter_star').replace('{n}', '3') },
    { id: '2', label: t('pdp_reviews_filter_star').replace('{n}', '2') },
    { id: '1', label: t('pdp_reviews_filter_star').replace('{n}', '1') },
  ];

  const maxBar = Math.max(...MOCK_DISTRIBUTION.map((d) => d.count), 1);

  return (
    <section
      id={id}
      className={cn(
        'rounded-2xl border border-border bg-surface p-5 shadow-[0_2px_16px_rgba(15,23,42,0.05)] tablet:p-6',
        className
      )}
      aria-labelledby="pdp-reviews-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 id="pdp-reviews-heading" className="text-heading text-text-primary">
          {t('pdp_reviews_title')}
        </h2>
        <span className="rounded-full border border-dashed border-primary/40 bg-primary/5 px-2.5 py-1 text-caption font-medium text-primary">
          {t('pdp_reviews_preview_note')}
        </span>
      </div>

      <div className="my-5 h-px bg-border/90" />

      <div className="grid gap-6 tablet:grid-cols-[minmax(0,200px)_1fr] lg:grid-cols-[minmax(0,220px)_1fr_minmax(0,140px)] lg:items-start">
        <div className="flex flex-col gap-2">
          <p className="text-[2.25rem] font-bold leading-none tracking-tight text-text-primary">
            {MOCK_AVG.toFixed(1)}
          </p>
          <FractionalStars value={MOCK_AVG} size={22} />
          <p className="text-caption text-text-secondary">
            {t('pdp_reviews_count_fmt').replace('{n}', String(MOCK_TOTAL))}
          </p>
        </div>

        <div className="flex min-w-0 flex-col gap-2">
          {MOCK_DISTRIBUTION.map((row) => {
            const pct = Math.round((row.count / maxBar) * 100);
            return (
              <div key={row.stars} className="flex items-center gap-2 text-caption">
                <span className="w-8 shrink-0 text-text-secondary">
                  {row.stars}★
                </span>
                <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-border/80">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-6 shrink-0 text-right tabular-nums text-text-secondary">
                  {row.count}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-background/60 p-3 lg:items-center">
          <p className="text-caption font-medium text-text-primary">
            {t('pdp_reviews_all_images').replace('{n}', '1')}
          </p>
          <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-border bg-surface text-text-disabled">
            <ImageIcon size={28} strokeWidth={1.5} aria-hidden />
          </div>
        </div>
      </div>

      <div className="mt-6">
        <p className="mb-2 text-caption font-semibold text-text-secondary">
          {t('pdp_reviews_filter_by')}
        </p>
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-caption font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                filter === f.id
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-surface text-text-secondary hover:border-primary/40 hover:text-text-primary'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <ul className="mt-6 space-y-6 border-t border-border/80 pt-6">
        <li className="grid gap-4 tablet:grid-cols-[minmax(0,200px)_1fr]">
          <div className="flex gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-body font-bold text-primary"
              aria-hidden
            >
              LT
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-text-primary">{t('pdp_reviews_mock_1_name')}</p>
              <p className="mt-0.5 text-caption text-text-secondary">
                {t('pdp_reviews_mock_member').replace('{n}', '3')}
              </p>
              <p className="mt-1 text-caption text-text-disabled">
                {t('pdp_reviews_mock_stats')
                  .replace('{r}', '12')
                  .replace('{t}', '48')}
              </p>
            </div>
          </div>
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <FractionalStars value={5} size={16} />
              <span className="inline-flex items-center gap-1 text-caption font-medium text-success">
                <CheckCircle2 size={14} aria-hidden />
                {t('pdp_reviews_verified_purchase')}
              </span>
            </div>
            <p className="text-body font-semibold text-text-primary">{t('pdp_reviews_mock_1_title')}</p>
            <span className="inline-block rounded-md border border-border bg-background px-2 py-0.5 text-caption text-text-secondary">
              {t('pdp_reviews_mock_1_tag')}
            </span>
            <p className="text-body leading-relaxed text-text-secondary">{t('pdp_reviews_mock_1_body')}</p>
            <p className="text-caption text-text-disabled">{t('pdp_reviews_mock_1_meta')}</p>
            <div className="flex flex-wrap gap-4 pt-2 text-caption text-text-secondary">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
              >
                <ThumbsUp size={16} aria-hidden />
                {t('pdp_reviews_helpful')}
                <span className="tabular-nums">(8)</span>
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
              >
                <MessageCircle size={16} aria-hidden />
                {t('pdp_reviews_comment')}
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
              >
                <Share2 size={16} aria-hidden />
                {t('pdp_reviews_share')}
              </button>
            </div>
          </div>
        </li>

        <li className="grid gap-4 border-t border-border/60 pt-6 tablet:grid-cols-[minmax(0,200px)_1fr]">
          <div className="flex gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-warning/15 text-body font-bold text-warning"
              aria-hidden
            >
              AN
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-text-primary">{t('pdp_reviews_mock_2_name')}</p>
              <p className="mt-0.5 text-caption text-text-secondary">
                {t('pdp_reviews_mock_member').replace('{n}', '1')}
              </p>
            </div>
          </div>
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <FractionalStars value={4} size={16} />
              <span className="inline-flex items-center gap-1 text-caption font-medium text-success">
                <CheckCircle2 size={14} aria-hidden />
                {t('pdp_reviews_verified_purchase')}
              </span>
            </div>
            <p className="text-body font-semibold text-text-primary">{t('pdp_reviews_mock_2_title')}</p>
            <p className="text-body leading-relaxed text-text-secondary">{t('pdp_reviews_mock_2_body')}</p>
            <p className="text-caption text-text-disabled">{t('pdp_reviews_mock_2_meta')}</p>
          </div>
        </li>
      </ul>
    </section>
  );
}
