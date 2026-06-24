import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { PackageX, RotateCcw, ChevronRight, ImageIcon, RefreshCw } from 'lucide-react';
import { orderService } from '../../api/services';
import type { OrderDto } from '../../api/types/order.types';
import { useI18n } from '../../i18n/I18nProvider';
import { cn } from '../../lib/cn';
import { formatPrice } from '../../lib/formatPrice';

// ─── Helpers ────────────────────────────────────────────────────────────────

function returnStatusLabelKey(status: number): string {
  if (status >= 1 && status <= 5) return `orders_return_status_${status}`;
  return 'orders_return_status_unknown';
}

function orderStatusLabelKey(status: number): string {
  if (status >= 1 && status <= 5) return `orders_status_${status}`;
  return 'orders_status_unknown';
}

/** Màu badge theo trạng thái trả hàng. */
function returnBadgeClass(status: number): string {
  switch (status) {
    case 1: return 'border-amber-300/50 bg-amber-100 text-amber-700';
    case 2: return 'border-blue-300/50 bg-blue-100 text-blue-700';
    case 3: return 'border-purple-300/50 bg-purple-100 text-purple-700';
    case 4: return 'border-emerald-300/50 bg-emerald-100 text-emerald-700';
    case 5: return 'border-rose-300/50 bg-rose-100 text-rose-700';
    default: return 'border-border bg-background text-text-secondary';
  }
}

function formatWhen(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
}

function firstThumb(o: OrderDto): string | null {
  const line = o.orderDetails?.[0];
  if (!line) return null;
  return (line.thumbnail_url ?? line.thumbnailUrl) ?? null;
}

function productSummary(o: OrderDto): string {
  const lines = o.orderDetails ?? [];
  if (lines.length === 0) return `#${o.orderCode}`;
  const first = lines[0].productName ?? `Sản phẩm #${lines[0].productId}`;
  return lines.length > 1 ? `${first} +${lines.length - 1}` : first;
}

const FILTERS: { value: number | null; labelKey: string }[] = [
  { value: null, labelKey: 'return_mgmt_all' },
  { value: 1, labelKey: 'orders_return_status_1' },
  { value: 2, labelKey: 'orders_return_status_2' },
  { value: 3, labelKey: 'orders_return_status_3' },
  { value: 4, labelKey: 'orders_return_status_4' },
  { value: 5, labelKey: 'orders_return_status_5' },
];

// ─── Page ───────────────────────────────────────────────────────────────────

export default function ReturnManagementTab() {
  const { t } = useI18n();
  const [active, setActive] = useState<number | null>(null);

  const { data: all = [], isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['user-returns'],
    queryFn: () => orderService.listOrders(),
    select: (orders: OrderDto[]) => orders.filter((o) => o.returnRefundStatus != null),
    staleTime: 30_000,
  });

  const filtered = useMemo(
    () => (active == null ? all : all.filter((o) => o.returnRefundStatus === active)),
    [all, active],
  );

  return (
    <div className="w-full max-w-3xl px-1 py-2">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="m-0 text-caption text-text-secondary">{t('return_mgmt_subtitle')}</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-surface px-3 py-1.5 text-caption font-medium text-text-secondary hover:text-primary"
        >
          <RefreshCw className={cn('size-3.5', isFetching && 'animate-spin')} aria-hidden />
          {t('orders_retry')}
        </button>
      </div>

      {/* Filter chips */}
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const count = f.value == null ? all.length : all.filter((o) => o.returnRefundStatus === f.value).length;
          return (
            <button
              key={String(f.value)}
              type="button"
              onClick={() => setActive(f.value)}
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-caption font-medium transition-colors',
                active === f.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-surface text-text-secondary hover:text-primary',
              )}
            >
              {t(f.labelKey)}
              <span className="rounded-full bg-background px-1.5 text-[10px] font-semibold text-text-disabled">{count}</span>
            </button>
          );
        })}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-text-secondary">
          <RefreshCw className="size-4 animate-spin" aria-hidden /> {t('return_page_loading')}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-2 py-16 text-danger">
          <PackageX className="size-8" aria-hidden />
          <button type="button" onClick={() => refetch()} className="text-caption underline">{t('orders_retry')}</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <RotateCcw className="size-10 text-text-disabled" aria-hidden />
          <p className="m-0 text-body text-text-secondary">{t('return_mgmt_empty')}</p>
        </div>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {filtered.map((o) => {
            const rs = o.returnRefundStatus ?? 0;
            const thumb = firstThumb(o);
            const mediaCount = o.returnMedia?.length ?? 0;
            return (
              <li key={o.id} className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="size-14 shrink-0 overflow-hidden rounded-sm border border-border bg-background">
                    {thumb ? (
                      <img src={thumb} alt={productSummary(o)} className="size-full object-cover" loading="lazy" />
                    ) : (
                      <div className="flex size-full items-center justify-center text-text-disabled">
                        <PackageX className="size-6" aria-hidden />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="m-0 truncate text-body font-medium text-text-primary">{productSummary(o)}</p>
                    <p className="m-0 text-caption text-text-secondary">
                      {t('orders_code_label')}: <span className="font-mono text-text-primary">{o.orderCode}</span>
                    </p>
                    <p className="m-0 text-caption text-text-disabled">{t('orders_date_label')} {formatWhen(o.createdDate)}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold', returnBadgeClass(rs))}>
                        <RotateCcw className="size-3" aria-hidden />
                        {t(returnStatusLabelKey(rs))}
                      </span>
                      <span className="text-[11px] text-text-disabled">· {t(orderStatusLabelKey(o.status))}</span>
                      {mediaCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-text-disabled">
                          <ImageIcon className="size-3" aria-hidden /> {mediaCount} {t('return_mgmt_media')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-body font-semibold text-text-primary">{formatPrice(o.total ?? 0)}</span>
                    <Link
                      to={`/orders/${o.id}`}
                      className="inline-flex items-center gap-0.5 text-caption font-medium text-primary hover:underline"
                    >
                      {t('orders_action_order_detail')}
                      <ChevronRight className="size-3.5" aria-hidden />
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
