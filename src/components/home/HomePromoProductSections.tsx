import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { productService } from '../../api/services/productService';
import type { ProductFullResponse } from '../../api/types/product.types';
import { useI18n } from '../../i18n/I18nProvider';
import { cn } from '../../lib/cn';
import ProductSkeleton from '../product/ProductSkeleton';
import { mapProductFullToCard } from '../../api/mappers/homeProductMapper';
import { formatPrice } from '../../lib/formatPrice';
import { DEFAULT_PRODUCT_IMAGE } from '../../constants/defaultImages';
import leftIcon from '../../assets/icon/2026_left_icon.png';
import rightIcon from '../../assets/icon/2026_right_icon.webp';
import headerBg from '../../assets/icon/2026_header_bg.webp';

/* ───────────────────────────────────────────────
   Constants
─────────────────────────────────────────────── */
const VISIBLE_COUNT = 5;
const SKELETON_ROW = 5;
const TABLET_MIN_PX = 768;

type TopTab = 'pwp' | 'hotsale' | 'featured';

/* ───────────────────────────────────────────────
   Date helpers
─────────────────────────────────────────────── */
function getDateTabs() {
  const today = new Date();
  return [0, 1, 2].map((offset) => {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  });
}

const TIME_SLOTS = ['12-14h', '20-22h'];

/* ───────────────────────────────────────────────
   Countdown hook  (đếm ngược đến cuối ngày)
─────────────────────────────────────────────── */
function useCountdown() {
  const calc = () => {
    const now = new Date();
    const end = new Date(now);
    end.setHours(23, 59, 59, 0);
    const diff = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
    const h = String(Math.floor(diff / 3600)).padStart(2, '0');
    const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
    const s = String(diff % 60).padStart(2, '0');
    return { h, m, s };
  };
  const [tick, setTick] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setTick(calc()), 1000);
    return () => clearInterval(id);
  }, []);
  return tick;
}

/* ───────────────────────────────────────────────
   Countdown display  (KẾT THÚC SAU  00 : 13 : 42)
─────────────────────────────────────────────── */
function CountdownBar() {
  const { h, m, s } = useCountdown();
  const blocks = [h, m, s];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span
        style={{ fontSize: 12, fontWeight: 700, color: '#fff', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}
      >
        KẾT THÚC SAU
      </span>
      {blocks.map((val, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 34,
              height: 30,
              background: '#1a1a1a',
              borderRadius: 4,
              fontFamily: 'monospace',
              fontSize: 17,
              fontWeight: 800,
              color: '#fff',
              letterSpacing: '0.05em',
              boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
            }}
          >
            {val}
          </span>
          {i < 2 && (
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 18, lineHeight: 1 }}>:</span>
          )}
        </span>
      ))}
    </div>
  );
}

