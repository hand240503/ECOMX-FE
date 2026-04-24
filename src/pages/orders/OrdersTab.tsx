import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClipboardList, MessageCircle, Search } from 'lucide-react';
import { format, isValid, parseISO, type Locale } from 'date-fns';
import { enUS, vi } from 'date-fns/locale';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../app/cart/CartProvider';
import { orderService, productService } from '../../api/services';
import type { CreatedOrderDetail, OrderDto } from '../../api/types/order.types';
import type { ProductFullResponse } from '../../api/types/product.types';
import { orderLineDisplayFromProduct, uniqueProductIdsFromOrders } from '../../hooks/useOrderDetailProducts';
import { Button } from '../../components/ui/Button';
import { useI18n } from '../../i18n/I18nProvider';
import { parseCartLineKey } from '../../lib/cartStorage';
import { clearVnpayOrdersAwaitPayload, type VnpayOrdersAwaitPayload, readVnpayOrdersAwaitPayload } from '../../lib/vnpayOrdersAwaitStorage';
import { cn } from '../../lib/cn';
import { formatPrice } from '../../lib/formatPrice';
import { parseOrderDescriptionJson } from '../../lib/orderDescriptionJson';
import { notify } from '../../utils/notify';
import type { Lang } from '../../utils/i18n';

const ORDER_TABS = [
  { id: 'all' as const },
  { id: 'pending_prep' as const },
  { id: 'shipping' as const },
  { id: 'awaiting_delivery' as const },
  { id: 'completed' as const },
  { id: 'cancelled' as const },
  { id: 'return_refund' as const },
] as const;

type OrderTabId = (typeof ORDER_TABS)[number]['id'];

const localeByLang: Record<Lang, Locale> = {
  vi,
  en: enUS,
};

function formatOrderWhen(iso: string | undefined, lang: Lang): string {
  if (iso == null || iso.trim() === '') return '—';
  const d = parseISO(iso);
  if (!isValid(d)) return '—';
  return format(d, 'PPp', { locale: localeByLang[lang] });
}

function orderStatusLabelKey(status: number): string {
  if (status >= 1 && status <= 5) return `orders_status_${status}`;
  return 'orders_status_unknown';
}

function returnRefundStatusLabelKey(status: number): string {
  if (status >= 1 && status <= 5) return `orders_return_status_${status}`;
  return 'orders_return_status_unknown';
}

function normVnpaySessionState(s: string | undefined): string {
  return (s ?? '').trim().toUpperCase();
}

function isVnpaySessionPending(s: string | undefined): boolean {
  return normVnpaySessionState(s) === 'PENDING';
}

/** Tab “Chờ chuẩn bị” ↔ `GET /orders?status=1`. */
function listQueryStatus(tab: OrderTabId): number | undefined {
  switch (tab) {
    case 'all':
    case 'return_refund':
      return undefined;
    case 'pending_prep':
      return 1;
    case 'shipping':
      return 2;
    case 'awaiting_delivery':
      return 3;
    case 'completed':
      return 4;
    case 'cancelled':
      return 5;
    default:
      return undefined;
  }
}

function filterOrdersForTab(orders: OrderDto[], tab: OrderTabId): OrderDto[] {
  if (tab !== 'return_refund') return orders;
  return orders.filter((o) => o.returnRefundStatus != null);
}

const userOrdersQueryKey = (tab: OrderTabId) => ['user-orders', tab] as const;

const orderListEnrichDetailQueryKey = (orderId: number) => ['order-detail', 'list-enrich', orderId] as const;

function orderHasLines(o: OrderDto): boolean {
  return Boolean(o.orderDetails && o.orderDetails.length > 0);
}

/** Danh sách đôi khi không kèm `orderDetails` — gộp bản đầy đủ từ `GET /orders/{id}`. */
function mergeOrderWithDetailFetch(listOrder: OrderDto, full: OrderDto | undefined): OrderDto {
  if (!full) return listOrder;
  const lines =
    full.orderDetails && full.orderDetails.length > 0
      ? full.orderDetails
      : listOrder.orderDetails;
  return {
    ...listOrder,
    orderDetails: lines,
    description: full.description ?? listOrder.description,
    deliveryAddress: full.deliveryAddress ?? listOrder.deliveryAddress,
    paymentMethod: full.paymentMethod ?? listOrder.paymentMethod,
  };
}

