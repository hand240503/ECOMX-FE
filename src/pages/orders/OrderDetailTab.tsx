import { useQuery } from '@tanstack/react-query';
import { Check, ChevronLeft, Copy, Store } from 'lucide-react';
import { format, isValid, parseISO } from 'date-fns';
import { enUS, vi } from 'date-fns/locale';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { CreatedOrderDetail } from '../../api/types/order.types';
import type { ProductFullResponse } from '../../api/types/product.types';
import { orderService } from '../../api/services';
import { Button } from '../../components/ui/Button';
import { useI18n } from '../../i18n/I18nProvider';
import { orderLineDisplayFromProduct, useOrderDetailProducts } from '../../hooks/useOrderDetailProducts';
import { cn } from '../../lib/cn';
import { formatPrice } from '../../lib/formatPrice';
import { parseOrderDescriptionJson } from '../../lib/orderDescriptionJson';
import { notify } from '../../utils/notify';
import type { Lang } from '../../utils/i18n';

const localeByLang: Record<Lang, typeof vi> = {
  vi,
  en: enUS,
};

function formatDetailClock(iso: string | undefined, lang: Lang): string {
  if (iso == null || iso.trim() === '') return '—';
  const d = parseISO(iso);
  if (!isValid(d)) return '—';
  return format(d, 'HH:mm dd-MM-yyyy', { locale: localeByLang[lang] });
}

function orderDetailHeroTitleKey(status: number): string {
  if (status >= 1 && status <= 5) return `orders_detail_hero_title_${status}`;
  return 'orders_detail_hero_title_unknown';
}

function returnRefundStatusLabelKey(status: number): string {
  if (status >= 1 && status <= 5) return `orders_return_status_${status}`;
  return 'orders_return_status_unknown';
}

function orderDetailHeroToneClass(status: number): string {
  if (status === 5) return 'text-danger';
  if (status === 4) return 'text-success';
  if (status >= 1 && status <= 3) return 'text-primary';
  return 'text-text-primary';
}

function orderDetailHeroPanelClass(status: number): string {
  if (status === 5) return 'border-danger/35 bg-danger/[0.06]';
  if (status === 4) return 'border-success/30 bg-success/[0.07]';
  if (status >= 1 && status <= 3) return 'border-primary/30 bg-primary/[0.06]';
  return 'border-border bg-background/60';
}

/** API đôi khi trả số dạng string; `lineTotal`/`unitPrice` có thể thiếu. */
function toFiniteNumber(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = typeof v === 'number' ? v : Number.parseFloat(String(v).replace(',', '.'));
  if (!Number.isFinite(n)) return null;
  return n;
}

function linePaidAmount(line: CreatedOrderDetail, lines: CreatedOrderDetail[], orderTotalRaw: unknown): number {
  const lt = toFiniteNumber(line.lineTotal);
  if (lt != null && lt > 0) return lt;
  const up = toFiniteNumber(line.unitPrice);
  const qty = Math.max(0, line.quantity);
  if (up != null && up > 0 && qty > 0) return up * qty;
  const sumQty = lines.reduce((s, l) => s + Math.max(0, l.quantity), 0);
  const ot = toFiniteNumber(orderTotalRaw);
  if (sumQty > 0 && ot != null && ot > 0) return (ot * Math.max(0, line.quantity)) / sumQty;
  return 0;
}

/** Giá gạch ngang chỉ khi hợp lý — tránh lệch đơn vị catalog vs đơn hàng. */
function listPriceStrikethroughIfValid(
  line: CreatedOrderDetail,
  product: ProductFullResponse | undefined,
  paid: number
): number | null {
  const oldN = toFiniteNumber(product?.prices?.[0]?.oldValue);
  if (oldN == null || oldN <= 0) return null;
  const qty = Math.max(0, line.quantity);
  const listTotal = oldN * qty;
  if (listTotal <= paid + 0.0001) return null;
  if (paid > 0 && listTotal > paid * 5) return null;
  return listTotal;
}

function SummaryRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3 border-b border-dotted border-border py-2.5 text-body last:border-b-0">
      <span className="shrink-0 text-text-secondary">{label}</span>
      <div className="min-w-0 flex-1 text-right font-medium text-text-primary">{children}</div>
    </div>
  );
}

