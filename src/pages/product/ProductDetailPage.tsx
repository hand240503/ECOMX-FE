import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import {
  AlertTriangle,
  ChevronRight,
  Percent,
  RefreshCw,
  Shield,
  ShoppingCart,
  Sparkles,
  Store,
  Tag,
  Truck,
  type LucideIcon
} from 'lucide-react';
import { flushSync } from 'react-dom';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import CategoryBreadcrumb, { type BreadcrumbItem } from '../category/CategoryBreadcrumb';
import MainFooter from '../../layout/footer/MainFooter';
import MainHeader from '../../layout/header/MainHeader';
import { Button } from '../../components/ui/Button';
import { PriceDisplay } from '../../components/product/PriceDisplay';
import { QuantityInput } from '../../components/product/QuantityInput';
import { RatingStars } from '../../components/product/RatingStars';
import { ImageLightbox } from '../../components/product/detail/ImageLightbox';
import { ProductGallery } from '../../components/product/detail/ProductGallery';
import { ProductRecommendations } from '../../components/product/detail/ProductRecommendations';
import { ProductReviewsPlaceholder } from '../../components/product/detail/ProductReviewsPlaceholder';
import { useProductDetail } from '../../hooks/useProductDetail';
import { useAuth } from '../../app/auth/AuthProvider';
import { useCart } from '../../app/cart/CartProvider';
import { useI18n } from '../../i18n/I18nProvider';
import { getProductImageUrls } from '../../lib/productImage';
import type { ProductDetailPriceRow } from '../../api/mappers/productDetailMapper';
import { cn } from '../../lib/cn';
import { cartLineKey } from '../../lib/cartStorage';
import { saveCheckoutLineKeys } from '../../lib/checkoutIntent';
import { formatPrice } from '../../lib/formatPrice';
import {
  policiesToBadgeChips,
  policiesToDisplayRows,
  type PolicyBadgeVariant,
  type PolicyDisplayIcon
} from '../../lib/productPolicies';

function truncateLabel(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

function pickErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const body = err.response?.data as { message?: string } | undefined;
    if (typeof body?.message === 'string' && body.message.trim() !== '') {
      return body.message.trim();
    }
  }
  if (err instanceof Error && err.message.trim() !== '') return err.message.trim();
  return fallback;
}

/** Khớp `max-h-[…px]` khi thu gọn — dùng cùng giá trị khi đo scrollHeight */
const PDP_DESC_COLLAPSED_MAX_PX = 400;
/** Chỉ hiện “xem thêm” khi độ dài text (sau bỏ thẻ) đạt tối thiểu */
const PDP_DESC_MIN_PLAIN_CHARS = 320;

const POLICY_ICON_MAP: Record<PolicyDisplayIcon, LucideIcon> = {
  truck: Truck,
  refresh: RefreshCw,
  shield: Shield,
  percent: Percent,
  tag: Tag,
  sparkles: Sparkles
};

const POLICY_BADGE_VARIANT_CLASS: Record<PolicyBadgeVariant, string> = {
  primary: 'rounded-md bg-primary/10 px-2 py-1 text-caption font-bold text-primary',
  warning: 'rounded-md bg-warning/15 px-2 py-1 text-caption font-bold text-warning',
  success: 'rounded-md bg-success/12 px-2 py-1 text-caption font-bold text-success',
  accent: 'rounded-md bg-violet-100 px-2 py-1 text-caption font-bold text-violet-800',
  neutral: 'rounded-md bg-gray-200/90 px-2 py-1 text-caption font-bold text-text-secondary'
};

function descriptionPlainTextLength(html: string): number {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().length;
}

