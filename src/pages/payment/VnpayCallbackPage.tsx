import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type BlockerFunction, useBlocker } from 'react-router';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../../app/cart/CartProvider';
import { orderService } from '../../api/services';
import { useI18n } from '../../i18n/I18nProvider';
import { formatPrice } from '../../lib/formatPrice';
import { parseCartLineKey } from '../../lib/cartStorage';
import { clearStoredCheckoutLineKeys, peekStoredCheckoutLineKeys, saveCheckoutLineKeys } from '../../lib/checkoutIntent';
import { setVnpayCheckoutFailureFlag } from '../../lib/vnpayCheckoutFailure';
import {
  clearVnpayPendingContext,
  readVnpayPendingContext,
} from '../../lib/vnpayPendingStorage';
import { clearVnpayOrdersAwaitPayload, setVnpayOrdersAwaitPayload } from '../../lib/vnpayOrdersAwaitStorage';
import { isVnpayPaymentFailedRedirectToCheckout } from '../../lib/vnpayResponseCodeMap';
import { VnpayUrlResponseBanner } from '../../components/payment/VnpayUrlResponseBanner';
import { Button } from '../../components/ui/Button';
import MainFooter from '../../layout/footer/MainFooter';
import MainHeader from '../../layout/header/MainHeader';
import { notify } from '../../utils/notify';
import { cn } from '../../lib/cn';
import { Loader2 } from 'lucide-react';

function normState(s: string | undefined): string {
  return (s ?? '').trim().toUpperCase();
}

function isTerminalVnpayState(s: string | undefined): boolean {
  const u = normState(s);
  return ['EXPIRED', 'FAILED', 'CANCELLED', 'COMPLETED'].includes(u);
}

function isPendingState(s: string | undefined): boolean {
  return normState(s) === 'PENDING';
}

/** Gọi `POST .../dev-simulate-success` (chỉ khi cần mô phỏng IPN local). Tắt: `VITE_VNPAY_DEV_SIMULATE_SUCCESS` không set và build production. */
function isVnpayDevSimulateClientEnabled(): boolean {
  if (import.meta.env.DEV) return true;
  return import.meta.env.VITE_VNPAY_DEV_SIMULATE_SUCCESS === 'true';
}

