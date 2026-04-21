import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from '../ProductCard';
import ProductSkeleton from '../ProductSkeleton';
import { mapProductFullToCard } from '../../../api/mappers/homeProductMapper';
import type { ProductFullResponse } from '../../../api/types/product.types';
import { useI18n } from '../../../i18n/I18nProvider';
import { cn } from '../../../lib/cn';

const GAP_PX = 12; /** gap-3 */
const PER_PAGE = 4;

function chunkArray<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function innerContentWidth(el: HTMLElement): number {
  const style = window.getComputedStyle(el);
  const pl = Number.parseFloat(style.paddingLeft) || 0;
  const pr = Number.parseFloat(style.paddingRight) || 0;
  return el.clientWidth - pl - pr;
}

type ProductRecommendationsProps = {
  products: ProductFullResponse[];
  isLoading: boolean;
  layout?: 'rail' | 'grid';
  className?: string;
};

export function ProductRecommendations({
  products,
  isLoading,
  layout = 'rail',
  className,
}: ProductRecommendationsProps) {
  const { t } = useI18n();
  const viewportRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [pageWidth, setPageWidth] = useState(0);
  const [rangeLabel, setRangeLabel] = useState('');

  const isGrid = layout === 'grid';
  const n = products.length;
  const pages = !isGrid && !isLoading ? chunkArray(products, PER_PAGE) : [];
  const showCarouselNav = !isGrid && !isLoading && pages.length > 1;

  const itemWidth =
    pageWidth > 0 ? (pageWidth - (PER_PAGE - 1) * GAP_PX) / PER_PAGE : 0;

  const measureViewport = useCallback(() => {
    const el = viewportRef.current;
    if (!el || isGrid) return;
    const w = innerContentWidth(el);
    setPageWidth(w > 0 ? w : 0);
  }, [isGrid]);

  useLayoutEffect(() => {
    if (isGrid) return;
    const el = viewportRef.current;
    if (!el) return;
    measureViewport();
    const ro = new ResizeObserver(() => measureViewport());
    ro.observe(el);
    return () => ro.disconnect();
  }, [isGrid, measureViewport, n, isLoading]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = 0;
  }, [n, products]);

  const updateRangeLabel = useCallback(() => {
    const el = scrollRef.current;
    if (!el || isGrid || pageWidth <= 0 || n === 0) {
      setRangeLabel('');
      return;
    }
    const pageCount = pages.length;
    if (pageCount <= 1) {
      setRangeLabel(
        t('pdp_reco_visible_range')
          .replace('{from}', '1')
          .replace('{to}', String(n))
          .replace('{total}', String(n))
      );
      return;
    }
    const pageIndex = Math.min(
      pageCount - 1,
      Math.max(0, Math.round(el.scrollLeft / pageWidth))
    );
    const from = pageIndex * PER_PAGE + 1;
    const to = Math.min((pageIndex + 1) * PER_PAGE, n);
    setRangeLabel(
      t('pdp_reco_visible_range')
        .replace('{from}', String(from))
        .replace('{to}', String(to))
        .replace('{total}', String(n))
    );
  }, [isGrid, pageWidth, n, pages.length, t]);

  useLayoutEffect(() => {
    if (isGrid || pageWidth <= 0) return;
    updateRangeLabel();
  }, [isGrid, pageWidth, updateRangeLabel, n]);

  const scrollByPage = useCallback(
    (dir: -1 | 1) => {
      const el = scrollRef.current;
      if (!el || pageWidth <= 0) return;
      const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
      const next = Math.min(
        Math.max(0, el.scrollLeft + dir * pageWidth),
        maxScroll
      );
      el.scrollTo({ left: next, behavior: 'smooth' });
      window.setTimeout(updateRangeLabel, 350);
    },
    [pageWidth, updateRangeLabel]
  );

  const onScroll = useCallback(() => {
    updateRangeLabel();
  }, [updateRangeLabel]);

  if (!isLoading && products.length === 0) return null;

  const itemStyle =
    !isGrid && itemWidth > 0
      ? {
          width: itemWidth,
          minWidth: itemWidth,
          maxWidth: itemWidth,
          flexShrink: 0 as const,
        }
      : undefined;

  const pageStyle =
    !isGrid && pageWidth > 0
      ? {
          width: pageWidth,
          minWidth: pageWidth,
          maxWidth: pageWidth,
          flexShrink: 0 as const,
        }
      : undefined;

  return (
    <section
      className={cn(
        'rounded-xl border border-border bg-surface p-4 shadow-sm tablet:p-5',
        className
      )}
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="text-heading text-text-primary">{t('pdp_similar_title')}</h2>
        {!isGrid && !isLoading && n > 0 && rangeLabel && (
          <p className="text-caption text-text-secondary">{rangeLabel}</p>
        )}
      </div>

      <div className={cn('relative mt-4', isGrid && 'mt-3')}>
        {!isGrid && (
          <div className={cn('min-w-0', showCarouselNav && 'px-9')}>
            <div ref={viewportRef} className="min-w-0 overflow-hidden">
              <div
                ref={scrollRef}
                onScroll={onScroll}
                className={cn(
                  'flex snap-x snap-mandatory overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
                  pageWidth > 0 && 'scroll-smooth'
                )}
                style={
                  pageWidth > 0
                    ? { width: pageWidth, scrollSnapType: 'x mandatory' }
                    : { width: '100%' }
                }
              >
                {isLoading && (
                  <div
                    className="flex shrink-0 snap-start gap-3"
                    style={
                      pageStyle ?? { width: '100%', minWidth: 0 }
                    }
                  >
                    {Array.from({ length: PER_PAGE }).map((_, j) => (
                      <div
                        key={j}
                        className="min-w-0 flex-1 flex-shrink-0"
                        style={
                          itemWidth > 0
                            ? itemStyle
                            : { flex: '1 1 0%', minWidth: 0 }
                        }
                      >
                        <ProductSkeleton />
                      </div>
                    ))}
                  </div>
                )}

                {!isLoading &&
                  pages.map((chunk, pageIdx) => (
                    <div
                      key={pageIdx}
                      className="flex shrink-0 snap-start justify-start gap-3"
                      style={{
                        ...pageStyle,
                        scrollSnapAlign: 'start',
                      }}
                    >
                      {chunk.map((p) => {
                        const card = mapProductFullToCard(p);
                        return (
                          <div key={p.id} className="flex-shrink-0" style={itemStyle}>
                            <ProductCard
                              to={`/products/${p.id}`}
                              name={card.name}
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
                  ))}
              </div>
            </div>
          </div>
        )}

        {isGrid && (
          <div className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3 [&>div]:min-w-0">
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <div key={`sk-${i}`}>
                  <ProductSkeleton />
                </div>
              ))}
            {!isLoading &&
              products.map((p) => {
                const card = mapProductFullToCard(p);
                return (
                  <div key={p.id}>
                    <ProductCard
                      to={`/products/${p.id}`}
                      name={card.name}
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
        )}

        {showCarouselNav && (
          <>
            <button
              type="button"
              onClick={() => scrollByPage(-1)}
              className="absolute left-0 top-[calc(50%+0.75rem)] z-dropdown flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface/95 text-text-primary shadow-sm transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label={t('pdp_recommendations_prev')}
            >
              <ChevronLeft size={16} strokeWidth={2.25} />
            </button>
            <button
              type="button"
              onClick={() => scrollByPage(1)}
              className="absolute right-0 top-[calc(50%+0.75rem)] z-dropdown flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface/95 text-text-primary shadow-sm transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label={t('pdp_recommendations_next')}
            >
              <ChevronRight size={16} strokeWidth={2.25} />
            </button>
          </>
        )}
      </div>
    </section>
  );
}