export default function OrderDetailTab() {
  const { t, lang } = useI18n();
  const { orderId } = useParams<{ orderId: string }>();
  const id = orderId ? Number.parseInt(orderId, 10) : Number.NaN;
  const validId = Number.isFinite(id) && id > 0;
  const [copied, setCopied] = useState(false);
  const copyResetRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyResetRef.current != null) window.clearTimeout(copyResetRef.current);
    };
  }, []);

  const orderQuery = useQuery({
    queryKey: ['order-detail', id],
    queryFn: () => orderService.getOrderById(id),
    enabled: validId,
  });

  const lines = orderQuery.data?.orderDetails;
  const productsState = useOrderDetailProducts(validId ? id : 0, lines);

  const byId = productsState.byId;
  const productIds = productsState.productIds;
  const productsLoading = productsState.isLoading && productIds.length > 0;
  const productsError = productsState.isError && productIds.length > 0;

  const headerDesc = useMemo(
    () => parseOrderDescriptionJson(orderQuery.data?.description ?? null),
    [orderQuery.data?.description]
  );

  const headerRequestedAt = useMemo(() => {
    const o = orderQuery.data;
    if (!o) return '—';
    const iso = o.createdDate ?? o.modifiedDate;
    return formatDetailClock(iso, lang);
  }, [orderQuery.data, lang]);

  const heroSubTime = useMemo(() => {
    const o = orderQuery.data;
    if (!o) return '—';
    const iso =
      o.status === 5 || o.status === 4
        ? (o.modifiedDate ?? o.createdDate)
        : (o.createdDate ?? o.modifiedDate);
    return formatDetailClock(iso, lang);
  }, [orderQuery.data, lang]);

  const cancelOrNoteReason = useMemo(() => {
    const o = orderQuery.data;
    if (!o) return null;
    const fromApi = o.returnRefundNote?.trim();
    const fromJson = headerDesc?.note?.trim() || headerDesc?.message?.trim();
    return fromApi || fromJson || null;
  }, [orderQuery.data, headerDesc]);

  const paymentLabel = useMemo(() => {
    const o = orderQuery.data;
    if (!o?.paymentMethod) return '—';
    return o.paymentMethod.name?.trim() || o.paymentMethod.code || '—';
  }, [orderQuery.data]);

  const onCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      notify.success(t('orders_detail_copied'));
      if (copyResetRef.current != null) window.clearTimeout(copyResetRef.current);
      copyResetRef.current = window.setTimeout(() => {
        setCopied(false);
        copyResetRef.current = null;
      }, 2000);
    } catch {
      notify.error(t('orders_detail_copy_failed'));
    }
  };

  if (!validId) {
    return <p className="text-body text-danger">{t('orders_detail_invalid_id')}</p>;
  }

  if (orderQuery.isLoading) {
    return (
      <div className="animate-pulse space-y-3" aria-busy="true">
        <div className="h-8 w-full max-w-md rounded bg-border" />
        <div className="h-40 rounded-lg bg-border" />
        <div className="h-32 rounded-lg bg-border" />
      </div>
    );
  }

  if (orderQuery.isError) {
    return (
      <div className="rounded-md border border-border bg-surface p-6 text-center">
        <p className="m-0 text-body text-danger">{t('orders_detail_load_error')}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4 rounded-sm"
          onClick={() => void orderQuery.refetch()}
        >
          {t('orders_retry')}
        </Button>
      </div>
    );
  }

  const order = orderQuery.data!;
  const status = order.status;
  const shopName = t('orders_shop_platform_name');

  return (
    <div className="w-full max-w-3xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <Link
          to="/orders"
          className={cn(
            'inline-flex items-center gap-1 text-body font-medium uppercase tracking-wide text-text-primary',
            'hover:text-primary hover:underline',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm'
          )}
        >
          <ChevronLeft className="size-5 shrink-0" strokeWidth={2} aria-hidden />
          {t('orders_detail_back_link')}
        </Link>
        <p className="m-0 text-caption text-text-secondary">
          {t('orders_detail_requested_at')} <span className="text-text-primary">{headerRequestedAt}</span>
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
        <div
          className={cn(
            'border-b border-l-4 px-4 py-5 tablet:px-6',
            orderDetailHeroPanelClass(status)
          )}
        >
          <h2
            className={cn(
              'm-0 text-[20px] font-medium leading-[32px]',
              orderDetailHeroToneClass(status)
            )}
          >
            {t(orderDetailHeroTitleKey(status))}
          </h2>
          <p className="mb-0 mt-2 text-caption text-text-secondary">
            {t('orders_detail_hero_sub').replace('{time}', heroSubTime)}
          </p>
          {order.returnRefundStatus != null ? (
            <p className="mb-0 mt-2 text-caption font-medium text-warning">
              {t('orders_return_badge')}: {t(returnRefundStatusLabelKey(order.returnRefundStatus))}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3 tablet:px-6">
          <span className="min-w-0 flex-1 text-body font-semibold text-text-primary">{shopName}</span>
          <Link
            to="/"
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-sm border border-border bg-background px-2.5 py-1.5',
              'text-caption font-medium text-text-primary hover:bg-background/80',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
            )}
          >
            <Store className="size-3.5 text-text-secondary" strokeWidth={2} aria-hidden />
            {t('orders_action_view_shop')}
          </Link>
        </div>

        {productsError ? (
          <div className="border-b border-border px-4 py-3 tablet:px-6">
            <p className="m-0 text-caption text-danger">{t('orders_detail_products_load_error')}</p>
            <button
              type="button"
              onClick={() => void productsState.refetch()}
              className={cn(
                'mt-2 text-caption font-medium text-primary hover:text-primary-dark hover:underline',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm'
              )}
            >
              {t('orders_detail_products_retry')}
            </button>
          </div>
        ) : null}

        <ul className="m-0 list-none divide-y divide-border p-0">
          {(order.orderDetails ?? []).map((line) => {
            const detailLines = order.orderDetails ?? [];
            const lineDesc = parseOrderDescriptionJson(line.description ?? null);
            const variant = lineDesc?.unit?.trim() || '—';
            const display = orderLineDisplayFromProduct(line, byId);
            const product = byId.get(line.productId);
            const paid = linePaidAmount(line, detailLines, order.total);
            const listStrike = listPriceStrikethroughIfValid(line, product, paid);

            return (
              <li key={line.id} className="px-4 py-4 tablet:px-6">
                <div className="flex gap-3 items-start">
                  <Link
                    to={`/products/${line.productId}`}
                    className="size-[4.5rem] shrink-0 overflow-hidden rounded-sm border border-border bg-background tablet:size-24"
                  >
                    {productsLoading && !display.thumbnailUrl ? (
                      <div className="size-full animate-pulse bg-border" aria-hidden />
                    ) : display.thumbnailUrl ? (
                      <img
                        src={display.thumbnailUrl}
                        alt=""
                        className="size-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-caption text-text-disabled">
                        —
                      </div>
                    )}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/products/${line.productId}`}
                      className="line-clamp-3 text-left text-body font-medium text-text-primary hover:text-primary hover:underline tablet:text-title"
                    >
                      {display.productName}
                    </Link>
                    <p className="mb-0 mt-1.5 text-caption text-text-secondary">
                      {t('orders_line_variant_prefix')} {variant}
                    </p>
                    <p className="mb-0 mt-1 text-caption text-text-secondary">×{line.quantity}</p>
                  </div>
                  <div className="shrink-0 self-start text-right whitespace-nowrap tabular-nums">
                    {listStrike != null ? (
                      <p className="m-0 text-caption text-text-disabled line-through">{formatPrice(listStrike)}</p>
                    ) : null}
                    <p className={cn('m-0 font-semibold text-primary', listStrike != null ? 'mt-0.5' : '')}>
                      {formatPrice(paid)}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {(order.orderDetails ?? []).length === 0 ? (
          <div className="border-t border-border px-4 py-6 text-center text-body text-text-secondary tablet:px-6">
            {t('orders_no_lines')}
          </div>
        ) : null}

        <div className="border-t border-border px-4 py-2 tablet:px-6">
          <SummaryRow label={t('orders_detail_summary_requested_by')}>{t('orders_detail_summary_buyer')}</SummaryRow>
          <SummaryRow label={t('orders_detail_summary_payment')}>{paymentLabel}</SummaryRow>
          {status === 4 || status === 5 ? (
            <SummaryRow label={t('orders_detail_return_title')}>
              <div className="flex flex-col items-end gap-2 text-right">
                <p className="m-0 max-w-md text-caption font-normal text-text-secondary">
                  {status === 4 ? t('orders_detail_return_hint_completed') : t('orders_detail_return_hint')}
                </p>
                <Link
                  to="/account/returns"
                  className={cn(
                    'inline-flex items-center justify-center rounded-sm border border-primary bg-primary/10',
                    'px-3 py-1.5 text-caption font-semibold text-primary',
                    'hover:bg-primary/15',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
                  )}
                >
                  {t('orders_detail_return_cta')}
                </Link>
              </div>
            </SummaryRow>
          ) : null}
          <SummaryRow label={t('orders_detail_summary_order_code')}>
            <span className="inline-flex items-center justify-end gap-2">
              <span className={cn(status === 5 ? 'text-danger' : 'text-text-primary')}>{order.orderCode}</span>
              <button
                type="button"
                onClick={() => void onCopyCode(order.orderCode)}
                className={cn(
                  'inline-flex size-8 items-center justify-center rounded-sm border border-border text-text-secondary',
                  'hover:bg-background hover:text-primary',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
                )}
                aria-label={t('orders_detail_copy_aria')}
              >
                {copied ? <Check className="size-4 text-success" strokeWidth={2} aria-hidden /> : <Copy className="size-4" strokeWidth={2} aria-hidden />}
              </button>
            </span>
          </SummaryRow>
          <SummaryRow label={t('orders_detail_summary_address')}>
            <span className="whitespace-pre-wrap break-words font-normal">{order.deliveryAddress?.trim() || '—'}</span>
          </SummaryRow>
          <SummaryRow label={t('orders_detail_summary_total')}>
            <span className="text-title font-bold text-primary tabular-nums">
              {formatPrice(toFiniteNumber(order.total) ?? 0)}
            </span>
          </SummaryRow>
        </div>

        {cancelOrNoteReason && (status === 5 || order.returnRefundStatus != null) ? (
          <div className="border-t border-border bg-background/40 px-4 py-4 tablet:px-6">
            <p className="m-0 text-body text-text-primary">
              <span className="font-semibold text-text-secondary">{t('orders_detail_reason_label')} </span>
              {cancelOrNoteReason}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
