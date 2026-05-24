import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type BlockerFunction, useBlocker } from 'react-router';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../app/auth/AuthProvider';
import { useCart } from '../app/cart/CartProvider';
import { addressService, orderService, shippingService } from '../api/services';
import { QuantityInput } from '../components/product/QuantityInput';
import { Button } from '../components/ui/Button';
import { formatAddressDetail } from '../domain/address/formatAddressDetail';
import { useEcomxCartProductDetails, cartLineDisplayFromByIds } from '../hooks/useEcomxCartProductDetails';
import { currentUnitName } from '../lib/cartLineProductResolve';
import { useI18n } from '../i18n/I18nProvider';
import { cartLineKey, type CartLine } from '../lib/cartStorage';
import {
  abandonCheckoutSessionStorage,
  consumeCheckoutLineKeys,
  saveCheckoutLineKeys,
} from '../lib/checkoutIntent';
import { consumeVnpayCheckoutFailure } from '../lib/vnpayCheckoutFailure';
import { saveVnpayPendingContext, clearVnpayPendingContext } from '../lib/vnpayPendingStorage';
import { getVnpayResponseCodeMeta } from '../lib/vnpayResponseCodeMap';
import { savePostActionReturnPath } from '../lib/postActionReturnPath';
import type { CreateOrderRequestBody, CheckoutPwpSuggestionDto } from '../api/types/order.types';
import { formatPrice } from '../lib/formatPrice';
import { stringifyOrderDescription } from '../lib/orderDescriptionJson';
import { isCodPaymentMethod } from '../lib/paymentMethodUtils';
import { getAddressShippingSnapshot } from '../lib/userAddressShipping';
import { cn } from '../lib/cn';
import type { ShippingDistanceResponse } from '../api/types/shipping.types';
import MainFooter from '../layout/footer/MainFooter';
import MainHeader from '../layout/header/MainHeader';
import { userAddressesQueryKey } from '../hooks/useUserAddresses';
import { notify } from '../utils/notify';
import { reportCollectorBuyOnceForLines } from '../lib/collectorBehavior';
import { PromoLineBadges } from '../components/checkout/PromoLineBadges';

const checkoutQtyClass =
  '!h-8 !shadow-none rounded-sm [&_button]:!h-8 [&_button]:!w-7 [&_input]:!h-8 [&_input]:!w-9 [&_input]:!text-sm tablet:justify-self-center';

function isVnpayPaymentMethodCode(code: string | undefined): boolean {
  return code?.trim().toUpperCase() === 'VNPAY';
}