export default function VnpayCallbackPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { removeItem } = useCart();

  const removeVnpayLinesFromCart = useCallback(
    (lineKeys: string[]) => {
      for (const key of lineKeys) {
        const parsed = parseCartLineKey(key);
        if (parsed) {
          removeItem(parsed.productId, parsed.unitId);
        }
      }
    },
    [removeItem]
  );
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const vnpResponseCode = searchParams.get('vnp_ResponseCode');
  const searchParamsKey = searchParams.toString();
  const terminalHandledRef = useRef(false);
  const [abandonUiPending, setAbandonUiPending] = useState(false);
  const [returnFlowReady, setReturnFlowReady] = useState(false);

  const ctx = useMemo(() => readVnpayPendingContext(), []);
  const transactionPublicId = ctx?.transactionPublicId ?? null;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const sp = new URLSearchParams(searchParamsKey);
      const rawCode = (sp.get('vnp_ResponseCode') ?? '').trim();
      const hasVnpParams = [...sp.keys()].some((k) => k.startsWith('vnp_'));

      // VNPAY Return: browser đã gọi GET BE `/payment/vnpay/return`, BE verify + redirect sang FE kèm query.
      // Không POST body vnp_* lên `/orders/...` — chỉ đọc query ở đây và poll bằng GET có JWT:
      if (transactionPublicId && hasVnpParams) {
        try {
          await orderService.getVnpayTransactionStatus(transactionPublicId);
        } catch {
          // ignore
        }
        await queryClient.invalidateQueries({ queryKey: ['vnpay-pending', transactionPublicId] });
      }

      if (cancelled) return;

      if (rawCode === '00' && transactionPublicId) {
        if (isVnpayDevSimulateClientEnabled()) {
          // Local: IPN thường không tới — BE bật `vnpay.dev-simulate-success-enabled` mới nhận; idempotent nếu IPN đã chạy.
          await orderService.devSimulateVnpaySuccess(transactionPublicId);
        }
        await queryClient.invalidateQueries({ queryKey: ['vnpay-pending', transactionPublicId] });
        const lineKeysForOrder =
          ctx?.lineKeys?.length ? ctx.lineKeys : peekStoredCheckoutLineKeys();
        if (ctx?.lineKeys?.length) {
          saveCheckoutLineKeys(ctx.lineKeys);
        } else if (lineKeysForOrder.length) {
          saveCheckoutLineKeys(lineKeysForOrder);
        }
        setVnpayOrdersAwaitPayload({
          transactionPublicId,
          lineKeys: lineKeysForOrder,
        });
        /** Xóa ngay — luồng 00 thường `navigate` trước khi effect COMPLETED chạy nên giỏ không được gỡ nếu chỉ dựa vào useEffect bên dưới. */
        removeVnpayLinesFromCart(lineKeysForOrder);
        clearStoredCheckoutLineKeys();
        clearVnpayPendingContext();
        navigate('/orders', { replace: true });
        return;
      }

      if (isVnpayPaymentFailedRedirectToCheckout(rawCode || null)) {
        if (transactionPublicId) {
          try {
            await orderService.abandonVnpayPending(transactionPublicId);
          } catch {
            // Phiên có thể không còn PENDING (đã FAILED/EXPIRED ở BE) — vẫn về checkout + popup
          }
        }
        if (ctx?.lineKeys?.length) {
          saveCheckoutLineKeys(ctx.lineKeys);
        }
        setVnpayCheckoutFailureFlag(rawCode);
        clearVnpayPendingContext();
        navigate('/checkout', { replace: true });
        return;
      }

      setReturnFlowReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [transactionPublicId, searchParamsKey, navigate, queryClient, ctx, removeVnpayLinesFromCart]);

  const pendingQuery = useQuery({
    queryKey: ['vnpay-pending', transactionPublicId],
    queryFn: () => orderService.getVnpayPending(transactionPublicId!),
    enabled: Boolean(transactionPublicId) && returnFlowReady,
    refetchInterval: (q) => {
      if (!isPendingState(q.state.data?.state)) return false;
      return (vnpResponseCode ?? '').trim() === '00' ? 2000 : 2800;
    },
  });

  const state = pendingQuery.data?.state;
  const stateU = normState(state);
  const order = pendingQuery.data?.order;
  const isSessionPending = isPendingState(pendingQuery.data?.state);

  const shouldBlockLeaveWhilePending = useCallback<BlockerFunction>(
    ({ currentLocation, nextLocation }) => {
      if (!transactionPublicId) return false;
      if (!isSessionPending) return false;
      if (currentLocation.pathname !== '/payment/vnpay-callback') return false;
      if (nextLocation.pathname === '/payment/vnpay-callback') return false;
      return true;
    },
    [transactionPublicId, isSessionPending]
  );

  const leaveWhilePendingBlocker = useBlocker(shouldBlockLeaveWhilePending);

  const runAbandonAndClearLocal = useCallback(async () => {
    if (transactionPublicId) {
      try {
        await orderService.abandonVnpayPending(transactionPublicId);
      } catch {
        // Phiên có thể đã FAILED/EXPIRED/COMPLETED — vẫn xóa bản ghi phía client.
      }
    }
    clearVnpayPendingContext();
  }, [transactionPublicId]);

  const confirmLeaveWhilePending = useCallback(async () => {
    setAbandonUiPending(true);
    try {
      await runAbandonAndClearLocal();
      leaveWhilePendingBlocker.proceed?.();
    } finally {
      setAbandonUiPending(false);
    }
  }, [runAbandonAndClearLocal, leaveWhilePendingBlocker]);

  const onCancelSessionClick = useCallback(async () => {
    if (!transactionPublicId) return;
    setAbandonUiPending(true);
    try {
      try {
        await orderService.abandonVnpayPending(transactionPublicId);
      } catch {
        // 400 nếu phiên không còn PENDING — vẫn xóa context phía client và về giỏ
      }
      clearVnpayPendingContext();
      navigate('/cart', { replace: true });
    } finally {
      setAbandonUiPending(false);
    }
  }, [transactionPublicId, navigate]);

  useEffect(() => {
    if (!transactionPublicId) return;
    if (!stateU || !isTerminalVnpayState(stateU)) return;

    if (stateU === 'COMPLETED' && order?.id && order?.orderCode) {
      const doneKey = `ecomx_vnpay_settled_ok_${transactionPublicId}`;
      if (sessionStorage.getItem(doneKey)) return;
      sessionStorage.setItem(doneKey, '1');
      const lineKeysToRemove = ctx?.lineKeys?.length ? ctx.lineKeys : peekStoredCheckoutLineKeys();
      removeVnpayLinesFromCart(lineKeysToRemove);
      clearStoredCheckoutLineKeys();
      void queryClient.invalidateQueries({ queryKey: ['user-orders'] });
      clearVnpayPendingContext();
      clearVnpayOrdersAwaitPayload();
      notify.success(t('checkout_success').replace('{code}', order.orderCode));
      navigate('/orders', { replace: true });
      return;
    }

    if (terminalHandledRef.current) return;

    if (stateU === 'CANCELLED') {
      terminalHandledRef.current = true;
      void (async () => {
        try {
          await orderService.abandonVnpayPending(transactionPublicId);
        } catch {
          // Idempotent / đã hủy ở BE — bỏ qua
        }
        clearVnpayPendingContext();
      })();
      return;
    }

    if (stateU === 'EXPIRED' || stateU === 'FAILED') {
      terminalHandledRef.current = true;
      clearVnpayPendingContext();
    }
  }, [transactionPublicId, stateU, order, ctx?.lineKeys, removeVnpayLinesFromCart, queryClient, t, navigate]);

  const hasVnpResponseCode = vnpResponseCode != null && vnpResponseCode.trim() !== '';

  if (!returnFlowReady) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <MainHeader />
        <main className="mx-auto flex w-full max-w-container flex-1 flex-col items-center justify-center px-4 py-16">
          <Loader2 className="size-10 animate-spin text-primary" aria-hidden />
          <p className="mt-4 text-center text-body text-text-secondary">{t('vnpay_callback_applying_return')}</p>
        </main>
        <MainFooter />
      </div>
    );
  }

  if (!transactionPublicId) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <MainHeader />
        <main className="mx-auto w-full max-w-container flex-1 px-4 py-10 tablet:px-6">
          <h1 className="text-display text-text-primary">{t('vnpay_callback_title')}</h1>
          <VnpayUrlResponseBanner vnpResponseCode={vnpResponseCode} t={t} className="mt-4" />
          <p className="mt-4 text-body text-text-secondary">
            {t(
              hasVnpResponseCode
                ? 'vnpay_callback_missing_stored_session'
                : 'vnpay_callback_no_params'
            )}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/orders"
              className={cn(
                'inline-flex items-center justify-center rounded-sm border-0 bg-[#1a94ff] px-4 py-2.5',
                'text-body font-semibold text-white hover:brightness-[1.03] focus-visible:outline-none',
                'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
              )}
            >
              {t('vnpay_callback_orders')}
            </Link>
            <Link
              to="/cart"
              className={cn(
                'inline-flex items-center justify-center rounded-sm border border-border bg-surface px-4 py-2.5',
                'text-body font-medium text-text-primary hover:bg-background focus-visible:outline-none',
                'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
              )}
            >
              {t('vnpay_callback_back_cart')}
            </Link>
          </div>
        </main>
        <MainFooter />
      </div>
    );
  }

  const showPollLoading = pendingQuery.isLoading && !pendingQuery.data;
  const errMsg = pendingQuery.isError
    ? pendingQuery.error instanceof Error
      ? pendingQuery.error.message
      : t('vnpay_callback_session_lookup_error')
    : null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MainHeader />
      <main className="mx-auto w-full max-w-container flex-1 px-4 py-8 tablet:px-6">
        <h1 className="text-display text-text-primary">{t('vnpay_callback_title')}</h1>
        <VnpayUrlResponseBanner vnpResponseCode={vnpResponseCode} t={t} className="mt-4" />
        <p className="mt-2 text-caption text-text-secondary">{t('vnpay_callback_sync_hint')}</p>

        {showPollLoading ? (
          <div className="mt-8 flex items-center gap-2 text-body text-text-secondary">
            <Loader2 className="size-5 animate-spin" aria-hidden />
            {t('vnpay_callback_session_lookup_loading')}
          </div>
        ) : null}

        {errMsg && !showPollLoading ? (
          <p className="mt-6 text-body text-danger">{errMsg}</p>
        ) : null}

        {pendingQuery.data ? (
          <section className="mt-8 rounded-md border border-border bg-surface p-4 shadow-sm">
            <h2 className="m-0 text-heading text-text-primary">
              {t('checkout_vnpay_session_block_title')}
            </h2>
            <p className="mt-1 text-caption text-text-secondary">
              {t('checkout_vnpay_pending_inline_subtitle')}
            </p>
            <dl className="mt-4 space-y-2 text-body">
              <div>
                <dt className="text-caption text-text-secondary">
                  {t('vnpay_callback_session_public_id')}
                </dt>
                <dd className="m-0 break-all font-mono text-sm">{transactionPublicId}</dd>
              </div>
              <div>
                <dt className="text-caption text-text-secondary">
                  {t('vnpay_callback_session_state')}
                </dt>
                <dd className="m-0">{String(pendingQuery.data.state)}</dd>
              </div>
              {pendingQuery.data.pendingTotal != null ? (
                <div>
                  <dt className="text-caption text-text-secondary">
                    {t('vnpay_callback_session_total')}
                  </dt>
                  <dd className="m-0">{formatPrice(pendingQuery.data.pendingTotal)}</dd>
                </div>
              ) : null}
              {pendingQuery.data.paymentMethod?.name ? (
                <div>
                  <dt className="text-caption text-text-secondary">
                    {t('vnpay_callback_session_payment_method')}
                  </dt>
                  <dd className="m-0">{pendingQuery.data.paymentMethod.name}</dd>
                </div>
              ) : null}
              {pendingQuery.data.deliveryAddress ? (
                <div>
                  <dt className="text-caption text-text-secondary">{t('checkout_delivery_title')}</dt>
                  <dd className="m-0 text-text-primary">{pendingQuery.data.deliveryAddress}</dd>
                </div>
              ) : null}
            </dl>

            {isSessionPending ? (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2 text-body text-text-secondary">
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  {t('vnpay_callback_waiting_ipn')}
                </div>
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-sm"
                    loading={abandonUiPending}
                    disabled={abandonUiPending}
                    onClick={() => void onCancelSessionClick()}
                  >
                    {t('vnpay_callback_abandon_session')}
                  </Button>
                </div>
              </div>
            ) : null}

            {stateU === 'COMPLETED' && order?.id ? (
              <div className="mt-6">
                <Link
                  to={`/orders/${order.id}`}
                  className={cn(
                    'inline-flex items-center justify-center rounded-sm border-0 bg-[#1a94ff] px-4 py-2.5',
                    'text-body font-semibold text-white hover:brightness-[1.03] focus-visible:outline-none',
                    'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
                  )}
                >
                  {t('vnpay_callback_view_order')}
                </Link>
              </div>
            ) : null}

            {isTerminalVnpayState(stateU) && stateU !== 'COMPLETED' ? (
              <div className="mt-6 space-y-3">
                <p className="m-0 text-body text-text-secondary">
                  {t('vnpay_callback_payment_failed_title')}
                </p>
                <p className="m-0 text-body text-text-secondary">{t('vnpay_callback_fail_hint')}</p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    to="/cart"
                    className={cn(
                      'inline-flex items-center justify-center rounded-sm border border-border bg-surface px-4 py-2.5',
                      'text-body font-medium text-text-primary hover:bg-background focus-visible:outline-none',
                      'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
                    )}
                  >
                    {t('vnpay_callback_back_cart')}
                  </Link>
                  <Link
                    to="/orders"
                    className={cn(
                      'inline-flex items-center justify-center rounded-sm border-0 bg-[#1a94ff] px-4 py-2.5',
                      'text-body font-semibold text-white hover:brightness-[1.03] focus-visible:outline-none',
                      'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
                    )}
                  >
                    {t('vnpay_callback_orders')}
                  </Link>
                </div>
              </div>
            ) : null}
          </section>
        ) : null}
      </main>
      <MainFooter />

      {leaveWhilePendingBlocker.state === 'blocked' ? (
        <div
          className="fixed inset-0 z-[225] flex items-center justify-center bg-background/80 p-4 backdrop-blur-[2px]"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="vnpay-pending-leave-title"
          aria-describedby="vnpay-pending-leave-desc"
        >
          <div className="w-full max-w-md rounded-md border border-border bg-surface p-5 shadow-lg tablet:p-6">
            <h2 id="vnpay-pending-leave-title" className="m-0 text-heading text-text-primary">
              {t('vnpay_callback_block_pending_title')}
            </h2>
            <p id="vnpay-pending-leave-desc" className="mb-0 mt-3 text-body leading-relaxed text-text-secondary">
              {t('vnpay_callback_block_pending_body')}
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-sm sm:w-auto"
                disabled={abandonUiPending}
                onClick={() => leaveWhilePendingBlocker.reset?.()}
              >
                {t('vnpay_callback_stay')}
              </Button>
              <Button
                type="button"
                variant="profilePrimary"
                className="w-full rounded-sm sm:w-auto"
                loading={abandonUiPending}
                disabled={abandonUiPending}
                onClick={() => void confirmLeaveWhilePending()}
              >
                {t('checkout_leave_go_home')}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