/* ───────────────────────────────────────────────
   Sold progress bar
─────────────────────────────────────────────── */
function SoldBar({ sold, max }: { sold: number; max: number }) {
  const pct = Math.min(100, max > 0 ? Math.round((sold / max) * 100) : 0);
  return (
    <div style={{ marginTop: 6 }}>
      <div
        style={{
          height: 6,
          borderRadius: 99,
          background: '#fde2b0',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            borderRadius: 99,
            background: 'linear-gradient(90deg,#f97316,#ef4444)',
          }}
        />
      </div>
      <p
        style={{
          marginTop: 2,
          fontSize: 10,
          fontWeight: 700,
          color: '#c2410c',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        {/* flame svg */}
        <svg width="9" height="11" viewBox="0 0 9 11" fill="none" aria-hidden>
          <path
            d="M4.5 0C4.5 0 6.5 2.5 6.5 4.5C6.5 5.33 6.16 6.08 5.6 6.6C5.85 6.05 5.88 5.36 5.5 4.75C5.5 4.75 4.5 6 4.5 7C4.5 7.83 5.17 8.5 6 8.5C6 9.88 4.88 11 3.5 11C2.12 11 1 9.88 1 8.5C1 7 4.5 4 4.5 0Z"
            fill="#f97316"
          />
        </svg>
        Đã bán {sold}/{max} suất
      </p>
    </div>
  );
}

/* ───────────────────────────────────────────────
   Product card  (compact flash-sale style)
─────────────────────────────────────────────── */
function FlashCard({
  product,
  showSoldBar,
}: {
  product: ProductFullResponse;
  showSoldBar?: boolean;
}) {
  const card = useMemo(() => mapProductFullToCard(product), [product]);
  const [imgSrc, setImgSrc] = useState(card.image);
  useEffect(() => setImgSrc(card.image), [card.image]);

  const maxSlot = useMemo(() => {
    const base = Math.max(20, (card.soldCount ?? 0) + 10 + ((product.id * 7) % 40));
    return base;
  }, [product.id, card.soldCount]);

  return (
    <Link
      to={`/products/${product.id}`}
      style={{ display: 'block', height: '100%', textDecoration: 'none', color: 'inherit' }}
    >
      <article
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#fff',
          borderRadius: 8,
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
          transition: 'all .18s',
          cursor: 'pointer',
        }}
        className="group hover:-translate-y-0.5 hover:shadow-md"
      >
        {/* Image */}
        <div style={{ position: 'relative', aspectRatio: '1', width: '100%', overflow: 'hidden', background: '#f9fafb' }}>
          <img
            src={imgSrc}
            alt={card.name}
            loading="lazy"
            onError={() => setImgSrc(DEFAULT_PRODUCT_IMAGE)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            className="transition-transform duration-300 group-hover:scale-105"
          />
          {typeof card.discountPercent === 'number' && card.discountPercent > 0 && (
            <span
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                background: 'linear-gradient(135deg,#ca0e07,#f97316)',
                color: '#fff',
                fontSize: 11,
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: '0 0 8px 0',
              }}
            >
              -{card.discountPercent}%
            </span>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: '8px 10px 10px', display: 'flex', flexDirection: 'column', flex: 1 }}>
          <p
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: '#111',
              lineHeight: 1.4,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              minHeight: 34,
              margin: 0,
            }}
          >
            {card.name}
          </p>

          <div style={{ marginTop: 6, display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#ca0e07' }}>
              {formatPrice(Math.round(card.price))}
            </span>
            {typeof card.originalPrice === 'number' && card.originalPrice > card.price && (
              <span style={{ fontSize: 10, color: '#9ca3af', textDecoration: 'line-through' }}>
                {formatPrice(Math.round(card.originalPrice))}
              </span>
            )}
          </div>

          {showSoldBar ? (
            <SoldBar sold={card.soldCount ?? 0} max={maxSlot} />
          ) : (
            <div style={{ marginTop: 4, fontSize: 10, color: '#6b7280' }}>
              Đã bán {card.soldCount ?? 0}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}

/* ───────────────────────────────────────────────
   Carousel wrapper
─────────────────────────────────────────────── */
function FlashCarousel({
  products,
  isPending,
  isError,
  error,
  refetch,
  showSoldBar,
  tabKey,
}: {
  products: ProductFullResponse[] | undefined;
  isPending: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
  showSoldBar?: boolean;
  tabKey: string;
}) {
  const { t } = useI18n();
  const viewportRef = useRef<HTMLDivElement>(null);
  const [startIndex, setStartIndex] = useState(0);
  const [layout, setLayout] = useState({ itemW: 0, stepPx: 0 });

  const errorDetail = useMemo(() => {
    if (!error) return null;
    if (axios.isAxiosError(error)) {
      const body = error.response?.data as { message?: string } | undefined;
      if (typeof body?.message === 'string' && body.message.trim()) return body.message.trim();
    }
    return t('common_unexpected_error');
  }, [error, t]);

  const items = products ?? [];
  const maxStart = Math.max(0, items.length - VISIBLE_COUNT);
  const canNav = maxStart > 0;

  useEffect(() => { setStartIndex(0); }, [products]);
  useEffect(() => { if (startIndex > maxStart) setStartIndex(maxStart); }, [startIndex, maxStart]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const measure = () => {
      const cw = el.clientWidth;
      if (!cw) return;
      const gap = window.matchMedia(`(min-width:${TABLET_MIN_PX}px)`).matches ? 12 : 8;
      const itemW = (cw - gap * (VISIBLE_COUNT - 1)) / VISIBLE_COUNT;
      const step = items.length > VISIBLE_COUNT ? itemW + gap : 0;
      setLayout({ itemW, stepPx: step });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [items.length]);

  const goNext = () => setStartIndex((s) => (s >= maxStart ? 0 : s + 1));
  const goPrev = () => setStartIndex((s) => (s <= 0 ? maxStart : s - 1));

  if (!isPending && !isError && items.length === 0) {
    return (
      <div style={{ padding: '32px 0', textAlign: 'center', color: '#6b7280', fontSize: 13 }}>
        {t('home_promo_list_empty')}
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ padding: '32px 0', textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: '#6b7280' }}>{t('home_promo_section_error')}</p>
        {errorDetail && <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>{errorDetail}</p>}
        <button
          type="button"
          onClick={() => void refetch()}
          style={{
            marginTop: 12, padding: '6px 18px', borderRadius: 6,
            border: '1px solid #d1d5db', background: 'transparent',
            fontSize: 13, cursor: 'pointer',
          }}
        >
          {t('common_retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="group relative" style={{ padding: '12px', paddingLeft: canNav ? 40 : 12, paddingRight: canNav ? 40 : 12 }}>
      <div ref={viewportRef} style={{ overflow: 'hidden' }}>
        {isPending ? (
          <div style={{ display: 'flex', gap: 12 }}>
            {Array.from({ length: SKELETON_ROW }).map((_, i) => (
              <div key={`sk-${tabKey}-${i}`} style={{ flex: '1 1 0%', minWidth: 0 }}>
                <ProductSkeleton />
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              gap: 12,
              transition: 'transform .3s ease-out',
              transform: layout.stepPx > 0 ? `translateX(-${startIndex * layout.stepPx}px)` : undefined,
            }}
          >
            {items.map((p) => (
              <div
                key={p.id}
                style={
                  layout.itemW > 0
                    ? { width: layout.itemW, flexShrink: 0 }
                    : { flex: `0 0 ${100 / VISIBLE_COUNT}%` }
                }
              >
                <FlashCard product={p} showSoldBar={showSoldBar} />
              </div>
            ))}
          </div>
        )}
      </div>

      {canNav && !isPending && (
        <>
          <button
            type="button"
            aria-label={t('home_promo_prev')}
            onClick={goPrev}
            className={cn(
              'absolute left-1 top-1/2 z-20 -translate-y-1/2',
              'flex h-9 w-9 items-center justify-center rounded-full',
              'border border-[#e5e7eb] bg-white text-gray-600 shadow',
              'opacity-100 transition-opacity hover:border-red-200 hover:text-red-600',
              'tablet:opacity-0 tablet:pointer-events-none tablet:group-hover:opacity-100 tablet:group-hover:pointer-events-auto',
            )}
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <button
            type="button"
            aria-label={t('home_promo_next')}
            onClick={goNext}
            className={cn(
              'absolute right-1 top-1/2 z-20 -translate-y-1/2',
              'flex h-9 w-9 items-center justify-center rounded-full',
              'border border-[#e5e7eb] bg-white text-gray-600 shadow',
              'opacity-100 transition-opacity hover:border-red-200 hover:text-red-600',
              'tablet:opacity-0 tablet:pointer-events-none tablet:group-hover:opacity-100 tablet:group-hover:pointer-events-auto',
            )}
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
        </>
      )}
    </div>
  );
}

/* ───────────────────────────────────────────────
   PWP filter
─────────────────────────────────────────────── */
function filterPwp(list: ProductFullResponse[] | undefined): ProductFullResponse[] | undefined {
  if (!list) return undefined;
  return list.filter((p) => {
    const progs =
      p.purchaseWithPurchasePrograms ??
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (p as any)['purchase_with_purchase_programs'];
    return Array.isArray(progs) && progs.some((pg: { role: string }) => pg.role === 'anchor');
  });
}

/* ───────────────────────────────────────────────
   Main export
─────────────────────────────────────────────── */
export default function HomePromoProductSections() {
  const { t } = useI18n();
  const [activeTopTab, setActiveTopTab] = useState<TopTab>('pwp');

  /* ── Queries ── */
  const hotSaleQuery = useQuery({
    queryKey: ['products', 'hot-sale', 'all'],
    queryFn: ({ signal }) => productService.getHotSale({ all: true, signal }),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  const featuredQuery = useQuery({
    queryKey: ['products', 'is-featured', 'all'],
    queryFn: ({ signal }) => productService.getIsFeatured({ all: true, signal }),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  const activePromotionsQuery = useQuery({
    queryKey: ['products', 'active-promotions'],
    queryFn: ({ signal }) => productService.getActivePromotions({ signal }),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  const pwpQuery = {
    products: filterPwp(activePromotionsQuery.data?.purchase_with_purchase),
    isPending: activePromotionsQuery.isPending,
    isError: activePromotionsQuery.isError,
    error: activePromotionsQuery.error,
    refetch: activePromotionsQuery.refetch,
  };

  const TOP_TABS: { id: TopTab; label: string }[] = [
    { id: 'pwp', label: 'COMBO DEAL' },
    { id: 'hotsale', label: 'HOT SALE' },
    { id: 'featured', label: 'NỔI BẬT' },
  ];

  type QueryShape = {
    products: ProductFullResponse[] | undefined;
    isPending: boolean;
    isError: boolean;
    error: unknown;
    refetch: () => void;
  };

  const dataMap: Record<TopTab, QueryShape & { showSoldBar?: boolean; viewAllPath?: string }> = {
    pwp: { ...pwpQuery, showSoldBar: false, viewAllPath: '/products/promotions' },
    hotsale: {
      products: hotSaleQuery.data,
      isPending: hotSaleQuery.isPending,
      isError: hotSaleQuery.isError,
      error: hotSaleQuery.error,
      refetch: hotSaleQuery.refetch,
      showSoldBar: true,
      viewAllPath: '/products/hot-sale',
    },
    featured: {
      products: featuredQuery.data,
      isPending: featuredQuery.isPending,
      isError: featuredQuery.isError,
      error: featuredQuery.error,
      refetch: featuredQuery.refetch,
      showSoldBar: false,
      viewAllPath: '/products/featured',
    },
  };

  const active = dataMap[activeTopTab];

  /* ── Notice ticker for pwp / hotsale ── */
  const showNotice = activeTopTab !== 'featured';
  const noticeText =
    'Chỉ áp dụng thanh toán online thành công — Mỗi SĐT chỉ được mua 1 sản phẩm cùng loại — Không áp dụng cùng ưu đãi S-Student';

  return (
    <section
      style={{
        marginTop: 64,
        position: 'relative',
        /* No overflow:hidden — tab cards protrude above the box top */
      }}
    >
      {/* ══ BACKDROP — header bg image strip above the box ══ */}
      <div
        style={{
          backgroundImage: `url(${headerBg})`,
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',


          borderRadius: '24px 24px 0 0',
          height: 56,
        }}
      />

      {/* ══ THE BOX — mặt trước chiếc hộp ══ */}
      <div
        style={{
          position: 'relative',
          /* Mặt trước chiếc hộp — red gradient + gold triple inset border */
          background: 'linear-gradient(rgb(202,14,7) 0%, rgb(212,21,9) 55%, rgb(212,21,9) 100%)',
          boxShadow:
            'rgb(255,247,220) 0px 0px 0px 1px inset, rgb(242,215,159) 0px 0px 0px 3px inset, rgb(185,133,52) 0px 0px 0px 4px inset',
          border: '1px solid rgb(255,243,207)',
          borderRadius: 24,
          /* Overlap header strip to merge seamlessly */
          marginTop: -20,
          /* paddingTop must clear the tab cards: 54px tall - 10px translate = 44px inside */
          paddingTop: 48,
          paddingLeft: 14,
          paddingRight: 14,
          paddingBottom: 10,
        }}
      >


        {/* ── 3 TAB CARDS — 10% nhỏ hơn (54→49px) ── */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'calc(100% - 60px)',
            display: 'flex',
            justifyContent: 'center',
            gap: 8,
            height: 49,
            zIndex: 10,
          }}
        >
          {TOP_TABS.map((tab) => {
            const isActive = tab.id === activeTopTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTopTab(tab.id)}
                style={{
                  position: 'relative',
                  top: 'calc(100% - 150px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  width: 350,
                  flexShrink: 0,
                  transform: 'translateY(-10px)',
                  transition: 'all 300ms',
                  userSelect: 'none',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                {/* Card background layer: h-49px */}
                <div
                  aria-hidden
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1,
                    height: 49,
                    width: '92%',
                    overflow: 'hidden',
                    borderRadius: '14px 14px 0 0',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '14px 14px 0 0',
                      backgroundImage: isActive
                        ? 'linear-gradient(rgb(207, 31, 43), rgb(217, 65, 72))'
                        : 'linear-gradient(rgb(155, 12, 22), rgb(175, 35, 48))',
                      boxShadow: 'rgb(143, 15, 26) 0px -5px 5px inset, inset 0 1px 0 rgba(255,255,255,0.35)',
                    }}
                  />
                </div>

                {/* Bottom dark shadow bar: h-11px */}
                <div
                  aria-hidden
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    zIndex: 0,
                    height: 11,
                    width: '100%',
                    borderRadius: '16px 16px 0 0',
                    backgroundColor: 'rgb(143, 15, 26)',
                    transition: 'all 300ms',
                  }}
                />

                {/* Text label */}
                <div
                  style={{
                    position: 'relative',
                    zIndex: 2,
                    padding: '0 8px',
                    textAlign: 'center',
                    fontSize: 12,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    fontStyle: 'italic',
                    color: '#fff',
                    transition: 'all 300ms',
                    letterSpacing: '0.04em',
                    lineHeight: 1.25,
                  }}
                >
                  {tab.label}
                </div>
              </button>
            );
          })}
        </div>

        {/* ══ PRODUCT CAROUSEL — inside the red box ══ */}
        <div style={{ position: 'relative', zIndex: 1, marginTop: 8 }}>
          <FlashCarousel
            products={active.products}
            isPending={active.isPending}
            isError={active.isError}
            error={active.error}
            refetch={active.refetch}
            showSoldBar={active.showSoldBar}
            tabKey={activeTopTab}
          />
        </div>
      </div>
    </section>

  );
}