export default function CheckoutPage() {
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lines, setQuantity, removeItem } = useCart();
  const queryClient = useQueryClient();
  const skipLeaveConfirmRef = useRef(false);

  const locState = location.state as { keys?: string[] } | null;
  const routeKeys = locState?.keys;

  const consumedKeys = useMemo(() => {
    if (routeKeys?.length) return routeKeys;
    return consumeCheckoutLineKeys();
  }, [routeKeys]);

  const keySet = useMemo(() => {
    if (!consumedKeys?.length) return null;
    return new Set(consumedKeys);
  }, [consumedKeys]);

  const checkoutLines = useMemo(() => {
    if (!keySet) return lines;
    return lines.filter((l) => keySet.has(cartLineKey(l)));
  }, [lines, keySet]);

  const shouldBlockLeavingCheckout = useCallback<BlockerFunction>(
    ({ currentLocation, nextLocation }) => {
      if (skipLeaveConfirmRef.current) return false;
      if (checkoutLines.length === 0) return false;
      if (currentLocation.pathname !== '/checkout') return false;
      if (nextLocation.pathname === '/checkout') return false;
      if (nextLocation.pathname.startsWith('/account/address')) return false;
      return true;
    },
    [checkoutLines.length]
  );

  const leaveCheckoutBlocker = useBlocker(shouldBlockLeavingCheckout);

  useEffect(() => {
    if (checkoutLines.length === 0) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (skipLeaveConfirmRef.current) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [checkoutLines.length]);

  const stayOnCheckout = useCallback(() => {
    leaveCheckoutBlocker.reset?.();
  }, [leaveCheckoutBlocker]);

  const confirmAbandonCheckout = useCallback(() => {
    abandonCheckoutSessionStorage();
    skipLeaveConfirmRef.current = true;
    leaveCheckoutBlocker.reset?.();
    navigate('/', { replace: true });
  }, [leaveCheckoutBlocker, navigate]);

  const { byId, isLoading: checkoutProductsLoading } = useEcomxCartProductDetails(checkoutLines);

  const armReturnToCheckoutAfterAddressSave = useCallback(() => {
    savePostActionReturnPath('/checkout');
    if (consumedKeys?.length) saveCheckoutLineKeys(consumedKeys);
  }, [consumedKeys]);

  const addressesQuery = useQuery({
    queryKey: userAddressesQueryKey,
    queryFn: () => addressService.list(),
  });

  const paymentQuery = useQuery({
    queryKey: ['payment-methods'],
    queryFn: () => orderService.listPaymentMethods(),
    staleTime: 5 * 60 * 1000,
  });

  const paymentMethodOptions = useMemo(() => {
    const list = paymentQuery.data ?? [];
    return [...list].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [paymentQuery.data]);

  const [paymentMethodId, setPaymentMethodId] = useState<number | null>(null);
  const [vnpayRedirecting, setVnpayRedirecting] = useState(false);
  const [vnpayFailureCode, setVnpayFailureCode] = useState<string | null>(null);
  const [orderNote, setOrderNote] = useState('');
  const [sellerNote, setSellerNote] = useState('');

  /**
   * PwP offers mà user đã chấp nhận mua kèm.
   * Key = offerId, value = full suggestion DTO (để hiển thị companion card + tính order line).
   */
  const [acceptedPwpByOfferId, setAcceptedPwpByOfferId] = useState<
    Record<number, CheckoutPwpSuggestionDto>
  >({});

  /** Chấp nhận mua kèm: lưu toàn bộ suggestion DTO để derive companion line trong orderDetailsPayload. */
  const handleAcceptPwpSuggestion = useCallback((suggestion: CheckoutPwpSuggestionDto) => {
    if (suggestion.companion_variant_id == null) return;
    setAcceptedPwpByOfferId((prev) => ({ ...prev, [suggestion.offer_id]: suggestion }));
  }, []);

  /** Từ chối / bỏ chọn một PwP offer. */
  const handleRejectPwpSuggestion = useCallback((offerId: number) => {
    setAcceptedPwpByOfferId((prev) => {
      const next = { ...prev };
      delete next[offerId];
      return next;
    });
  }, []);

  const vnpayFailureMessage = useMemo(() => {
    if (vnpayFailureCode == null) return null;
    const meta = getVnpayResponseCodeMeta(vnpayFailureCode);
    if (!meta) return null;
    return meta.isKnown
      ? t(meta.i18nKey)
      : t(meta.i18nKey).replace(/\{code\}/g, meta.rawCode);
  }, [vnpayFailureCode, t]);

  useEffect(() => {
    const c = consumeVnpayCheckoutFailure();
    if (c?.code) {
      setVnpayFailureCode(c.code);
    }
  }, []);

  const addresses = addressesQuery.data ?? [];
  const defaultDeliveryAddress = useMemo(
    () => (addressesQuery.data ?? []).find((a) => a.isDefault) ?? null,
    [addressesQuery.data]
  );
  const selectedAddress = defaultDeliveryAddress;

  const addressLineForShipping = useMemo(() => {
    if (!defaultDeliveryAddress) return '';
    return formatAddressDetail(defaultDeliveryAddress);
  }, [defaultDeliveryAddress]);

  const shippingQuoteQuery = useQuery({
    queryKey: ['checkout', 'shipping', defaultDeliveryAddress?.id, addressLineForShipping] as const,
    queryFn: async ({ signal }): Promise<ShippingDistanceResponse> => {
      if (!defaultDeliveryAddress) {
        throw new Error('no address');
      }
      const { shippingFeeVnd, distanceToWarehouseMeters } =
        getAddressShippingSnapshot(defaultDeliveryAddress);
      if (shippingFeeVnd != null && distanceToWarehouseMeters != null) {
        const dm = distanceToWarehouseMeters;
        return {
          distanceMeters: dm,
          distanceKilometers: Math.round((dm / 1000) * 100) / 100,
          durationSeconds: 0,
          resolvedAddress: null,
          originLatitude: 0,
          originLongitude: 0,
          warehouseLatitude: 0,
          warehouseLongitude: 0,
          shippingFeeVnd,
        };
      }
      return shippingService.getDistanceToWarehouse(addressLineForShipping, { signal });
    },
    enabled:
      Boolean(defaultDeliveryAddress) &&
      !addressesQuery.isLoading &&
      addressLineForShipping.trim().length > 0,
    staleTime: 60_000,
  });

  useEffect(() => {
    const list = paymentMethodOptions;
    if (!list.length || paymentMethodId != null) return;
    const firstCod = list.find((m) => isCodPaymentMethod(m.code));
    setPaymentMethodId((firstCod ?? list[0]).id);
  }, [paymentMethodOptions, paymentMethodId]);

  const orderDetailsPayload = useMemo((): CreateOrderRequestBody['orderDetails'] | null => {
    if (checkoutProductsLoading) return null;
    const baseLines = checkoutLines.map((l) => {
      const p = byId.get(l.productId);
      const un = currentUnitName(p, l.unitId, l);
      const row: CreateOrderRequestBody['orderDetails'][number] = {
        quantity: l.quantity,
        description: stringifyOrderDescription({
          unit: un === '—' ? '' : un,
          message: '',
          note: '',
        }),
      };
      if (l.productVariantId != null && l.productVariantId > 0) {
        row.productVariantId = l.productVariantId;
        row.productId = l.productId;
      } else {
        row.productId = l.productId;
      }
      return row;
    });
    // Derive companion lines từ PwP đã được user chấp nhận mua kèm
    const companionLines = Object.entries(acceptedPwpByOfferId).map(([, suggestion]) => {
      const anchorVarId = suggestion.anchor_variant_id;
      const anchorQty = anchorVarId
        ? checkoutLines
            .filter((l) => l.productVariantId === anchorVarId)
            .reduce((s, l) => s + l.quantity, 0)
        : 1;
      const per = suggestion.companion_promo_units_per_anchor ?? 1;
      const maxQ = suggestion.max_companion_promo_units;
      const eligibleQty = maxQ != null ? Math.min(anchorQty * per, maxQ) : anchorQty * per;
      const qty = Math.max(1, eligibleQty);
      const companionLine: CreateOrderRequestBody['orderDetails'][number] = {
        productVariantId: suggestion.companion_variant_id!,
        quantity: qty,
        description: '',
      };
      if (suggestion.companion_product_id != null) {
        companionLine.productId = suggestion.companion_product_id;
      }
      return companionLine;
    });
    return [...baseLines, ...companionLines];
  }, [checkoutProductsLoading, checkoutLines, byId, acceptedPwpByOfferId]);

  const pricingPreviewQuery = useQuery({
    queryKey: ['checkout-pricing-preview', JSON.stringify(orderDetailsPayload)] as const,
    queryFn: ({ signal }) =>
      orderService.checkoutPricingPreview(orderDetailsPayload!, { signal }),
    enabled: orderDetailsPayload != null && checkoutLines.length > 0,
    staleTime: 0,
  });

  const previewSnapshot = pricingPreviewQuery.data;
  const previewLines = previewSnapshot?.lines;

  /** Map variant_id → preview line để tra cứu nhanh (bao gồm cả companion đã được accept). */
  const previewLineByVariantId = useMemo(() => {
    const map = new Map<number, (typeof previewLines)[number]>();
    for (const pl of previewLines ?? []) {
      if (pl.productVariantId != null) {
        map.set(pl.productVariantId, pl);
      }
    }
    return map;
  }, [previewLines]);

  /**
   * Suggestions PwP hiển thị cho user: lấy từ response preview, lọc bỏ những offer
   * đã được accept (companion đã có trong payload → server không trả suggestion nữa).
   */
  const pwpSuggestions = previewSnapshot?.pwp_suggestions ?? [];

  const previewBusy =
    orderDetailsPayload != null &&
    checkoutLines.length > 0 &&
    (pricingPreviewQuery.isPending || pricingPreviewQuery.isFetching);
  const previewFailed =
    orderDetailsPayload != null &&
    checkoutLines.length > 0 &&
    pricingPreviewQuery.isError;

  const itemsMerchandise =
    previewSnapshot?.itemsSubtotal != null ? previewSnapshot.itemsSubtotal : null;
  const voucherDiscount = 0;
  const shippingFeeVnd = shippingQuoteQuery.data?.shippingFeeVnd;
  const grandTotalForSummary =
    itemsMerchandise != null ? itemsMerchandise + (shippingFeeVnd ?? 0) - voucherDiscount : null;

  const pricingPreviewSubmitOk =
    pricingPreviewQuery.isSuccess &&
    pricingPreviewQuery.data != null &&
    !pricingPreviewQuery.isFetching;

  const recipientName = user?.userInfo?.fullName?.trim() || user?.username?.trim() || '';
  const recipientPhone = user?.phoneNumber?.trim() || user?.userInfo?.telephone?.trim() || '';

  const placeOrderMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAddress || paymentMethodId == null) {
        throw new Error('validation');
      }
      const selectedPm = paymentMethodOptions.find((m) => m.id === paymentMethodId);
      if (!selectedPm) throw new Error('validation');
      reportCollectorBuyOnceForLines(checkoutLines);
      /** Có `userAddressId` → BE tự ghép địa chỉ trên đơn; không gửi mỗi chuỗi snapshot. */
      const orderBody: CreateOrderRequestBody['order'] = {
        description: stringifyOrderDescription({
          unit: '',
          message: sellerNote.trim(),
          note: orderNote.trim(),
        }),
        typeOrder: 0,
        deliveryAddress: '',
        paymentMethodId,
        userAddressId: selectedAddress.id,
      };
      const q = shippingQuoteQuery.data;
      if (q != null && Number.isFinite(q.distanceMeters) && q.distanceMeters >= 0) {
        orderBody.deliveryDistanceMeters = Math.round(q.distanceMeters);
      }
      // Dùng lại orderDetailsPayload (đã bao gồm companion PwP được accept)
      if (!orderDetailsPayload) throw new Error('validation');
      return orderService.createOrder({
        order: orderBody,
        orderDetails: orderDetailsPayload,
      });
    },
    onSuccess: async (result) => {
      void queryClient.invalidateQueries({ queryKey: userAddressesQueryKey });
      if (result.outcome === 'PENDING_VNPAY_PAYMENT') {
        setVnpayRedirecting(true);
        const lineKeys = checkoutLines.map((l) => cartLineKey(l));
        try {
          saveVnpayPendingContext({
            transactionPublicId: result.transactionPublicId,
            checkoutSessionId: result.checkoutSessionId,
            lineKeys,
          });
          const { paymentUrl } = await orderService.createVnpayPaymentUrl(result.checkoutSessionId);
          skipLeaveConfirmRef.current = true;
          window.location.assign(paymentUrl);
        } catch (err) {
          clearVnpayPendingContext();
          try {
            await orderService.abandonVnpayPending(result.transactionPublicId);
          } catch {
            // ignore
          }
          const msg =
            err instanceof Error && err.message ? err.message : t('checkout_vnpay_payment_error');
          notify.error(msg);
        } finally {
          setVnpayRedirecting(false);
        }
        return;
      }
      void queryClient.invalidateQueries({ queryKey: ['user-orders'] });
      const created = result.order;
      for (const l of checkoutLines) {
        removeItem(l.productId, l.unitId, l.productVariantId);
      }
      notify.success(t('checkout_success').replace('{code}', created.orderCode));
      skipLeaveConfirmRef.current = true;
      navigate('/orders', { replace: true });
    },
    onError: (err) => {
      if (err instanceof Error && err.message !== 'validation') {
        notify.error(err.message);
      } else {
        notify.error(t('checkout_error_submit'));
      }
    },
  });

  if (checkoutLines.length === 0) {
    return <Navigate to="/cart" replace state={{ message: t('checkout_empty_redirect') }} />;
  }

  const shippingQuoteReady =
    !defaultDeliveryAddress ||
    (shippingQuoteQuery.isSuccess && !shippingQuoteQuery.isError);
  const canSubmit =
    Boolean(selectedAddress) &&
    paymentMethodId != null &&
    !paymentQuery.isLoading &&
    paymentMethodOptions.length > 0 &&
    !placeOrderMutation.isPending &&
    !vnpayRedirecting &&
    !checkoutProductsLoading &&
    shippingQuoteReady &&
    pricingPreviewSubmitOk;

  const selectedPayment = paymentMethodOptions.find((m) => m.id === paymentMethodId);
  const isVnpaySelected = isVnpayPaymentMethodCode(selectedPayment?.code);

  const itemCount = checkoutLines.reduce((n, l) => n + l.quantity, 0);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MainHeader />

      <main className="flex-1 py-6">
        <div className="mx-auto w-full max-w-container px-4 tablet:px-6">
          <h1 className="mb-6 text-display text-text-primary">{t('checkout_page_title')}</h1>

          <div className="space-y-4">
            {/* Địa chỉ */}
            <section className="rounded-md border border-border bg-surface p-4 shadow-header tablet:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
                <div className="flex items-center gap-2 text-heading text-text-primary">
                  <MapPin className="size-5 text-danger" strokeWidth={2} aria-hidden />
                  {t('checkout_delivery_title')}
                </div>
                <Link
                  to="/account/address"
                  onClick={armReturnToCheckoutAfterAddressSave}
                  className="text-body font-medium text-primary transition-colors hover:text-primary-dark hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
                >
                  {t('checkout_change')}
                </Link>
              </div>

              {addressesQuery.isLoading ? (
                <div className="mt-4 h-20 animate-pulse rounded-md bg-border" />
              ) : addresses.length === 0 ? (
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="m-0 text-body text-text-secondary">{t('checkout_no_address')}</p>
                  <Link
                    to="/account/address/new"
                    onClick={armReturnToCheckoutAfterAddressSave}
                    className={cn(
                      'inline-flex items-center justify-center rounded-sm border-0 bg-[#1a94ff] px-4 py-2.5',
                      'text-body font-semibold text-white hover:brightness-[1.03]',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
                    )}
                  >
                    {t('checkout_add_address')}
                  </Link>
                </div>
              ) : defaultDeliveryAddress == null ? (
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="m-0 text-body text-text-secondary">{t('checkout_no_default_address')}</p>
                  <Link
                    to="/account/address"
                    onClick={armReturnToCheckoutAfterAddressSave}
                    className={cn(
                      'inline-flex items-center justify-center rounded-sm border-0 bg-[#1a94ff] px-4 py-2.5',
                      'text-body font-semibold text-white hover:brightness-[1.03]',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
                    )}
                  >
                    {t('checkout_change')}
                  </Link>
                </div>
              ) : (
                <div className="mt-4">
                  <div
                    className={cn(
                      'flex gap-3 rounded-md border border-primary bg-primary/5 p-3 shadow-sm'
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-body font-semibold text-text-primary">{recipientName}</span>
                        {recipientPhone ? (
                          <span className="text-body text-text-secondary">
                            (+84) {recipientPhone.replace(/^0/, '')}
                          </span>
                        ) : null}
                        <span className="rounded border border-warning px-1.5 py-0.5 text-caption font-medium text-warning">
                          {t('checkout_default_badge')}
                        </span>
                      </div>
                      <p className="mt-1 text-body text-text-primary">
                        {formatAddressDetail(defaultDeliveryAddress)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Sản phẩm */}
            <section className="rounded-md border border-border bg-surface shadow-header">
              <div className="hidden border-b border-border bg-background/60 px-4 py-3 text-caption font-semibold uppercase tracking-wide text-text-secondary tablet:grid tablet:grid-cols-[1fr_6.5rem_6.5rem_6.5rem] tablet:gap-3 tablet:px-5">
                <span>{t('checkout_products_title')}</span>
                <span className="text-center">{t('checkout_col_unit_price')}</span>
                <span className="text-center">{t('checkout_col_quantity')}</span>
                <span className="text-right">{t('checkout_col_subtotal')}</span>
              </div>

              {previewFailed ? (
                <div className="border-b border-border bg-danger/[0.06] px-4 py-2.5 tablet:px-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="m-0 text-caption text-danger">{t('checkout_pricing_error')}</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-sm"
                      onClick={() => void pricingPreviewQuery.refetch()}
                    >
                      {t('checkout_pricing_retry')}
                    </Button>
                  </div>
                </div>
              ) : null}

              {previewBusy && !previewSnapshot ? (
                <p className="mb-0 border-b border-border px-4 py-2 text-caption text-text-secondary tablet:px-5">
                  {t('checkout_pricing_loading')}
                </p>
              ) : null}

              <ul className="m-0 divide-y divide-border p-0">
                {checkoutLines.map((line, lineIndex) => {
                  const display = cartLineDisplayFromByIds(line, byId);
                  const p = byId.get(line.productId);
                  const pl = previewLines?.[lineIndex];
                  const hasPreviewData = previewSnapshot != null;
                  const programs = pl?.pricingPrograms ?? null;

                  // ── Giá hiển thị trên cột "Đơn giá" ────────────────────────────
                  // Nếu có PC: hiển thị giá sau khuyến mãi (đã là finalUnitPrice từ BE)
                  // kèm giá gốc gạch ngang bên cạnh
                  const pcOriginalPrice: number | null =
                    programs?.price_change?.base_price != null &&
                    programs.price_change.sale_price != null
                      ? programs.price_change.base_price
                      : null;

                  let priceText: string;
                  let lineSubText: string;
                  if (previewFailed) {
                    priceText = '—';
                    lineSubText = '—';
                  } else if (!hasPreviewData && (previewBusy || orderDetailsPayload == null)) {
                    priceText = '…';
                    lineSubText = '…';
                  } else if (pl?.unitPrice != null) {
                    priceText = formatPrice(pl.unitPrice);
                    lineSubText = formatPrice(
                      pl.lineTotal != null ? pl.lineTotal : pl.unitPrice * line.quantity
                    );
                  } else if (!p && checkoutProductsLoading) {
                    priceText = '…';
                    lineSubText = '…';
                  } else {
                    priceText = '—';
                    lineSubText = '—';
                  }

                  // ── PwP: suggestions cho anchor này + companion đã accepted ───
                  const anchorVariantId = line.productVariantId;
                  // Suggestions chưa được accept (BE trả về khi companion chưa trong giỏ)
                  const linePwpSuggestions = pwpSuggestions.filter(
                    (s) =>
                      s.anchor_variant_id === anchorVariantId &&
                      !(s.offer_id in acceptedPwpByOfferId)
                  );
                  // Companion đã được accept cho anchor này
                  const lineAcceptedCompanions = Object.values(acceptedPwpByOfferId).filter(
                    (s) => s.anchor_variant_id === anchorVariantId
                  );

                  return (
                    <li key={cartLineKey(line)} className="px-4 py-4 tablet:px-5">
                      <div className="grid grid-cols-1 gap-3 tablet:grid-cols-[1fr_6.5rem_6.5rem_6.5rem] tablet:items-center tablet:gap-3">
                        {/* ── Tên + variant + promo badges ─────────────────────── */}
                        <div className="flex min-w-0 gap-3">
                          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md border border-border bg-background">
                            {display.thumbnailUrl ? (
                              <img
                                src={display.thumbnailUrl}
                                alt=""
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-caption text-text-disabled">
                                —
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="line-clamp-2 text-title text-text-primary">{display.productName}</p>
                            <p className="mt-0.5 text-caption text-text-secondary">
                              {t('checkout_variant_prefix')} {display.unitName}
                            </p>
                            {/* Badge ưu đãi PwP / PC / Volume — chỉ hiện khi đã có preview */}
                            {hasPreviewData && (
                              <PromoLineBadges programs={programs} quantity={line.quantity} />
                            )}
                          </div>
                        </div>

                        {/* ── Đơn giá (+ giá gốc gạch ngang nếu có PC) ──────── */}
                        <div className="flex justify-between gap-2 tablet:block tablet:text-center">
                          <span className="text-caption text-text-secondary tablet:hidden">
                            {t('checkout_col_unit_price')}
                          </span>
                          <div className="flex flex-col items-end tablet:items-center">
                            <span
                              className={cn(
                                'text-body font-medium',
                                pcOriginalPrice != null ? 'text-danger' : 'text-text-primary'
                              )}
                            >
                              {priceText}
                            </span>
                            {pcOriginalPrice != null && priceText !== '—' && priceText !== '…' && (
                              <span className="text-[11px] text-text-secondary line-through">
                                {formatPrice(pcOriginalPrice)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* ── Số lượng ──────────────────────────────────────── */}
                        <div className="flex justify-between gap-2 tablet:flex tablet:flex-col tablet:items-center tablet:justify-center tablet:text-center">
                          <span className="text-caption text-text-secondary tablet:hidden">
                            {t('checkout_col_quantity')}
                          </span>
                          <QuantityInput
                            value={line.quantity}
                            min={1}
                            disabled={placeOrderMutation.isPending || vnpayRedirecting}
                            onChange={(n) =>
                              setQuantity(
                                line.productId,
                                line.unitId,
                                Math.min(999, Math.max(1, n)),
                                line.productVariantId
                              )
                            }
                            className={checkoutQtyClass}
                          />
                        </div>

                        {/* ── Thành tiền ────────────────────────────────────── */}
                        <div className="flex justify-between gap-2 tablet:block tablet:text-right">
                          <span className="text-caption text-text-secondary tablet:hidden">
                            {t('checkout_col_subtotal')}
                          </span>
                          <span
                            className={cn(
                              'text-body font-semibold',
                              programs != null &&
                                (programs.price_change != null ||
                                  programs.volume_tier != null ||
                                  programs.purchase_with_purchase != null)
                                ? 'text-danger'
                                : 'text-text-primary'
                            )}
                          >
                            {lineSubText}
                          </span>
                        </div>
                      </div>

                      {/* ── Companion đã accepted: hiển thị dưới anchor ──────── */}
                      {lineAcceptedCompanions.map((suggestion) => {
                        const cplVarId = suggestion.companion_variant_id;
                        const cpl =
                          cplVarId != null ? previewLineByVariantId.get(cplVarId) : undefined;
                        const cUnitPrice = cpl?.unitPrice;
                        const cLineTotal = cpl?.lineTotal;
                        const cPrograms = cpl?.pricingPrograms ?? null;
                        return (
                          <div
                            key={`companion-accepted-${suggestion.offer_id}`}
                            className="mt-3 ml-4 rounded-md border border-success/30 bg-success/5 p-3 tablet:ml-[4.75rem]"
                          >
                            <div className="mb-2 flex items-center gap-1.5">
                              <span className="inline-flex items-center rounded-sm bg-success/15 px-1.5 py-0.5 text-[11px] font-semibold leading-none text-success">
                                Mua kèm ưu đãi
                              </span>
                            </div>
                            <div className="flex items-start gap-3">
                              {/* Thumbnail companion */}
                              <div className="h-12 w-12 shrink-0 overflow-hidden rounded border border-border bg-background">
                                {suggestion.companion_thumbnail_url ? (
                                  <img
                                    src={suggestion.companion_thumbnail_url}
                                    alt=""
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="flex h-full items-center justify-center text-[10px] text-text-disabled">
                                    —
                                  </div>
                                )}
                              </div>
                              {/* Tên + giá */}
                              <div className="min-w-0 flex-1">
                                <p className="line-clamp-1 text-body font-medium text-text-primary">
                                  {suggestion.companion_product_name ?? '—'}
                                </p>
                                <div className="mt-0.5 flex flex-wrap items-center gap-2">
                                  <span className="text-body font-semibold text-success">
                                    {cUnitPrice != null
                                      ? formatPrice(cUnitPrice)
                                      : formatPrice(suggestion.promo_unit_price)}
                                  </span>
                                  {suggestion.companion_regular_price != null &&
                                    suggestion.companion_regular_price > suggestion.promo_unit_price && (
                                      <span className="text-[11px] text-text-secondary line-through">
                                        {formatPrice(suggestion.companion_regular_price)}
                                      </span>
                                    )}
                                  {cLineTotal != null && (
                                    <span className="text-caption text-text-secondary">
                                      = {formatPrice(cLineTotal)}
                                    </span>
                                  )}
                                </div>
                                {hasPreviewData && cPrograms && (
                                  <PromoLineBadges programs={cPrograms} />
                                )}
                              </div>
                              {/* Nút bỏ chọn */}
                              <button
                                type="button"
                                disabled={placeOrderMutation.isPending || vnpayRedirecting}
                                onClick={() => handleRejectPwpSuggestion(suggestion.offer_id)}
                                className="shrink-0 text-caption text-text-secondary underline hover:text-danger disabled:opacity-50"
                              >
                                Bỏ chọn
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      {/* ── PwP suggestion chưa được accept: hiển thị card lựa chọn ── */}
                      {linePwpSuggestions.map((suggestion) => (
                        <div
                          key={`pwp-suggestion-${suggestion.offer_id}`}
                          className="mt-3 ml-4 rounded-md border border-dashed border-primary/40 bg-primary/[0.03] p-3 tablet:ml-[4.75rem]"
                        >
                          <p className="mb-2 text-caption font-semibold text-primary">
                            🎁 Ưu đãi mua kèm
                          </p>
                          <div className="flex items-start gap-3">
                            {/* Thumbnail companion */}
                            <div className="h-12 w-12 shrink-0 overflow-hidden rounded border border-border bg-background">
                              {suggestion.companion_thumbnail_url ? (
                                <img
                                  src={suggestion.companion_thumbnail_url}
                                  alt=""
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center text-[10px] text-text-disabled">
                                  —
                                </div>
                              )}
                            </div>
                            {/* Tên + giá */}
                            <div className="min-w-0 flex-1">
                              <p className="line-clamp-1 text-body font-medium text-text-primary">
                                {suggestion.companion_product_name ?? '—'}
                              </p>
                              <div className="mt-0.5 flex flex-wrap items-center gap-2">
                                <span className="text-body font-semibold text-success">
                                  {formatPrice(suggestion.promo_unit_price)}
                                </span>
                                {suggestion.companion_regular_price != null &&
                                  suggestion.companion_regular_price > suggestion.promo_unit_price && (
                                    <span className="text-[11px] text-text-secondary line-through">
                                      {formatPrice(suggestion.companion_regular_price)}
                                    </span>
                                  )}
                              </div>
                            </div>
                          </div>
                          {/* Lựa chọn */}
                          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-success/50 bg-success/5 px-3 py-2 hover:bg-success/10">
                              <input
                                type="radio"
                                name={`pwp-${suggestion.offer_id}`}
                                className="size-3.5 accent-success"
                                checked={false}
                                onChange={() => handleAcceptPwpSuggestion(suggestion)}
                                disabled={placeOrderMutation.isPending || vnpayRedirecting}
                              />
                              <span className="text-caption font-medium text-success">
                                Mua kèm với giá {formatPrice(suggestion.promo_unit_price)}
                              </span>
                            </label>
                            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 hover:bg-background/70">
                              <input
                                type="radio"
                                name={`pwp-${suggestion.offer_id}`}
                                className="size-3.5 accent-primary"
                                checked={true}
                                onChange={() => {/* already not accepted */}}
                                disabled={placeOrderMutation.isPending || vnpayRedirecting}
                              />
                              <span className="text-caption text-text-secondary">
                                Không áp dụng ưu đãi
                              </span>
                            </label>
                          </div>
                        </div>
                      ))}
                    </li>
                  );
                })}
              </ul>

              <div className="border-t border-border px-4 py-3 tablet:px-5">
                <label className="block text-caption font-medium text-text-secondary">{t('checkout_seller_note')}</label>
                <input
                  type="text"
                  value={sellerNote}
                  onChange={(e) => setSellerNote(e.target.value)}
                  placeholder={t('checkout_seller_note_placeholder')}
                  className="mt-1.5 h-10 w-full rounded-sm border border-border bg-surface px-3 text-body text-text-primary placeholder:text-text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                />
              </div>

              <div className="flex flex-col gap-2 border-t border-border bg-background/40 px-4 py-3 tablet:flex-row tablet:items-center tablet:justify-between tablet:px-5">
                <div>
                  <p className="m-0 text-body font-medium text-text-primary">{t('checkout_shipping_method')}</p>
                  <p className="m-0 text-caption text-text-secondary">{t('checkout_shipping_eta')}</p>
                  {shippingQuoteQuery.isSuccess &&
                    shippingQuoteQuery.data &&
                    (shippingQuoteQuery.data.distanceKilometers > 0 || shippingQuoteQuery.data.distanceMeters > 0) ? (
                    <p className="m-0 mt-1 text-caption text-text-secondary">
                      {t('checkout_shipping_distance_km').replace(
                        '{km}',
                        String(
                          shippingQuoteQuery.data.distanceKilometers > 0
                            ? shippingQuoteQuery.data.distanceKilometers
                            : Math.round((shippingQuoteQuery.data.distanceMeters / 1000) * 10) / 10
                        )
                      )}
                    </p>
                  ) : null}
                </div>
                <div className="text-right">
                  <p className="m-0 text-body font-medium text-text-primary">{t('checkout_shipping_standard')}</p>
                  {!defaultDeliveryAddress ? (
                    <p className="m-0 text-body text-text-disabled">—</p>
                  ) : shippingQuoteQuery.isError ? (
                    <div className="mt-1 flex flex-col items-end gap-1">
                      <p className="m-0 text-caption text-danger">{t('checkout_shipping_error')}</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-sm"
                        onClick={() => void shippingQuoteQuery.refetch()}
                      >
                        {t('checkout_shipping_retry')}
                      </Button>
                    </div>
                  ) : shippingQuoteQuery.isLoading ? (
                    <p className="m-0 text-body text-text-secondary">{t('checkout_shipping_fetching')}</p>
                  ) : (
                    <p className="m-0 text-body text-text-primary">{formatPrice(shippingFeeVnd ?? 0)}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end border-t border-border px-4 py-3 tablet:px-5">
                <p className="m-0 text-body text-text-primary">
                  <span className="text-text-secondary">
                    {t('checkout_shop_subtotal').replace('{n}', String(itemCount))}
                  </span>{' '}
                  <span className="font-bold text-primary">
                    {grandTotalForSummary != null
                      ? formatPrice(grandTotalForSummary)
                      : previewFailed
                        ? '—'
                        : '…'}
                  </span>
                </p>
              </div>
            </section>

            {/* Voucher nền tảng — placeholder */}
            <section className="rounded-md border border-border bg-surface p-4 opacity-75 tablet:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-body text-text-primary">{t('checkout_platform_voucher')}</span>
                <span className="text-caption text-text-disabled">{t('checkout_voucher_coming')}</span>
              </div>
            </section>

            {/* Ghi chú đơn + PTTT + tổng */}
            <section className="rounded-md border border-border bg-surface p-4 tablet:p-5">
              <div className="mb-4">
                <label className="block text-caption font-medium text-text-secondary">
                  {t('checkout_order_note_label')}
                </label>
                <textarea
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                  rows={2}
                  placeholder={t('checkout_order_note_placeholder')}
                  className="mt-1.5 w-full rounded-sm border border-border bg-surface px-3 py-2 text-body text-text-primary placeholder:text-text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                />
              </div>

              <div className="border-t border-border pt-4">
                <p className="m-0 text-heading text-text-primary">{t('checkout_payment_title')}</p>
                {paymentQuery.isLoading ? (
                  <p className="mt-2 text-body text-text-secondary">{t('checkout_loading_payment')}</p>
                ) : paymentQuery.isError ? (
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <p className="m-0 text-body text-danger">{t('checkout_error_payment')}</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-sm"
                      onClick={() => void paymentQuery.refetch()}
                    >
                      {t('checkout_retry')}
                    </Button>
                  </div>
                ) : paymentMethodOptions.length === 0 ? (
                  <p className="mt-2 text-body text-text-secondary">{t('checkout_no_payment_methods')}</p>
                ) : (
                  <ul className="mt-3 list-none space-y-2 p-0">
                    {paymentMethodOptions.map((m) => {
                      const isVnp = isVnpayPaymentMethodCode(m.code);
                      return (
                        <li key={m.id}>
                          <label
                            className={cn(
                              'flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors',
                              paymentMethodId === m.id
                                ? 'border-primary bg-primary/5 shadow-sm'
                                : 'border-border hover:border-primary/25'
                            )}
                          >
                            <input
                              type="radio"
                              name="checkout-payment"
                              className="mt-0.5 size-4 shrink-0 accent-primary"
                              checked={paymentMethodId === m.id}
                              onChange={() => setPaymentMethodId(m.id)}
                            />
                            <div className="min-w-0 flex-1">
                              <span className="text-body font-medium text-text-primary">
                                {isVnp ? t('checkout_vnpay_selected_title') : m.name}
                              </span>
                              {isVnp ? (
                                <p className="m-0 mt-1 text-caption text-text-secondary">
                                  {t('checkout_vnpay_method_sub')}
                                </p>
                              ) : null}
                            </div>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="mt-6 space-y-2 border-t border-border pt-4 text-body">
                <div className="flex justify-between gap-4">
                  <span className="text-text-secondary">{t('checkout_summary_items')}</span>
                  <span className="font-medium text-text-primary">
                    {itemsMerchandise != null
                      ? formatPrice(itemsMerchandise)
                      : previewFailed
                        ? '—'
                        : '…'}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-text-secondary">{t('checkout_summary_shipping')}</span>
                  <span className="text-right font-medium text-text-primary">
                    {!defaultDeliveryAddress ? (
                      '—'
                    ) : shippingQuoteQuery.isError ? (
                      <span className="text-danger">{t('checkout_shipping_error_short')}</span>
                    ) : shippingQuoteQuery.isLoading ? (
                      '…'
                    ) : (
                      formatPrice(shippingFeeVnd ?? 0)
                    )}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-text-secondary">{t('checkout_summary_voucher')}</span>
                  <span
                    className={cn(
                      'font-medium',
                      voucherDiscount === 0 ? 'text-danger' : 'text-primary'
                    )}
                  >
                    -{formatPrice(voucherDiscount)}
                  </span>
                </div>
                <div className="flex justify-between gap-4 pt-2 text-title">
                  <span className="text-text-primary">{t('checkout_summary_total')}</span>
                  <span className="font-bold text-primary">
                    {grandTotalForSummary != null
                      ? formatPrice(grandTotalForSummary)
                      : previewFailed
                        ? '—'
                        : '…'}
                  </span>
                </div>
              </div>

              {isVnpaySelected ? (
                <p className="m-0 mt-3 text-caption text-text-secondary">
                  {t('checkout_vnpay_total_includes_shipping')}
                </p>
              ) : null}

              <p className={cn('text-caption text-text-secondary', isVnpaySelected ? 'mt-2' : 'mt-4')}>
                {isVnpaySelected ? t('checkout_terms_hint_vnpay') : t('checkout_terms_hint')}
              </p>

              <div className="mt-4 flex flex-col items-end">
                <Button
                  type="button"
                  variant="profilePrimary"
                  className="min-w-[200px] rounded-sm bg-primary text-white hover:brightness-105"
                  disabled={!canSubmit}
                  loading={placeOrderMutation.isPending || vnpayRedirecting}
                  onClick={() => placeOrderMutation.mutate()}
                >
                  {isVnpaySelected ? t('checkout_place_order_vnpay') : t('checkout_place_order')}
                </Button>
              </div>
            </section>
          </div>
        </div>
      </main>

      <MainFooter />

      {vnpayRedirecting ? (
        <div
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background/90 p-4 backdrop-blur-sm"
          role="status"
          aria-live="polite"
        >
          <p className="m-0 text-center text-title text-text-primary">{t('checkout_vnpay_redirect_loading')}</p>
          <p className="m-0 mt-2 text-center text-body text-text-secondary">
            {t('checkout_vnpay_redirect_loading_sub')}
          </p>
        </div>
      ) : null}

      {vnpayFailureCode != null && vnpayFailureMessage != null ? (
        <div
          className="fixed inset-0 z-[230] flex items-center justify-center bg-background/80 p-4 backdrop-blur-[2px]"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="checkout-vnpay-fail-title"
        >
          <div className="w-full max-w-md rounded-md border border-border bg-surface p-5 text-center shadow-lg tablet:p-6">
            <h2
              id="checkout-vnpay-fail-title"
              className="m-0 text-heading text-text-primary"
            >
              {t('checkout_vnpay_decline_popup_title')}
            </h2>
            <p className="mb-0 mt-3 text-body leading-relaxed text-text-primary">{vnpayFailureMessage}</p>
            <p className="mb-0 mt-3 text-caption leading-relaxed text-text-secondary">
              {t('checkout_vnpay_decline_resume_hint')}
            </p>
            <div className="mt-6 flex justify-center">
              <Button
                type="button"
                variant="profilePrimary"
                className="min-w-[120px] rounded-sm"
                onClick={() => setVnpayFailureCode(null)}
              >
                {t('checkout_vnpay_decline_ok')}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {leaveCheckoutBlocker.state === 'blocked' ? (
        <div
          className="fixed inset-0 z-[220] flex items-center justify-center bg-background/80 p-4 backdrop-blur-[2px]"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="checkout-leave-title"
          aria-describedby="checkout-leave-desc"
        >
          <div className="w-full max-w-md rounded-md border border-border bg-surface p-5 shadow-lg tablet:p-6">
            <h2 id="checkout-leave-title" className="m-0 text-heading text-text-primary">
              {t('checkout_leave_confirm_title')}
            </h2>
            <p id="checkout-leave-desc" className="mb-0 mt-3 text-body leading-relaxed text-text-secondary">
              {t('checkout_leave_confirm_body')}
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-sm sm:w-auto"
                onClick={confirmAbandonCheckout}
              >
                {t('checkout_leave_go_home')}
              </Button>
              <Button
                type="button"
                variant="profilePrimary"
                className="w-full rounded-sm sm:w-auto"
                onClick={stayOnCheckout}
              >
                {t('checkout_leave_stay')}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