/** Badge trạng thái (nền + viền) để dễ nhận diện từng đơn. */
function orderStatusBadgeClass(status: number): string {
  if (status === 5) return 'border-danger/30 bg-danger/10 text-danger';
  if (status === 4) return 'border-success/30 bg-success/10 text-success';
  if (status === 1 || status === 2 || status === 3) return 'border-primary/30 bg-primary/10 text-primary';
  return 'border-border bg-background text-text-secondary';
}

function filterOrdersBySearch(
  orders: OrderDto[],
  q: string,
  productById: Map<number, ProductFullResponse>
): OrderDto[] {
  const n = q.trim().toLowerCase();
  if (!n) return orders;
  return orders.filter((o) => {
    if ((o.orderCode ?? '').toLowerCase().includes(n)) return true;
    for (const line of o.orderDetails ?? []) {
      const { productName } = orderLineDisplayFromProduct(line, productById);
      if (productName.toLowerCase().includes(n)) return true;
    }
    return false;
  });
}

function lineDisplayTotal(line: CreatedOrderDetail): number {
  if (line.lineTotal != null && Number.isFinite(line.lineTotal)) return line.lineTotal;
  const u = line.unitPrice ?? 0;
  return u * line.quantity;
}

function orderFooterHint(order: OrderDto, headerDesc: ReturnType<typeof parseOrderDescriptionJson>, t: (k: string) => string): string | null {
  const noteParts = [headerDesc?.message?.trim(), headerDesc?.note?.trim()].filter(Boolean);
  const noteJoined = noteParts.length ? noteParts.join(' · ') : null;
  if (order.status === 5) {
    const base = t('orders_cancelled_by_you');
    return noteJoined ? `${base} · ${noteJoined}` : base;
  }
  return noteJoined;
}

const secondaryActionClass = cn(
  'inline-flex items-center justify-center rounded-sm border border-border bg-surface px-3 py-2',
  'text-body text-text-primary transition-colors duration-200 hover:bg-background',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
);

const primaryCtaClass = cn(
  'inline-flex items-center justify-center rounded-sm border-0 bg-primary px-3 py-2',
  'text-body font-medium text-white transition-all duration-200 hover:bg-primary-dark',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
);

function OrderLinesSkeleton() {
  return (
    <div aria-busy="true">
      <div className="flex gap-1.5">
        <div className="size-16 shrink-0 animate-pulse rounded-sm bg-border" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="h-4 w-full max-w-sm animate-pulse rounded bg-border" />
          <div className="h-3 w-1/3 animate-pulse rounded bg-border" />
          <div className="h-3 w-24 animate-pulse rounded bg-border" />
        </div>
        <div className="h-5 w-20 shrink-0 animate-pulse self-start rounded bg-border" />
      </div>
    </div>
  );
}

