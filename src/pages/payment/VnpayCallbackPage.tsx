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
import { VNPAY_POLL_MAX_MS } from '../../lib/vnpayPolling';
import { VnpayUrlResponseBanner } from '../../components/payment/VnpayUrlResponseBanner';
import { Button } from '../../components/ui/Button';
import MainFooter from '../../layout/footer/MainFooter';
import MainHeader from '../../layout/header/MainHeader';
import { notify } from '../../utils/notify';
import { cn } from '../../lib/cn';
import { CheckCircle2, Loader2 } from 'lucide-react';

/** Số giây đếm ngược trên màn hình thành công trước khi tự chuyển về Đơn hàng. */
const SUCCESS_REDIRECT_SECONDS = 5;

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

function formatCountdownMmSs(totalMs: number): string {
  const ms = Math.max(0, totalMs);
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Đếm ngược tới `expiresAt` (ISO); cập nhật mỗi giây. */
function useMillisUntil(iso: string | undefined | null): number | null | undefined {
  const [v, setV] = useState<number | null | undefined>(undefined);
  useEffect(() => {
    if (iso == null || String(iso).trim() === '') {
      setV(null);
      return;
    }
    const end = Date.parse(String(iso));
    if (!Number.isFinite(end)) {
      setV(null);
      return;
    }
    const tick = () => setV(end - Date.now());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [iso]);
  return v;
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
          removeItem(parsed.productId, parsed.unitId, parsed.productVariantId);
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
  /** Mốc dừng poll (~2 phút): hết hạn thì ngừng hỏi BE và hiển thị kết quả cuối/timeout. */
  const pollDeadlineRef = useRef<number | null>(null);
  const [pollTimedOut, setPollTimedOut] = useState(false);
  /** Màn hình thanh toán thành công + đếm ngược chuyển về Đơn hàng. */
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [successCountdown, setSuccessCountdown] = useState(SUCCESS_REDIRECT_SECONDS);
  const [successOrderId, setSuccessOrderId] = useState<number | null>(null);

  const goToOrders = useCallback(() => navigate('/orders', { replace: true }), [navigate]);

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
        /** Xóa ngay — luồng 00 thường điều hướng trước khi effect COMPLETED chạy nên giỏ không được gỡ nếu chỉ dựa vào useEffect bên dưới. */
        removeVnpayLinesFromCart(lineKeysForOrder);
        clearStoredCheckoutLineKeys();
        clearVnpayPendingContext();
        // Hiển thị màn hình thành công + đếm ngược thay vì chuyển ngay.
        setPaymentSuccess(true);
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

  // Bắt đầu đếm cửa sổ poll khi luồng return sẵn sàng; hết ~2 phút thì dừng + báo timeout.
  useEffect(() => {
    if (!returnFlowReady) return;
    if (pollDeadlineRef.current == null) {
      pollDeadlineRef.current = Date.now() + VNPAY_POLL_MAX_MS;
    }
    const remaining = Math.max(0, pollDeadlineRef.current - Date.now());
    const id = window.setTimeout(() => setPollTimedOut(true), remaining);
    return () => window.clearTimeout(id);
  }, [returnFlowReady]);

  // Đếm ngược trên màn hình thành công rồi tự chuyển về Đơn hàng.
  useEffect(() => {
    if (!paymentSuccess) return;
    if (successCountdown <= 0) {
      goToOrders();
      return;
    }
    const id = window.setTimeout(() => setSuccessCountdown((c) => c - 1), 1000);
    return () => window.clearTimeout(id);
  }, [paymentSuccess, successCountdown, goToOrders]);

  const pendingQuery = useQuery({
    queryKey: ['vnpay-pending', transactionPublicId],
    queryFn: () => orderService.getVnpayPending(transactionPublicId!),
    enabled: Boolean(transactionPublicId) && returnFlowReady,
    refetchInterval: (q) => {
      if (!isPendingState(q.state.data?.state)) return false;
      // Dừng poll khi quá cửa sổ thời gian (BE cũng đã ngừng querydr).
      if (pollDeadlineRef.current != null && Date.now() >= pollDeadlineRef.current) return false;
      return (vnpResponseCode ?? '').trim() === '00' ? 2000 : 2800;
    },
  });

  const expiresAtIso = pendingQuery.data?.expiresAt ?? null;
  const msUntilExpiry = useMillisUntil(expiresAtIso);
  const checkoutSessionIdDisplay =
    pendingQuery.data?.checkoutSessionId ?? ctx?.checkoutSessionId ?? null;

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
      setSuccessOrderId(order.id ?? null);
      setPaymentSuccess(true);
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

  if (paymentSuccess) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <MainHeader />
        <main className="mx-auto flex w-full max-w-container flex-1 flex-col items-center justify-center px-4 py-16">
          <div className="w-full max-w-md rounded-lg border border-border bg-surface p-8 text-center shadow-sm">
            <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-success/10">
              <CheckCircle2 className="size-12 text-success" aria-hidden />
            </div>
            <h1 className="mt-6 text-display text-text-primary">{t('vnpay_success_title')}</h1>
            <p className="mt-2 text-body text-text-secondary">{t('vnpay_success_subtitle')}</p>
            <p className="mt-6 text-body text-text-secondary" aria-live="polite">
              {t('vnpay_success_redirect').replace('{n}', String(Math.max(0, successCountdown)))}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={goToOrders}
                className={cn(
                  'inline-flex items-center justify-center rounded-sm border-0 bg-[#1a94ff] px-5 py-2.5',
                  'text-body font-semibold text-white hover:brightness-[1.03] focus-visible:outline-none',
                  'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
                )}
              >
                {t('vnpay_success_go_now')}
              </button>
              {successOrderId != null ? (
                <Link
                  to={`/orders/${successOrderId}`}
                  className={cn(
                    'inline-flex items-center justify-center rounded-sm border border-border bg-surface px-5 py-2.5',
                    'text-body font-medium text-text-primary hover:bg-background focus-visible:outline-none',
                    'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
                  )}
                >
                  {t('vnpay_callback_view_order')}
                </Link>
              ) : null}
            </div>
          </div>
        </main>
        <MainFooter />
      </div>
    );
  }

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
              {checkoutSessionIdDisplay != null ? (
                <div>
                  <dt className="text-caption text-text-secondary">
                    {t('vnpay_callback_session_checkout_id')}
                  </dt>
                  <dd className="m-0 font-mono text-sm">{String(checkoutSessionIdDisplay)}</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-caption text-text-secondary">
                  {t('vnpay_callback_session_state')}
                </dt>
                <dd className="m-0">{String(pendingQuery.data.state)}</dd>
              </div>
              {expiresAtIso ? (
                <div>
                  <dt className="text-caption text-text-secondary">{t('vnpay_callback_session_expires')}</dt>
                  <dd className="m-0 text-text-primary">
                    <span>{new Date(expiresAtIso).toLocaleString()}</span>
                    {typeof msUntilExpiry === 'number' && msUntilExpiry > 0 ? (
                      <span className="ml-2 text-caption text-warning">
                        {t('vnpay_session_countdown_remaining').replace(
                          '{time}',
                          formatCountdownMmSs(msUntilExpiry)
                        )}
                      </span>
                    ) : typeof msUntilExpiry === 'number' && msUntilExpiry <= 0 ? (
                      <span className="ml-2 text-caption text-danger">{t('vnpay_session_expired_notice')}</span>
                    ) : null}
                  </dd>
                </div>
              ) : null}
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

            {isSessionPending && !pollTimedOut ? (
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

            {isSessionPending && pollTimedOut ? (
              <div className="mt-4 space-y-3">
                <p className="m-0 text-body font-medium text-warning">
                  {t('vnpay_callback_timeout_title')}
                </p>
                <p className="m-0 text-body text-text-secondary">{t('vnpay_callback_timeout_hint')}</p>
                <div className="flex flex-wrap gap-3">
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
