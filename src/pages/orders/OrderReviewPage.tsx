import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Star } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { orderService, ratingService } from '../../api/services';
import type { UserRating } from '../../api/types/rating.types';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../app/auth/AuthProvider';
import { useI18n } from '../../i18n/I18nProvider';
import {
  orderLineDisplayFromProduct,
  uniqueProductIdsFromOrderDetails,
  useOrderDetailProducts,
} from '../../hooks/useOrderDetailProducts';
import { useUserRatings } from '../../hooks/useUserRatings';
import { cn } from '../../lib/cn';
import { notify } from '../../utils/notify';

const ORDER_STATUS_COMPLETED = 4;

type LineForm = { rating: number; comment: string };
type LineStatus = 'idle' | 'saving' | 'saved' | 'error';

/** Ô chấm sao tương tác (1–5). */
function StarInput({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const [hover, setHover] = useState(0);
  const active = hover || value;
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n}`}
          disabled={disabled}
          onMouseEnter={() => !disabled && setHover(n)}
          onMouseLeave={() => !disabled && setHover(0)}
          onClick={() => !disabled && onChange(n)}
          className={cn(
            'rounded-sm p-0.5 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            disabled ? 'cursor-not-allowed' : 'hover:scale-110'
          )}
        >
          <Star
            size={28}
            className={cn(n <= active ? 'fill-warning text-warning' : 'fill-none text-border')}
            strokeWidth={n <= active ? 0 : 2}
          />
        </button>
      ))}
    </div>
  );
}

export default function OrderReviewPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

  const { orderId } = useParams<{ orderId: string }>();
  const id = orderId ? Number.parseInt(orderId, 10) : Number.NaN;
  const validId = Number.isFinite(id) && id > 0;

  const orderQuery = useQuery({
    queryKey: ['order-detail', id],
    queryFn: () => orderService.getOrderById(id),
    enabled: validId,
  });

  const order = orderQuery.data;
  const lines = order?.orderDetails;
  const productsState = useOrderDetailProducts(validId ? id : 0, lines);
  const ratingsQuery = useUserRatings(userId);

  const existingByProduct = useMemo(() => {
    const m = new Map<number, UserRating>();
    // Chỉ lấy đánh giá explicit (type 0/null); bỏ qua implicit (type=1, thang 0–10) do builder sinh.
    for (const r of ratingsQuery.data ?? []) {
      if (r.type == null || r.type === 0) m.set(r.productId, r);
    }
    return m;
  }, [ratingsQuery.data]);

  const reviewItems = useMemo(() => {
    const detailLines = order?.orderDetails ?? [];
    const ids = uniqueProductIdsFromOrderDetails(detailLines);
    return ids.map((pid) => {
      const line = detailLines.find((l) => l.productId === pid)!;
      const display = orderLineDisplayFromProduct(line, productsState.byId);
      return { productId: pid, name: display.productName, thumbnailUrl: display.thumbnailUrl };
    });
  }, [order?.orderDetails, productsState.byId]);

  const [forms, setForms] = useState<Record<number, LineForm>>({});
  const [statuses, setStatuses] = useState<Record<number, LineStatus>>({});
  const seededRef = useRef(false);

  // Seed form từ đánh giá đã có (1 lần, sau khi cả đơn + ratings tải xong).
  useEffect(() => {
    if (seededRef.current) return;
    if (!order || reviewItems.length === 0) return;
    if (ratingsQuery.isLoading) return;
    const next: Record<number, LineForm> = {};
    for (const item of reviewItems) {
      const ex = existingByProduct.get(item.productId);
      next[item.productId] = {
        rating: ex?.rating ?? 5,
        comment: ex?.comment ?? '',
      };
    }
    setForms(next);
    seededRef.current = true;
  }, [order, reviewItems, existingByProduct, ratingsQuery.isLoading]);

  const setRating = (pid: number, rating: number) =>
    setForms((f) => ({ ...f, [pid]: { rating, comment: f[pid]?.comment ?? '' } }));
  const setComment = (pid: number, comment: string) =>
    setForms((f) => ({ ...f, [pid]: { rating: f[pid]?.rating ?? 5, comment } }));

  async function submit(pid: number) {
    if (userId == null) {
      notify.error(t('orders_review_need_login'));
      return;
    }
    const form = forms[pid];
    if (!form || form.rating < 1) {
      notify.error(t('orders_review_pick_star'));
      return;
    }
    setStatuses((s) => ({ ...s, [pid]: 'saving' }));
    try {
      const existing = existingByProduct.get(pid);
      const comment = form.comment.trim() === '' ? undefined : form.comment.trim();
      if (existing) {
        await ratingService.update(existing.id, { rating: form.rating, comment });
      } else {
        await ratingService.create({ userId, productId: pid, rating: form.rating, comment });
      }
      setStatuses((s) => ({ ...s, [pid]: 'saved' }));
      notify.success(t('orders_review_saved'));
      void queryClient.invalidateQueries({ queryKey: ['user-ratings', 'by-user', userId] });
    } catch (e) {
      setStatuses((s) => ({ ...s, [pid]: 'error' }));
      notify.error(e instanceof Error ? e.message : t('orders_review_save_failed'));
    }
  }

  if (!validId) {
    return <p className="text-body text-danger">{t('orders_detail_invalid_id')}</p>;
  }

  if (orderQuery.isLoading) {
    return (
      <div className="w-full max-w-3xl animate-pulse space-y-3" aria-busy="true">
        <div className="h-8 w-64 rounded bg-border" />
        <div className="h-40 rounded-lg bg-border" />
        <div className="h-40 rounded-lg bg-border" />
      </div>
    );
  }

  if (orderQuery.isError || !order) {
    return (
      <div className="w-full max-w-3xl rounded-md border border-border bg-surface p-6 text-center">
        <p className="m-0 text-body text-danger">{t('orders_detail_load_error')}</p>
        <Button type="button" variant="outline" size="sm" className="mt-4 rounded-sm" onClick={() => void orderQuery.refetch()}>
          {t('orders_retry')}
        </Button>
      </div>
    );
  }

  const backLink = (
    <Link
      to={`/orders/${id}`}
      className={cn(
        'inline-flex items-center gap-1 text-body font-medium uppercase tracking-wide text-text-primary',
        'hover:text-primary hover:underline',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm'
      )}
    >
      <ChevronLeft className="size-5 shrink-0" strokeWidth={2} aria-hidden />
      {t('orders_review_back_link')}
    </Link>
  );

  if (order.status !== ORDER_STATUS_COMPLETED) {
    return (
      <div className="w-full max-w-3xl">
        <div className="mb-4 border-b border-border pb-3">{backLink}</div>
        <div className="rounded-md border border-border bg-surface p-6 text-center">
          <p className="m-0 text-body text-text-secondary">{t('orders_review_not_completed')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        {backLink}
        <p className="m-0 text-caption text-text-secondary">
          {t('orders_review_order_code')}: <span className="text-text-primary">{order.orderCode}</span>
        </p>
      </div>

      <div className="mb-4">
        <h2 className="m-0 text-[20px] font-medium leading-8 text-text-primary">{t('orders_review_title')}</h2>
        <p className="mb-0 mt-1 text-caption text-text-secondary">{t('orders_review_subtitle')}</p>
      </div>

      <ul className="m-0 flex list-none flex-col gap-4 p-0">
        {reviewItems.map((item) => {
          const form = forms[item.productId] ?? { rating: 5, comment: '' };
          const st = statuses[item.productId] ?? 'idle';
          const alreadyRated = existingByProduct.has(item.productId);
          const saving = st === 'saving';
          return (
            <li
              key={item.productId}
              className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm"
            >
              <div className="flex items-start gap-3 border-b border-border px-4 py-3 tablet:px-5">
                <Link
                  to={`/products/${item.productId}`}
                  className="size-16 shrink-0 overflow-hidden rounded-sm border border-border bg-background"
                >
                  {item.thumbnailUrl ? (
                    <img src={item.thumbnailUrl} alt="" className="size-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex size-full items-center justify-center text-caption text-text-disabled">—</div>
                  )}
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/products/${item.productId}`}
                    className="line-clamp-2 text-body font-medium text-text-primary hover:text-primary hover:underline"
                  >
                    {item.name}
                  </Link>
                  {alreadyRated ? (
                    <p className="mb-0 mt-1 text-caption font-medium text-success">{t('orders_review_already')}</p>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-col gap-3 px-4 py-4 tablet:px-5">
                <div className="flex items-center gap-3">
                  <span className="text-caption text-text-secondary">{t('orders_review_your_rating')}</span>
                  <StarInput
                    value={form.rating}
                    onChange={(v) => setRating(item.productId, v)}
                    disabled={saving}
                  />
                </div>
                <textarea
                  value={form.comment}
                  onChange={(e) => setComment(item.productId, e.target.value)}
                  disabled={saving}
                  rows={3}
                  maxLength={1000}
                  placeholder={t('orders_review_comment_placeholder')}
                  className={cn(
                    'w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-body text-text-primary',
                    'placeholder:text-text-disabled',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
                  )}
                />
                <div className="flex items-center justify-end gap-3">
                  {st === 'saved' ? (
                    <span className="text-caption font-medium text-success">{t('orders_review_saved')}</span>
                  ) : null}
                  <Button
                    type="button"
                    variant="profilePrimary"
                    size="sm"
                    disabled={saving}
                    onClick={() => void submit(item.productId)}
                  >
                    {saving
                      ? t('orders_review_submitting')
                      : alreadyRated
                        ? t('orders_review_update_cta')
                        : t('orders_review_submit_cta')}
                  </Button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {reviewItems.length === 0 ? (
        <div className="rounded-md border border-border bg-surface px-4 py-6 text-center text-body text-text-secondary">
          {t('orders_no_lines')}
        </div>
      ) : null}
    </div>
  );
}