function OrderCard({
  order,
  productById,
  productsLoading,
  linesEnrichPending,
  linesEnrichFailed,
  onRetryLinesEnrich,
}: {
  order: OrderDto;
  productById: Map<number, ProductFullResponse>;
  productsLoading: boolean;
  linesEnrichPending: boolean;
  linesEnrichFailed: boolean;
  onRetryLinesEnrich?: () => void;
}) {
  const { t, lang } = useI18n();
  const queryClient = useQueryClient();
  const details = order.orderDetails ?? [];
  const headerDesc = parseOrderDescriptionJson(order.description ?? null);
  const footerHint = orderFooterHint(order, headerDesc, t);

  const cancelMutation = useMutation({
    mutationFn: () => orderService.cancelOrder(order.id),
    onSuccess: () => {
      notify.success(t('orders_cancel_success'));
      void queryClient.invalidateQueries({ queryKey: ['user-orders'] });
      void queryClient.invalidateQueries({ queryKey: ['order-detail', order.id] });
    },
    onError: (err: unknown) => {
      notify.error(err instanceof Error ? err.message : t('orders_cancel_error'));
    },
  });

  const onCancelOrder = () => {
    if (!window.confirm(t('orders_cancel_confirm'))) return;
    cancelMutation.mutate();
  };

  return (
    <article
      className={cn(
        'overflow-hidden rounded-lg border border-border bg-surface shadow-sm',
        'ring-1 ring-black/[0.03]'
      )}
    >
      {/* Header — shop + status */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-border bg-background/50 px-4 py-2 tablet:px-5">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          <span className="text-title font-semibold text-text-primary">{t('orders_shop_platform_name')}</span>
          <Link
            to="/"
            className={cn(primaryCtaClass, 'gap-1.5 px-2.5 py-1.5 text-caption')}
            title={t('orders_action_chat')}
          >
            <MessageCircle className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
            {t('orders_action_chat')}
          </Link>
          <Link to="/" className={cn(secondaryActionClass, 'px-2.5 py-1.5 text-caption')}>
            {t('orders_action_view_shop')}
          </Link>
        </div>
        <span
          className={cn(
            'inline-flex max-w-full shrink-0 items-center rounded-full border px-2.5 py-1',
            'text-center text-caption font-semibold uppercase leading-tight tracking-wide',
            orderStatusBadgeClass(order.status)
          )}
        >
          {t(orderStatusLabelKey(order.status))}
        </span>
      </div>

      {/* Product lines */}
      <ul className="m-0 flex list-none flex-col gap-1.5 px-4 py-1.5 tablet:px-5">
        {linesEnrichPending && details.length === 0 ? (
          <li>
            <OrderLinesSkeleton />
          </li>
        ) : null}
        {details.map((line) => {
          const lineDesc = parseOrderDescriptionJson(line.description ?? null);
          const variantLabel = lineDesc?.unit?.trim() || '—';
          const total = lineDisplayTotal(line);
          const display = orderLineDisplayFromProduct(line, productById);
          return (
            <li key={line.id}>
              <div className="flex gap-1.5">
                <Link
                  to={`/products/${line.productId}`}
                  className="size-16 shrink-0 overflow-hidden rounded-sm border border-border bg-background"
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
                    className="line-clamp-2 text-left text-body text-text-primary hover:text-primary hover:underline"
                  >
                    {display.productName}
                  </Link>
                  <p className="mb-0 mt-1.5 text-caption text-text-secondary">
                    {t('orders_line_variant_prefix')} {variantLabel}
                  </p>
                  <p className="mb-0 mt-1.5 text-caption text-text-secondary">×{line.quantity}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="m-0 text-body font-semibold text-primary">{formatPrice(total)}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {!linesEnrichPending && details.length === 0 ? (
        <div className="px-4 py-1.5 text-center tablet:px-5">
          {linesEnrichFailed ? (
            <>
              <p className="m-0 text-body text-danger">{t('orders_lines_enrich_error')}</p>
              {onRetryLinesEnrich ? (
                <button
                  type="button"
                  onClick={onRetryLinesEnrich}
                  className={cn(
                    'mt-1.5 text-body font-medium text-primary hover:text-primary-dark hover:underline',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm'
                  )}
                >
                  {t('orders_retry')}
                </button>
              ) : null}
            </>
          ) : (
            <p className="m-0 text-body text-text-secondary">{t('orders_no_lines')}</p>
          )}
        </div>
      ) : null}

      {/* Footer — meta + actions */}
      <div className="border-t border-border px-4 py-1.5 tablet:px-5">
        <p className="m-0 text-right">
          <span className="text-body text-text-secondary">{t('orders_subtotal_label')} </span>
          <span className="text-title font-semibold text-primary">{formatPrice(order.total)}</span>
        </p>
        <p className="mb-0 mt-1.5 text-caption text-text-secondary">
          {t('orders_code_label')}: <span className="text-text-primary">{order.orderCode}</span>
        </p>
        <p className="mb-0 mt-1.5 text-caption text-text-secondary">
          <span className="text-text-secondary">{t('orders_date_label')} </span>
          {formatOrderWhen(order.createdDate ?? order.modifiedDate, lang)}
        </p>

        {footerHint ? <p className="mb-0 mt-1.5 text-caption text-text-secondary">{footerHint}</p> : null}

        {order.returnRefundStatus != null ? (
          <p className="mb-0 mt-1.5 text-caption text-warning">
            {t('orders_return_badge')}: {t(returnRefundStatusLabelKey(order.returnRefundStatus))}
          </p>
        ) : null}

        <div className="mt-1.5 flex flex-wrap items-center justify-end gap-1.5">
          {order.status === 5 ? (
            <Link to={`/orders/${order.id}`} className={secondaryActionClass}>
              {t('orders_action_cancel_detail')}
            </Link>
          ) : (
            <Link to={`/orders/${order.id}`} className={secondaryActionClass}>
              {t('orders_action_order_detail')}
            </Link>
          )}

          <Link to="/" className={secondaryActionClass}>
            {t('orders_action_contact_seller')}
          </Link>

          {order.status === 4 || order.status === 5 ? (
            <Link to="/account/returns" className={secondaryActionClass}>
              {t('orders_detail_return_title')}
            </Link>
          ) : null}

          {order.status === 1 ? (
            <button
              type="button"
              disabled={cancelMutation.isPending}
              onClick={onCancelOrder}
              className={cn(secondaryActionClass, 'disabled:cursor-not-allowed disabled:opacity-50')}
            >
              {cancelMutation.isPending ? t('orders_action_cancel_pending') : t('orders_action_cancel_order')}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function OrdersListSkeleton() {
  return (
    <ul className="m-0 list-none space-y-4 p-0" aria-busy="true">
      {Array.from({ length: 3 }).map((_, i) => (
        <li
          key={i}
          className="animate-pulse overflow-hidden rounded-lg border border-border bg-surface shadow-sm ring-1 ring-black/[0.03]"
        >
          <div className="h-12 bg-border/60" />
          <div className="space-y-1.5 p-1.5">
            <div className="h-16 rounded bg-border" />
            <div className="h-8 w-2/3 rounded bg-border" />
          </div>
        </li>
      ))}
    </ul>
  );
}

function OrdersEmptyState() {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center justify-center px-4 py-6 tablet:py-8">
      <div className="relative mb-1.5">
        <div
          className="pointer-events-none absolute -right-1 -top-1 size-2 rounded-full bg-[#ffc107]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-0.5 -left-1 size-1.5 rounded-full bg-primary/70"
          aria-hidden
        />
        <div className="flex size-[7.5rem] items-center justify-center rounded-full bg-background">
          <ClipboardList className="size-14 text-text-disabled" strokeWidth={1.25} aria-hidden />
        </div>
      </div>
      <p className="m-0 text-body font-medium text-text-primary">{t('orders_empty_title')}</p>
      <p className="mt-1.5 m-0 max-w-sm text-center text-caption text-text-secondary">
        {t('orders_empty_hint')}
      </p>
      <Link
        to="/"
        className={cn(
          'mt-1.5 inline-flex items-center justify-center rounded-sm bg-primary px-5 py-2.5',
          'text-body font-semibold text-white transition-all duration-200 hover:bg-primary-dark',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
        )}
      >
        {t('orders_empty_shop_cta')}
      </Link>
    </div>
  );
}

export default function OrdersTab() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const { removeItem } = useCart();
  const [tab, setTab] = useState<OrderTabId>('all');
  const [orderSearch, setOrderSearch] = useState('');

  const [vnpayOrdersAwait, setVnpayOrdersAwait] = useState<VnpayOrdersAwaitPayload | null>(() =>
    readVnpayOrdersAwaitPayload()
  );
  const vnpayPollQuery = useQuery({
    queryKey: ['vnpay-orders-await-pending', vnpayOrdersAwait?.transactionPublicId],
    queryFn: () => orderService.getVnpayPending(vnpayOrdersAwait!.transactionPublicId),
    enabled: Boolean(vnpayOrdersAwait?.transactionPublicId),
    refetchInterval: (q) => (isVnpaySessionPending(q.state.data?.state) ? 2000 : false),
  });

  useEffect(() => {
    if (!vnpayOrdersAwait) return;
    const d = vnpayPollQuery.data;
    if (!d) return;
    const u = normVnpaySessionState(d.state);
    const tid = vnpayOrdersAwait.transactionPublicId;

    if (u === 'COMPLETED' && d.order?.id && d.order?.orderCode) {
      const doneKey = `ecomx_vnpay_orders_settled_ok_${tid}`;
      if (sessionStorage.getItem(doneKey)) return;
      sessionStorage.setItem(doneKey, '1');
      for (const k of vnpayOrdersAwait.lineKeys) {
        const p = parseCartLineKey(k);
        if (p) removeItem(p.productId, p.unitId);
      }
      void queryClient.invalidateQueries({ queryKey: ['user-orders'] });
      clearVnpayOrdersAwaitPayload();
      setVnpayOrdersAwait(null);
      notify.success(t('checkout_success').replace('{code}', d.order.orderCode));
      return;
    }

    if (['EXPIRED', 'FAILED', 'CANCELLED'].includes(u)) {
      const failKey = `ecomx_vnpay_orders_await_fail_${tid}`;
      if (sessionStorage.getItem(failKey)) return;
      sessionStorage.setItem(failKey, '1');
      clearVnpayOrdersAwaitPayload();
      setVnpayOrdersAwait(null);
    }
  }, [vnpayOrdersAwait, vnpayPollQuery.data, removeItem, queryClient, t]);

  const listStatus = listQueryStatus(tab);

  const query = useQuery({
    queryKey: userOrdersQueryKey(tab),
    queryFn: () => orderService.listOrders(listStatus),
    staleTime: 60_000,
  });

  const orders = useMemo(() => filterOrdersForTab(query.data ?? [], tab), [query.data, tab]);

  const orderIdsNeedingLines = useMemo(
    () => orders.filter((o) => !orderHasLines(o)).map((o) => o.id),
    [orders]
  );

  const orderLineEnrichQueries = useQueries({
    queries: orderIdsNeedingLines.map((orderId) => ({
      queryKey: orderListEnrichDetailQueryKey(orderId),
      queryFn: () => orderService.getOrderById(orderId),
      enabled: query.isSuccess && orderIdsNeedingLines.length > 0,
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    })),
  });

  const enrichedByOrderId = useMemo(() => {
    const m = new Map<number, OrderDto>();
    orderLineEnrichQueries.forEach((q, i) => {
      const id = orderIdsNeedingLines[i];
      if (id != null && q.data) m.set(id, q.data);
    });
    return m;
  }, [orderLineEnrichQueries, orderIdsNeedingLines]);

  const displayOrders = useMemo(
    () => orders.map((o) => mergeOrderWithDetailFetch(o, enrichedByOrderId.get(o.id))),
    [orders, enrichedByOrderId]
  );

  const lineEnrichPendingByOrderId = useMemo(() => {
    const m = new Map<number, boolean>();
    orderIdsNeedingLines.forEach((id, i) => {
      const q = orderLineEnrichQueries[i];
      m.set(id, Boolean(q?.isPending));
    });
    return m;
  }, [orderIdsNeedingLines, orderLineEnrichQueries]);

  const lineEnrichFailedByOrderId = useMemo(() => {
    const m = new Map<number, boolean>();
    orderIdsNeedingLines.forEach((id, i) => {
      const q = orderLineEnrichQueries[i];
      m.set(id, Boolean(q?.isError));
    });
    return m;
  }, [orderIdsNeedingLines, orderLineEnrichQueries]);

  const allProductIds = useMemo(() => uniqueProductIdsFromOrders(displayOrders), [displayOrders]);

  const productsQuery = useQuery({
    queryKey: ['products', 'by-ids', 'orders-tab', tab, allProductIds.join(',')] as const,
    queryFn: ({ signal }) => productService.getByIds(allProductIds, { signal }),
    enabled: query.isSuccess && allProductIds.length > 0,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const productById = useMemo(() => {
    const m = new Map<number, ProductFullResponse>();
    for (const p of productsQuery.data ?? []) m.set(p.id, p);
    return m;
  }, [productsQuery.data]);

  const productsLoading = productsQuery.isLoading && allProductIds.length > 0;

  const filteredDisplayOrders = useMemo(
    () => filterOrdersBySearch(displayOrders, orderSearch, productById),
    [displayOrders, orderSearch, productById]
  );

  return (
    <div className="w-full max-w-4xl">
      <section className="mb-1.5 rounded-md border border-border bg-surface px-3 py-1.5 shadow-sm tablet:px-4">
        <div
          className="flex w-full flex-wrap items-end justify-between gap-x-1 gap-y-1.5 border-b border-border pb-1.5"
          role="tablist"
          aria-label={t('orders_tabs_aria')}
        >
          {ORDER_TABS.map((def) => {
            const active = tab === def.id;
            return (
              <button
                key={def.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(def.id)}
                className={cn(
                  'relative border-0 bg-transparent px-1 py-1.5 text-center text-caption transition-colors duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm',
                  active
                    ? 'font-semibold text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-t-sm after:bg-primary'
                    : 'font-normal text-text-secondary hover:text-text-primary'
                )}
              >
                {t(`orders_tab_${def.id}`)}
              </button>
            );
          })}
        </div>
        <div className="pt-2">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-text-disabled"
              strokeWidth={2}
              aria-hidden
            />
            <input
              type="search"
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
              placeholder={t('orders_search_placeholder')}
              autoComplete="off"
              className={cn(
                'w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-body text-text-primary',
                'placeholder:text-text-disabled',
                'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25'
              )}
              aria-label={t('orders_search_aria')}
            />
          </div>
        </div>
      </section>

      {query.isLoading ? <OrdersListSkeleton /> : null}

      {query.isError ? (
        <div className="rounded-md border border-border bg-surface p-6 text-center">
          <p className="m-0 text-body text-danger">{t('orders_load_error')}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4 rounded-sm"
            onClick={() => void query.refetch()}
          >
            {t('orders_retry')}
          </Button>
        </div>
      ) : null}

      {query.isSuccess && orders.length === 0 ? <OrdersEmptyState /> : null}

      {query.isSuccess && orders.length > 0 ? (
        <>
          {productsQuery.isError && allProductIds.length > 0 ? (
            <div className="mb-1.5 rounded-sm border border-border bg-background/80 px-3 py-1.5">
              <p className="m-0 text-caption text-danger">{t('orders_detail_products_load_error')}</p>
              <button
                type="button"
                onClick={() => void productsQuery.refetch()}
                className={cn(
                  'mt-1.5 text-caption font-medium text-primary hover:text-primary-dark hover:underline',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm'
                )}
              >
                {t('orders_detail_products_retry')}
              </button>
            </div>
          ) : null}
          {filteredDisplayOrders.length === 0 && orderSearch.trim() !== '' ? (
            <div className="rounded-lg border border-border bg-surface px-4 py-8 text-center shadow-sm">
              <p className="m-0 text-body text-text-secondary">{t('orders_search_no_results')}</p>
            </div>
          ) : (
            <ul className="m-0 list-none space-y-4 p-0">
              {filteredDisplayOrders.map((o) => (
                <li key={o.id}>
                  <OrderCard
                    order={o}
                    productById={productById}
                    productsLoading={productsLoading}
                    linesEnrichPending={lineEnrichPendingByOrderId.get(o.id) ?? false}
                    linesEnrichFailed={lineEnrichFailedByOrderId.get(o.id) ?? false}
                    onRetryLinesEnrich={
                      lineEnrichFailedByOrderId.get(o.id)
                        ? () =>
                            void queryClient.invalidateQueries({
                              queryKey: orderListEnrichDetailQueryKey(o.id),
                            })
                        : undefined
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}
    </div>
  );
}