const ProductDetailPage = () => {
  const { productId } = useParams<{ productId: string }>();
  const { t } = useI18n();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();

  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [addCartLoading, setAddCartLoading] = useState(false);
  const [buyNowLoading, setBuyNowLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileSticky, setShowMobileSticky] = useState(false);

  // ctaRef: sentinel cho mobile sticky bar
  const ctaRef = useRef<HTMLDivElement>(null);
  const descBodyRef = useRef<HTMLDivElement>(null);
  const [descHasOverflow, setDescHasOverflow] = useState(false);

  const idValid = productId != null && /^\d+$/.test(productId.trim());

  const { data, detailModel, recommendations, isPending, isError, error, refetch, isNotFound } =
    useProductDetail(productId);

  const imageUrls = useMemo(
    () => (data?.product ? getProductImageUrls(data.product) : []),
    [data?.product]
  );

  const policyLabels = useMemo(
    () => ({
      ordersFromTemplate: t('pdp_policy_orders_from_template'),
      saveAmountTemplate: t('pdp_policy_save_template'),
      discountPercentTemplate: t('pdp_policy_discount_percent_template'),
      returnDaysTemplate: t('pdp_policy_return_days_template')
    }),
    [t]
  );

  const policyRows = useMemo(
    () => policiesToDisplayRows(data?.product?.policies, policyLabels),
    [data?.product?.policies, policyLabels]
  );

  const policyBadges = useMemo(
    () => policiesToBadgeChips(data?.product?.policies, 4),
    [data?.product?.policies]
  );

  useEffect(() => {
    if (!detailModel?.prices.length) return;
    setSelectedUnitId((prev) => {
      if (prev != null && detailModel.prices.some((p) => p.unitId === prev)) return prev;
      return detailModel.prices[0].unitId;
    });
  }, [detailModel]);

  const selectedPrice: ProductDetailPriceRow | null = useMemo(() => {
    if (!detailModel?.prices.length) return null;
    if (selectedUnitId == null) return detailModel.prices[0];
    return detailModel.prices.find((p) => p.unitId === selectedUnitId) ?? detailModel.prices[0];
  }, [detailModel, selectedUnitId]);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const fn = () => setIsMobile(mq.matches);
    fn();
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);

  // Mobile sticky bar: hiện khi CTA gốc cuộn ra khỏi viewport
  useEffect(() => {
    if (!isMobile || !ctaRef.current || !detailModel) {
      setShowMobileSticky(false);
      return;
    }
    const el = ctaRef.current;
    const obs = new IntersectionObserver(
      ([e]) => {
        setShowMobileSticky(!e.isIntersecting);
      },
      { threshold: 0, rootMargin: '-72px 0px 0px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [isMobile, detailModel]);

  const breadcrumbItems: BreadcrumbItem[] = useMemo(() => {
    if (!detailModel) return [];
    const cat = detailModel.category;
    if (!cat) {
      return [{ label: truncateLabel(detailModel.productName, 40), current: true }];
    }
    return [
      {
        label: cat.name,
        href: `/products/category/${cat.id}`,
      },
      {
        label: truncateLabel(detailModel.productName, 40),
        current: true,
      },
    ];
  }, [detailModel]);

  const descriptionPlainLen = useMemo(
    () =>
      detailModel?.descriptionHtml ? descriptionPlainTextLength(detailModel.descriptionHtml) : 0,
    [detailModel?.descriptionHtml]
  );

  useLayoutEffect(() => {
    if (!detailModel?.descriptionHtml) {
      setDescHasOverflow(false);
      return;
    }
    if (descriptionPlainLen < PDP_DESC_MIN_PLAIN_CHARS) {
      setDescHasOverflow(false);
      return;
    }
    const el = descBodyRef.current;
    if (!el) return;
    const measure = () => {
      const node = descBodyRef.current;
      if (!node) return;
      setDescHasOverflow(node.scrollHeight > PDP_DESC_COLLAPSED_MAX_PX);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [detailModel?.descriptionHtml, descriptionPlainLen, productId]);

  useEffect(() => {
    setDescExpanded(false);
  }, [productId, detailModel?.descriptionHtml]);

  const showDescriptionExpand =
    descriptionPlainLen >= PDP_DESC_MIN_PLAIN_CHARS && descHasOverflow;
  const descriptionCollapsed = showDescriptionExpand && !descExpanded;

  const discountBadgeText =
    selectedPrice?.discountPercent != null && selectedPrice.discountPercent > 0
      ? t('pdp_discount_pct').replace('{n}', String(selectedPrice.discountPercent))
      : null;

  const tagTokens = useMemo(() => {
    if (!detailModel?.tag) return [];
    return detailModel.tag
      .split(/[,;]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 16);
  }, [detailModel?.tag]);

  const brandCatDuped = useMemo(() => {
    const b = detailModel?.brand?.name?.trim().toLowerCase();
    const c = detailModel?.category?.name?.trim().toLowerCase();
    return Boolean(b && c && b === c);
  }, [detailModel?.brand?.name, detailModel?.category?.name]);

  const subtotalFormatted = useMemo(() => {
    if (!selectedPrice) return '';
    return formatPrice(selectedPrice.currentValue * quantity);
  }, [selectedPrice, quantity]);

  const variantThumb = imageUrls[0];

  const simulateCartApi = useCallback(
    (action: 'cart' | 'buy') => {
      return new Promise<void>((resolve, reject) => {
        window.setTimeout(() => {
          if (Math.random() < 0.02) {
            reject(new Error('network'));
            return;
          }
          resolve();
        }, action === 'cart' ? 450 : 550);
      });
    },
    []
  );

  const handleAddCart = async () => {
    if (!detailModel?.inStock || !selectedPrice) return;
    setAddCartLoading(true);
    try {
      await simulateCartApi('cart');
      addItem({
        productId: detailModel.id,
        productName: detailModel.productName,
        thumbnailUrl: imageUrls[0] ?? null,
        unitId: selectedPrice.unitId,
        unitName: selectedPrice.unitName,
        unitPrice: selectedPrice.currentValue,
        quantity
      });
      toast.success(t('pdp_add_cart_ok'));
    } catch {
      toast.error(t('pdp_cart_error'));
    } finally {
      setAddCartLoading(false);
    }
  };

  const handleBuyNow = async () => {
    if (!detailModel?.inStock || !selectedPrice) return;
    setBuyNowLoading(true);
    try {
      await simulateCartApi('buy');
      flushSync(() => {
        addItem({
          productId: detailModel.id,
          productName: detailModel.productName,
          thumbnailUrl: imageUrls[0] ?? null,
          unitId: selectedPrice.unitId,
          unitName: selectedPrice.unitName,
          unitPrice: selectedPrice.currentValue,
          quantity
        });
      });
      const key = cartLineKey({ productId: detailModel.id, unitId: selectedPrice.unitId });
      if (!isAuthenticated) {
        saveCheckoutLineKeys([key]);
        navigate('/login', { state: { from: '/checkout' } });
      } else {
        navigate('/checkout', { state: { keys: [key] } });
      }
    } catch {
      toast.error(t('pdp_cart_error'));
    } finally {
      setBuyNowLoading(false);
    }
  };

  const handleWishlist = () => {
    const next = !wishlisted;
    setWishlisted(next);
    toast.success(next ? t('pdp_wishlist_added') : t('pdp_wishlist_removed'));
  };

  const ratingBlock =
    detailModel && detailModel.ratingCount > 0 ? (
      <div className="inline-flex flex-wrap items-center gap-2 text-body text-text-secondary">
        <span className="font-semibold text-text-primary">
          {(detailModel.averageRating ?? 0).toFixed(1)}
        </span>
        <RatingStars value={detailModel.averageRating ?? 0} size="sm" />
        <span className="text-caption">
          ({detailModel.ratingCount} {t('pdp_reviews_count')})
        </span>
      </div>
    ) : (
      <span className="text-caption text-text-disabled">{t('pdp_no_reviews_yet')}</span>
    );

  const scrollToDescription = () => {
    document.getElementById('pdp-description')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (!idValid) {
    return <Navigate to="/404" replace />;
  }

  if (isNotFound) {
    return <Navigate to="/404" replace />;
  }

  const errMsg = isError ? pickErrorMessage(error, t('pdp_load_error')) : '';

  return (
    <div
      className={cn(
        'flex min-h-screen flex-col bg-background',
        showMobileSticky && 'pb-[88px] tablet:pb-0'
      )}
    >
      <MainHeader />

      <main className="flex-1">
        {/* Breadcrumb */}
        {isPending && (
          <div className="border-b border-border bg-surface py-3">
            <div className="mx-auto max-w-container px-4 tablet:px-6">
              <div className="h-4 w-64 animate-pulse rounded-md bg-border" />
            </div>
          </div>
        )}
        {!isPending && !isError && detailModel && (
          <div className="border-b border-border bg-surface py-3">
            <div className="mx-auto max-w-container px-4 tablet:px-6">
              <CategoryBreadcrumb items={breadcrumbItems} />
            </div>
          </div>
        )}

        <div className="mx-auto max-w-container px-4 pt-1.5 pb-4 
        tablet:px-6 tablet:pt-1.5 tablet:pb-6 
        [--pdp-sticky-top:1rem] tablet:[--pdp-sticky-top:1.5rem]"
        >

          {/* Error */}
          {isError && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <AlertTriangle className="h-12 w-12 text-warning" aria-hidden />
              <p className="mt-4 text-body text-text-primary">{t('pdp_load_error')}</p>
              <p className="mt-1 text-caption text-text-secondary">{errMsg}</p>
              <Button
                type="button"
                variant="profileOutline"
                className="mt-6"
                onClick={() => void refetch()}
              >
                {t('common_retry')}
              </Button>
            </div>
          )}

          {/* Skeleton */}
          {isPending && (
            <>
              <div className="mb-4 grid gap-3 tablet:grid-cols-2">
                <div className="h-16 animate-pulse rounded-xl bg-border/80" />
                <div className="h-16 animate-pulse rounded-xl bg-border/80" />
              </div>
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-12 xl:gap-5">
                <div className="space-y-3 xl:col-start-1 xl:col-span-3 xl:row-start-1">
                  <div className="aspect-square animate-pulse rounded-xl bg-border/80" />
                  <div className="h-10 animate-pulse rounded-lg bg-border/70" />
                </div>
                <div className="space-y-4 rounded-xl border border-border bg-surface p-4 shadow-sm xl:col-start-4 xl:col-span-6 xl:row-start-1">
                  <div className="h-6 w-3/4 animate-pulse rounded-md bg-border/80" />
                  <div className="h-10 w-full animate-pulse rounded-lg bg-border/70" />
                  <div className="h-24 w-48 animate-pulse rounded-lg bg-border/70" />
                </div>
                <div className="space-y-3 rounded-xl border border-border bg-surface p-4 shadow-sm xl:col-start-10 xl:col-span-3 xl:row-start-1">
                  <div className="h-24 animate-pulse rounded-lg bg-border/70" />
                  <div className="h-12 animate-pulse rounded-lg bg-border/70" />
                  <div className="h-12 animate-pulse rounded-xl bg-border/80" />
                </div>
              </div>
            </>
          )}

          {!isPending && !isError && detailModel && selectedPrice && (
            <>
              {/*
               * VÙNG 3 CỘT CHÍNH — sticky hoạt động trong phạm vi wrapper này.
               * Reviews và recommendations được đặt NGOÀI wrapper này (bên dưới),
               * nên sticky của cột ảnh và sidebar tự dừng khi cuộn khỏi wrapper.
               * Không cần IntersectionObserver hay toggle sticky bằng JS.
               */}
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-12 xl:items-start xl:gap-5">

                {/*
                 * Sub-grid bọc cột ảnh + cột giữa, chiếm col 1–9 row 1.
                 * Cột ảnh sticky bên trong sub-grid này → tự dừng khi hết row 1,
                 * tức là dừng đúng lúc gặp reviews (row 2). Sidebar row-span-2
                 * nên vẫn scroll tự do qua cả reviews.
                 */}
                <div className="grid grid-cols-1 gap-4 xl:col-span-9 xl:col-start-1 xl:row-start-1 xl:grid-cols-9 xl:items-start xl:gap-5">

                  {/* CỘT ẢNH — sticky trong sub-grid, dừng khi hết sub-grid */}
                  <div className="min-w-0 space-y-3 xl:col-span-3 xl:col-start-1 xl:sticky xl:top-[var(--pdp-sticky-top)] xl:self-start">
                    <div className="rounded-xl border border-border bg-surface p-3 shadow-sm">
                      <ProductGallery
                        imageUrls={imageUrls}
                        activeIndex={Math.min(activeImageIndex, Math.max(0, imageUrls.length - 1))}
                        onActiveIndexChange={setActiveImageIndex}
                        isLoading={false}
                        outOfStock={!detailModel.inStock}
                        wishlisted={wishlisted}
                        onToggleWishlist={handleWishlist}
                        onOpenLightbox={() => setLightboxOpen(true)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={scrollToDescription}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 py-3 text-body font-medium text-text-primary shadow-sm transition-colors hover:border-primary/40 hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <span className="line-clamp-2 text-left">{t('pdp_more_advantages')}</span>
                      <ChevronRight className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                    </button>
                  </div>

                  {/* CỘT GIỮA — cuộn tự do, không sticky */}
                  <div className="flex min-w-0 flex-col gap-5 xl:col-span-6 xl:col-start-4">

                    {/* Block thông tin sản phẩm */}
                    <div className="rounded-xl border border-border bg-surface p-4 shadow-sm tablet:p-5">
                      <div className="mb-4 flex flex-col gap-3 border-b border-border/80 pb-4 tablet:flex-row tablet:items-start tablet:justify-between">
                        {policyBadges.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {policyBadges.map((chip) => (
                              <span
                                key={chip.id}
                                className={POLICY_BADGE_VARIANT_CLASS[chip.variant]}
                                title={chip.label}
                              >
                                {chip.label}
                              </span>
                            ))}
                          </div>
                        ) : null}
                        {detailModel.brand && (
                          <Link
                            to={`/search?q=${encodeURIComponent(detailModel.brand.name)}`}
                            className="shrink-0 text-body text-primary hover:underline"
                          >
                            <span className="text-text-secondary">{t('pdp_brand_prefix')} </span>
                            {detailModel.brand.name}
                          </Link>
                        )}
                      </div>

                      {detailModel.isFeatured && (
                        <span className="mb-2 inline-block rounded-md border border-primary/25 bg-primary/10 px-2 py-0.5 text-caption font-bold uppercase tracking-wide text-primary">
                          {t('pdp_featured')}
                        </span>
                      )}

                      <h1 className="text-[1.25rem] font-bold leading-snug tracking-tight text-text-primary tablet:text-[1.4rem] xl:text-[1.35rem]">
                        <span className="line-clamp-4">{detailModel.productName}</span>
                      </h1>

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-caption text-text-secondary">
                        {ratingBlock}
                        <span className="text-text-disabled" aria-hidden>|</span>
                        <span>
                          {t('pdp_sold_prefix')}
                          <span className="font-semibold text-text-primary">{detailModel.soldCountLabel}</span>
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-border/60 pb-4 text-body text-text-secondary">
                        {!brandCatDuped && detailModel.brand && (
                          <Link
                            to={`/search?q=${encodeURIComponent(detailModel.brand.name)}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {detailModel.brand.name}
                          </Link>
                        )}
                        {!brandCatDuped && detailModel.brand && detailModel.category && (
                          <span className="text-text-disabled" aria-hidden>·</span>
                        )}
                        {detailModel.category && (
                          <Link
                            to={`/products/category/${detailModel.category.id}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {detailModel.category.name}
                          </Link>
                        )}
                        {brandCatDuped && detailModel.category && (
                          <Link
                            to={`/products/category/${detailModel.category.id}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {detailModel.category.name}
                          </Link>
                        )}
                      </div>

                      <div className="mt-4 rounded-xl border border-border/70 bg-background/50 p-4">
                        <PriceDisplay
                          tone="neutral"
                          formattedCurrent={selectedPrice.formattedCurrent}
                          formattedOld={selectedPrice.formattedOld}
                          discountBadgeText={discountBadgeText}
                        />
                      </div>

                      {detailModel.prices.length > 1 && (
                        <div className="mt-4">
                          <p className="mb-2 text-caption font-semibold text-text-secondary">{t('pdp_unit_heading')}</p>
                          <div className="flex flex-wrap gap-2">
                            {detailModel.prices.map((p) => (
                              <button
                                key={p.unitId}
                                type="button"
                                onClick={() => setSelectedUnitId(p.unitId)}
                                className={cn(
                                  'rounded-lg border px-4 py-2.5 text-body font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                                  p.unitId === selectedUnitId
                                    ? 'border-primary bg-primary text-white shadow-sm'
                                    : 'border-border bg-surface text-text-primary hover:border-primary/50 hover:bg-primary/5'
                                )}
                              >
                                {p.unitName}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-4">
                        {detailModel.inStock ? (
                          <span className="inline-flex items-center rounded-lg bg-success/12 px-3 py-1.5 text-caption font-semibold text-success">
                            {t('pdp_in_stock')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-lg bg-gray-200 px-3 py-1.5 text-caption font-semibold text-text-secondary">
                            {t('pdp_out_stock')}
                          </span>
                        )}
                      </div>

                      {tagTokens.length > 0 && (
                        <div className="mt-5">
                          <p className="mb-2 text-caption font-semibold uppercase tracking-wide text-text-secondary">
                            {t('pdp_tags_heading')}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {tagTokens.map((tag, idx) => (
                              <Link
                                key={`${tag}-${idx}`}
                                to={`/search?q=${encodeURIComponent(tag)}`}
                                className="rounded-full border border-border bg-background px-3 py-1 text-caption font-medium text-text-secondary transition-all hover:border-primary hover:text-primary"
                              >
                                {tag}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      {policyRows.length > 0 ? (
                        <ul className="mt-6 space-y-3 border-t border-border/80 pt-5">
                          {policyRows.map((row) => {
                            const Icon = POLICY_ICON_MAP[row.icon];
                            return (
                              <li key={row.id} className="flex gap-3 text-body text-text-secondary">
                                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                  <Icon size={18} strokeWidth={2} aria-hidden />
                                </span>
                                <span className="min-w-0 leading-relaxed">
                                  <span className="font-medium text-text-primary">{row.title}</span>
                                  {row.subtitle ? (
                                    <span className="mt-1 block text-caption text-text-secondary">
                                      {row.subtitle}
                                    </span>
                                  ) : null}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      ) : null}
                    </div>

                    {/* Mô tả sản phẩm */}
                    {detailModel.descriptionHtml && (
                      <section
                        id="pdp-description"
                        className="rounded-2xl border border-border bg-surface p-5 shadow-[0_2px_16px_rgba(15,23,42,0.05)] tablet:p-6"
                      >
                        <h2 className="text-heading text-text-primary">{t('pdp_description_title')}</h2>
                        <div className="my-4 h-px bg-border/90" />
                        <div
                          className="relative overflow-hidden"
                          style={
                            descriptionCollapsed ? { maxHeight: PDP_DESC_COLLAPSED_MAX_PX } : undefined
                          }
                        >
                          <div
                            ref={descBodyRef}
                            className="max-w-none text-body text-text-primary [&_a]:text-primary [&_img]:max-w-full [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5"
                            dangerouslySetInnerHTML={{ __html: detailModel.descriptionHtml }}
                          />
                          {descriptionCollapsed && (
                            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-surface to-transparent" />
                          )}
                        </div>
                        {showDescriptionExpand && (
                          <button
                            type="button"
                            onClick={() => setDescExpanded((e) => !e)}
                            className="mt-3 text-body font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          >
                            {descExpanded ? t('pdp_description_collapse') : t('pdp_description_expand')}
                          </button>
                        )}
                      </section>
                    )}

                    {/* Sản phẩm tương tự — trong cột giữa */}
                    {recommendations.length > 0 && (
                      <ProductRecommendations
                        products={recommendations.slice(0, 10)}
                        isLoading={false}
                        layout="rail"
                        className="shadow-[0_2px_12px_rgba(15,23,42,0.04)]"
                      />
                    )}
                  </div>

                </div>
                {/* END sub-grid cột ảnh + cột giữa */}

                {/* SIDEBAR MUA — sticky trong wrapper */}
                <aside
                  ref={ctaRef}
                  className="min-w-0 rounded-xl border border-border bg-surface p-4 shadow-[0_4px_24px_rgba(15,23,42,0.08)] xl:col-span-3 xl:col-start-10 xl:row-span-2 xl:row-start-1 xl:sticky xl:top-[var(--pdp-sticky-top)] xl:self-start"
                >
                  <div className="flex items-center gap-3 border-b border-border/80 pb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Store size={22} strokeWidth={2} aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-text-primary">{t('pdp_seller_official')}</p>
                      <div className="mt-0.5 flex items-center gap-1 text-caption text-warning">
                        <RatingStars value={4.8} size="sm" />
                        <span className="text-text-secondary">4.8</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-3 rounded-lg border border-border/80 bg-background/50 p-2">
                    <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-md border border-border bg-background">
                      {variantThumb ? (
                        <img src={variantThumb} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-caption text-text-disabled">
                          —
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-caption text-text-secondary">{t('pdp_selected_label')}</p>
                      <p className="truncate font-medium text-text-primary">{selectedPrice.unitName}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <span className="text-body font-medium text-text-primary">{t('pdp_quantity')}</span>
                    <QuantityInput
                      value={quantity}
                      onChange={setQuantity}
                      min={1}
                      disabled={!detailModel.inStock}
                    />
                  </div>

                  <div className="mt-5 flex items-end justify-between gap-2 border-b border-border/80 pb-4">
                    <span className="text-body text-text-secondary">{t('pdp_subtotal')}</span>
                    <span className="text-xl font-bold text-text-primary">{subtotalFormatted}</span>
                  </div>

                  <div className="mt-4 flex flex-col gap-3">
                    <Button
                      type="button"
                      variant="danger"
                      fullWidth
                      className="h-12 !min-h-[48px] justify-center font-semibold shadow-md"
                      disabled={!detailModel.inStock}
                      loading={buyNowLoading}
                      onClick={() => void handleBuyNow()}
                    >
                      {!buyNowLoading ? t('pdp_buy_now') : null}
                    </Button>

                    <Button
                      type="button"
                      variant="profileOutline"
                      fullWidth
                      className="h-12 !min-h-[48px] justify-center gap-2 border-2 border-primary text-primary hover:bg-primary hover:text-white"
                      disabled={!detailModel.inStock}
                      loading={addCartLoading}
                      leftIcon={<ShoppingCart size={20} />}
                      onClick={() => void handleAddCart()}
                    >
                      {!addCartLoading ? t('pdp_add_cart') : null}
                    </Button>

                    {!detailModel.inStock && (
                      <Button
                        type="button"
                        variant="profileOutline"
                        fullWidth
                        className="h-12 border-2 border-warning text-warning hover:bg-warning/10"
                        onClick={() => toast.success(t('pdp_notify_ok'))}
                      >
                        {t('pdp_notify_stock')}
                      </Button>
                    )}
                  </div>
                </aside>

                {/*
                 * REVIEWS — trong grid, row 2, col 1–9.
                 * Sidebar dùng row-span-2 nên sticky chạy suốt chiều cao cả 2 row.
                 */}
                <div
                  id="pdp-reviews-anchor"
                  className="xl:col-span-9 xl:col-start-1 xl:row-start-2"
                >
                  <ProductReviewsPlaceholder
                    className="shadow-[0_2px_12px_rgba(15,23,42,0.04)]"
                  />
                </div>

              </div>
              {/* END grid — sidebar sticky dừng tại đây */}

              {imageUrls.length > 0 && (
                <ImageLightbox
                  open={lightboxOpen}
                  images={imageUrls}
                  index={Math.min(activeImageIndex, Math.max(0, imageUrls.length - 1))}
                  onClose={() => setLightboxOpen(false)}
                  onIndexChange={setActiveImageIndex}
                />
              )}
            </>
          )}
        </div>
      </main>

      {/* Mobile sticky action bar */}
      {showMobileSticky && !isPending && !isError && detailModel && selectedPrice && (
        <div className="fixed bottom-0 left-0 right-0 z-drawer border-t border-border bg-surface p-2 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] tablet:hidden">
          <div className="mx-auto flex max-w-container items-center gap-2 px-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-caption font-medium text-text-primary">
                {detailModel.productName}
              </p>
              <p className="text-caption font-bold text-danger">{selectedPrice.formattedCurrent}</p>
            </div>
            <Button
              type="button"
              variant="danger"
              size="sm"
              className="!min-h-[40px] flex-shrink-0 px-2 font-semibold"
              disabled={!detailModel.inStock}
              loading={buyNowLoading}
              onClick={() => void handleBuyNow()}
            >
              {t('pdp_buy_short')}
            </Button>
            <Button
              type="button"
              variant="profileOutline"
              size="sm"
              className="!min-h-[40px] flex-shrink-0 border-primary px-2 text-primary"
              disabled={!detailModel.inStock}
              loading={addCartLoading}
              onClick={() => void handleAddCart()}
            >
              {t('pdp_add_cart_short')}
            </Button>
          </div>
        </div>
      )}

      <MainFooter />
    </div>
  );
};

export default ProductDetailPage;