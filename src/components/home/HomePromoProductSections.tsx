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
import ProductCard from '../product/ProductCard';
import { Button } from '../ui/Button';
import { mapProductFullToCard } from '../../api/mappers/homeProductMapper';

/** Hiển thị 5 SP cùng lúc; next/prev dịch 1 SP, cuối nối đầu. Dữ liệu: GET …/hot-sale|is-featured ?all=true. */
const VISIBLE_COUNT = 5;
const SKELETON_ROW = 5;

const TABLET_MIN_PX = 768;

type PromoVariant = 'hotSale' | 'featured';

function HomeProductCarouselSection({
  title,
  products,
  isPending,
  isError,
  error,
  refetch,
  variant,
}: {
  title: string;
  products: ProductFullResponse[] | undefined;
  isPending: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
  variant: PromoVariant;
}) {
  const { t } = useI18n();
  const viewportRef = useRef<HTMLDivElement>(null);
  const [startIndex, setStartIndex] = useState(0);
  const [layout, setLayout] = useState({ itemW: 0, stepPx: 0 });

  const isHotSale = variant === 'hotSale';

  const errorDetail = useMemo(() => {
    if (!error) return null;
    if (axios.isAxiosError(error)) {
      const body = error.response?.data as { message?: string } | undefined;
      if (typeof body?.message === 'string' && body.message.trim() !== '') {
        return body.message.trim();
      }
    }
    return t('common_unexpected_error');
  }, [error, t]);

  const rawItems = useMemo(() => products ?? [], [products]);

  const maxStart = Math.max(0, rawItems.length - VISIBLE_COUNT);
  const canNav = maxStart > 0;

  const viewAllPath = isHotSale ? '/products/hot-sale' : '/products/featured';

  useEffect(() => {
    setStartIndex(0);
  }, [products]);

  useEffect(() => {
    if (startIndex > maxStart) setStartIndex(maxStart);
  }, [startIndex, maxStart]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const measure = () => {
      const cw = el.clientWidth;
      const n = rawItems.length;
      if (n === 0 || cw <= 0) {
        setLayout({ itemW: 0, stepPx: 0 });
        return;
      }
      const gap = window.matchMedia(`(min-width: ${TABLET_MIN_PX}px)`).matches ? 16 : 8;
      const slots = Math.min(VISIBLE_COUNT, n);
      const itemW = (cw - gap * Math.max(0, slots - 1)) / Math.max(slots, 1);
      const step = n > VISIBLE_COUNT ? itemW + gap : 0;
      setLayout({ itemW, stepPx: step });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [rawItems.length]);

  const goNext = () => {
    setStartIndex((s) => (s >= maxStart ? 0 : s + 1));
  };

  const goPrev = () => {
    setStartIndex((s) => (s <= 0 ? maxStart : s - 1));
  };

  if (!isPending && !isError && rawItems.length === 0) return null;

  const headerGradient = isHotSale
    ? 'bg-gradient-to-r from-[#c0392b] via-[#e74c3c] to-[#f39c12]'
    : 'bg-gradient-to-r from-[#1565C0] via-[#1e88e5] to-[#5e35b1]';

  return (
    <section className="mt-4 overflow-hidden rounded-lg border border-[#E6E6E6] bg-surface shadow-header">
      <div
        className={cn(
          'flex flex-col gap-2 px-4 py-3 tablet:flex-row tablet:items-center tablet:justify-between tablet:py-3.5',
          headerGradient
        )}
      >
        <h2 className="text-base font-bold uppercase tracking-wide text-white tablet:text-lg">{title}</h2>
        <Link
          to={viewAllPath}
          className="shrink-0 text-sm font-semibold text-white/95 underline-offset-2 hover:underline"
        >
          {t('home_promo_view_all')} &gt;&gt;
        </Link>
      </div>

      {isError && errorDetail && (
        <div className="px-4 py-10 text-center">
          <p className="text-body text-text-primary">{t('home_promo_section_error')}</p>
          <p className="mt-2 text-caption text-text-secondary">{errorDetail}</p>
          <Button
            type="button"
            variant="profileOutline"
            className="mt-4 min-w-[124px]"
            onClick={() => void refetch()}
          >
            {t('common_retry')}
          </Button>
        </div>
      )}

      {!isError && isPending && (
        <div className="bg-surface p-3 tablet:p-4">
          <div className="flex flex-nowrap items-stretch gap-2 tablet:gap-4">
            {Array.from({ length: SKELETON_ROW }).map((_, i) => (
              <div key={`home-promo-sk-${title}-${i}`} className="min-w-0 flex-[1_1_0%]">
                <ProductSkeleton />
              </div>
            ))}
          </div>
        </div>
      )}

      {!isError && !isPending && rawItems.length > 0 && (
        <div
          className={cn(
            'group relative bg-[#FAFAFA] p-3 tablet:p-4',
            canNav && 'tablet:px-10'
          )}
        >
          <div ref={viewportRef} className="overflow-hidden">
            <div
              className="flex flex-nowrap items-stretch gap-2 tablet:gap-4 transition-transform duration-300 ease-out"
              style={{
                transform:
                  layout.stepPx > 0 ? `translateX(-${startIndex * layout.stepPx}px)` : undefined,
              }}
            >
              {rawItems.map((p) => {
                const card = mapProductFullToCard(p);
                return (
                  <div
                    key={p.id}
                    className="min-w-0 shrink-0"
                    style={
                      layout.itemW > 0
                        ? { width: layout.itemW }
                        : { flex: `1 1 ${100 / Math.min(VISIBLE_COUNT, rawItems.length)}%` }
                    }
                  >
                    <ProductCard
                      to={`/products/${p.id}`}
                      name={card.name}
                      brand={card.brand}
                      image={card.image}
                      price={card.price}
                      originalPrice={card.originalPrice}
                      discountPercent={card.discountPercent}
                      rating={card.rating}
                      soldCount={card.soldCount}
                      location={card.location}
                      isFreeship={card.isFreeship}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {canNav && (
            <>
              <button
                type="button"
                aria-label={t('home_promo_prev')}
                onClick={goPrev}
                className={cn(
                  'absolute left-1 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full',
                  'border border-border bg-surface/95 text-text-primary shadow-elevation-card',
                  'transition-opacity duration-200',
                  'hover:border-primary/40 hover:text-primary',
                  'opacity-100 tablet:opacity-0 tablet:pointer-events-none tablet:group-hover:opacity-100 tablet:group-hover:pointer-events-auto',
                  'group-focus-within:opacity-100 group-focus-within:pointer-events-auto'
                )}
              >
                <ChevronLeft className="h-5 w-5" aria-hidden />
              </button>
              <button
                type="button"
                aria-label={t('home_promo_next')}
                onClick={goNext}
                className={cn(
                  'absolute right-1 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full',
                  'border border-border bg-surface/95 text-text-primary shadow-elevation-card',
                  'transition-opacity duration-200',
                  'hover:border-primary/40 hover:text-primary',
                  'opacity-100 tablet:opacity-0 tablet:pointer-events-none tablet:group-hover:opacity-100 tablet:group-hover:pointer-events-auto',
                  'group-focus-within:opacity-100 group-focus-within:pointer-events-auto'
                )}
              >
                <ChevronRight className="h-5 w-5" aria-hidden />
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}

/** Hot sale + Nổi bật — carousel. Khối «Dành cho bạn» dùng `ProductFeed` (25/trang + Xem thêm). */
export default function HomePromoProductSections() {
  const { t } = useI18n();

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

  return (
    <>
      <HomeProductCarouselSection
        title={t('home_hot_sale_title')}
        products={hotSaleQuery.data}
        isPending={hotSaleQuery.isPending}
        isError={hotSaleQuery.isError}
        error={hotSaleQuery.error}
        refetch={hotSaleQuery.refetch}
        variant="hotSale"
      />
      <HomeProductCarouselSection
        title={t('home_featured_title')}
        products={featuredQuery.data}
        isPending={featuredQuery.isPending}
        isError={featuredQuery.isError}
        error={featuredQuery.error}
        refetch={featuredQuery.refetch}
        variant="featured"
      />
    </>
  );
}
