import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { productService } from '../../api/services/productService';
import { mapProductFullToCard } from '../../api/mappers/homeProductMapper';
import { formatPrice } from '../../lib/formatPrice';
import { DEFAULT_PRODUCT_IMAGE } from '../../constants/defaultImages';
import type { ProductFullResponse } from '../../api/types/product.types';
import ProductSkeleton from '../product/ProductSkeleton';
import { useRouteLoadingNavigation } from '../../app/loading/useRouteLoadingNavigation';

const VISIBLE_COUNT = 5;

/* ── Countdown đến cuối ngày ── */
function useCountdown() {
  const calc = () => {
    const now = new Date();
    const end = new Date(now);
    end.setHours(23, 59, 59, 0);
    const diff = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
    return {
      h: String(Math.floor(diff / 3600)).padStart(2, '0'),
      m: String(Math.floor((diff % 3600) / 60)).padStart(2, '0'),
      s: String(diff % 60).padStart(2, '0'),
    };
  };
  const [tick, setTick] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setTick(calc()), 1000);
    return () => clearInterval(id);
  }, []);
  return tick;
}

/* ── Sold progress bar ── */
function SoldBar({ sold, max }: { sold: number; max: number }) {
  const pct = Math.min(100, max > 0 ? Math.round((sold / max) * 100) : 0);
  return (
    <div className="mt-2">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
        <div
          className="h-full rounded-full bg-gradient-to-r from-yellow-300 to-orange-400 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-[10px] text-white/70">Đã bán {sold}/{max}</p>
    </div>
  );
}

/* ── Product card ── */
function FlashSaleCard({ product }: { product: ProductFullResponse }) {
  const card = useMemo(() => mapProductFullToCard(product), [product]);
  const [imgSrc, setImgSrc] = useState(card.image);
  useEffect(() => setImgSrc(card.image), [card.image]);

  const maxSlot = useMemo(
    () => Math.max(20, (card.soldCount ?? 0) + 10 + ((product.id * 7) % 40)),
    [product.id, card.soldCount]
  );

  return (
    <Link
      to={`/products/${product.id}`}
      className="group flex flex-col rounded-xl overflow-hidden cursor-pointer"
      style={{ textDecoration: 'none' }}
    >
      {/* Image */}
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-white/10">
        <img
          src={imgSrc}
          alt={card.name}
          loading="lazy"
          onError={() => setImgSrc(DEFAULT_PRODUCT_IMAGE)}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {typeof card.discountPercent === 'number' && card.discountPercent > 0 && (
          <span className="absolute top-0 left-0 rounded-br-lg bg-yellow-400 px-1.5 py-0.5 text-[10px] font-black text-red-700">
            -{card.discountPercent}%
          </span>
        )}
      </div>

      {/* Info */}
      <div className="pt-2 flex flex-col flex-1">
        <p className="line-clamp-2 text-[11px] font-medium text-white leading-tight min-h-[30px]">
          {card.name}
        </p>
        <div className="mt-1.5">
          <p className="text-[13px] font-black text-yellow-300">
            {formatPrice(Math.round(card.price))}
          </p>
          {typeof card.originalPrice === 'number' && card.originalPrice > card.price && (
            <p className="text-[10px] text-white/50 line-through">
              {formatPrice(Math.round(card.originalPrice))}
            </p>
          )}
        </div>
        <SoldBar sold={card.soldCount ?? 0} max={maxSlot} />
      </div>
    </Link>
  );
}

/* ── Main ── */
export default function HomeFlashSale() {
  const { navigateWithLoading } = useRouteLoadingNavigation();
  const { h, m, s } = useCountdown();
  const viewportRef = useRef<HTMLDivElement>(null);
  const [startIndex, setStartIndex] = useState(0);
  const [itemW, setItemW] = useState(0);

  const { data: products = [], isPending } = useQuery({
    queryKey: ['products', 'hot-sale', 'all'],
    queryFn: ({ signal }) => productService.getHotSale({ all: true, signal }),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  const maxStart = Math.max(0, products.length - VISIBLE_COUNT);
  const canNav = maxStart > 0;

  /* Measure item width */
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const measure = () => {
      const gap = 10;
      const w = (el.clientWidth - gap * (VISIBLE_COUNT - 1)) / VISIBLE_COUNT;
      setItemW(w);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [products.length]);

  useEffect(() => {
    if (startIndex > maxStart) setStartIndex(maxStart);
  }, [startIndex, maxStart]);

  const goNext = () => setStartIndex((s) => (s >= maxStart ? 0 : s + 1));
  const goPrev = () => setStartIndex((s) => (s <= 0 ? maxStart : s - 1));

  if (!isPending && products.length === 0) return null;

  return (
    <section
      className="mt-4 rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(90deg, #7B0000 0%, #B71C1C 40%, #E30019 100%)',
        padding: '12px 14px 14px',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        {/* Title + countdown */}
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-yellow-300 fill-yellow-300 flex-shrink-0" />
          <span className="text-sm font-black text-white tracking-wide">Flash Sale</span>
        </div>

        {/* Countdown */}
        <div className="flex items-center gap-1">
          {[h, m, s].map((val, i) => (
            <span key={i} className="flex items-center gap-1">
              <span className="flex h-6 min-w-[26px] items-center justify-center rounded bg-black/40 px-1 font-mono text-[13px] font-bold text-white tabular-nums">
                {val}
              </span>
              {i < 2 && <span className="text-white/80 font-bold text-sm">:</span>}
            </span>
          ))}
        </div>

        {/* View all */}
        <button
          type="button"
          onClick={() => navigateWithLoading('/products')}
          className="ml-auto flex items-center gap-1 rounded-lg border border-white/30 bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-white/20 transition-colors outline-none focus:outline-none"
        >
          Xem tất cả +
        </button>
      </div>

      {/* Products carousel */}
      <div className="group relative">
        <div ref={viewportRef} className="overflow-hidden">
          {isPending ? (
            <div className="flex gap-2.5">
              {Array.from({ length: VISIBLE_COUNT }).map((_, i) => (
                <div key={i} style={{ flex: `0 0 ${100 / VISIBLE_COUNT}%` }} className="opacity-50">
                  <ProductSkeleton />
                </div>
              ))}
            </div>
          ) : (
            <div
              className="flex gap-2.5 transition-transform duration-300 ease-out"
              style={{
                transform: itemW > 0 ? `translateX(-${startIndex * (itemW + 10)}px)` : undefined,
              }}
            >
              {products.map((p) => (
                <div
                  key={p.id}
                  style={itemW > 0 ? { width: itemW, flexShrink: 0 } : { flex: `0 0 ${100 / VISIBLE_COUNT}%` }}
                >
                  <FlashSaleCard product={p} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Nav buttons */}
        {canNav && !isPending && (
          <>
            <button
              type="button"
              aria-label="Sản phẩm trước"
              onClick={goPrev}
              className="absolute left-0 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md text-gray-700 opacity-0 transition-opacity group-hover:opacity-100 hover:text-danger focus:outline-none"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Sản phẩm tiếp theo"
              onClick={goNext}
              className="absolute right-0 top-1/2 z-10 translate-x-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md text-gray-700 opacity-0 transition-opacity group-hover:opacity-100 hover:text-danger focus:outline-none"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </section>
  );
}
