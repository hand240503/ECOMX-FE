import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CreditCard, Zap } from 'lucide-react';
import { productService } from '../../api/services/productService';
import { formatPrice } from '../../lib/formatPrice';
import { DEFAULT_PRODUCT_IMAGE } from '../../constants/defaultImages';
import { coerceActivePriceChangeSnapshot } from '../../lib/productPricingDisplay';
import type { ActivePriceChangeSnapshot, ProductFullResponse } from '../../api/types/product.types';
import ProductSkeleton from '../product/ProductSkeleton';
import { useRouteLoadingNavigation } from '../../app/loading/useRouteLoadingNavigation';

const VISIBLE_COUNT = 5;

/* ── Helpers ── */

/** Tìm variant active có PC tốt nhất (sale thấp nhất). */
function pickBestPcVariant(product: ProductFullResponse): {
  pc: ActivePriceChangeSnapshot;
  imageUrl: string | null;
} | null {
  const variants = product.variants;
  if (!Array.isArray(variants)) return null;

  let best: { pc: ActivePriceChangeSnapshot; imageUrl: string | null } | null = null;

  for (const raw of variants) {
    if (!raw || typeof raw !== 'object') continue;
    const v = raw as Record<string, unknown>;

    const isActive = v['active'] !== false;
    if (!isActive) continue;

    const pcRaw = v['activePriceChange'] ?? v['active_price_change'];
    const pc = coerceActivePriceChangeSnapshot(pcRaw);
    if (!pc) continue;

    // Bỏ qua nếu hết quota
    if (
      pc.remainingQuantity != null
        ? pc.remainingQuantity <= 0
        : pc.quantityLimit != null &&
          pc.soldQuantity != null &&
          pc.soldQuantity >= pc.quantityLimit
    ) {
      continue;
    }

    if (!best || pc.salePrice < best.pc.salePrice) {
      const imgUrl =
        (v['mainImageUrl'] as string | null) ??
        (v['thumbnailUrl'] as string | null) ??
        (v['imageUrl'] as string | null) ??
        null;
      best = { pc, imageUrl: imgUrl };
    }
  }

  return best;
}

/** Tìm `endAt` gần nhất trong tất cả product PC để đếm ngược. */
function findNearestEndAt(products: ProductFullResponse[]): Date | null {
  let nearest: Date | null = null;
  for (const p of products) {
    if (!Array.isArray(p.variants)) continue;
    for (const raw of p.variants) {
      if (!raw || typeof raw !== 'object') continue;
      const v = raw as Record<string, unknown>;
      const pcRaw = v['activePriceChange'] ?? v['active_price_change'];
      const pc = coerceActivePriceChangeSnapshot(pcRaw);
      if (!pc?.endAt) continue;
      const d = new Date(pc.endAt);
      if (isNaN(d.getTime())) continue;
      if (!nearest || d < nearest) nearest = d;
    }
  }
  return nearest;
}

/* ── Countdown đến endAt gần nhất của PC ── */
function useCountdown(target: Date | null) {
  const calc = () => {
    if (!target) return null;
    const diff = Math.max(0, Math.floor((target.getTime() - Date.now()) / 1000));
    return {
      h: String(Math.floor(diff / 3600)).padStart(2, '0'),
      m: String(Math.floor((diff % 3600) / 60)).padStart(2, '0'),
      s: String(diff % 60).padStart(2, '0'),
      done: diff === 0,
    };
  };

  const [tick, setTick] = useState(calc);

  useEffect(() => {
    if (!target) { setTick(null); return; }
    setTick(calc());
    const id = setInterval(() => setTick(calc()), 1000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.getTime()]);

  return tick;
}

/* ── Sold progress bar ── */
function SoldBar({ pc }: { pc: ActivePriceChangeSnapshot }) {
  const limit = pc.quantityLimit;
  const sold = pc.soldQuantity ?? 0;
  const remaining =
    pc.remainingQuantity != null
      ? pc.remainingQuantity
      : limit != null
        ? Math.max(0, limit - sold)
        : null;
  const pct = limit != null && limit > 0 ? Math.min(100, Math.round((sold / limit) * 100)) : null;

  if (pct === null) return null;

  return (
    <div className="mt-2">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
        <div
          className={`h-full rounded-full transition-all ${pct > 80 ? 'bg-red-400' : 'bg-gradient-to-r from-yellow-300 to-orange-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-[10px] text-white/70">
        {remaining != null && remaining <= 10
          ? `Chỉ còn ${remaining} sản phẩm!`
          : `Đã bán ${pct}%`}
      </p>
    </div>
  );
}

/* ── Product card ── */
function FlashSaleCard({
  product,
  pc,
  variantImageUrl,
}: {
  product: ProductFullResponse;
  pc: ActivePriceChangeSnapshot;
  variantImageUrl: string | null;
}) {
  const imageUrl =
    variantImageUrl ??
    product.mainImageUrl ??
    product.imageUrl ??
    product.thumbnailUrl ??
    DEFAULT_PRODUCT_IMAGE;

  const [imgSrc, setImgSrc] = useState(imageUrl);
  useEffect(() => setImgSrc(imageUrl), [imageUrl]);

  const basePrice = pc.basePrice;
  const salePrice = pc.salePrice;
  const discountPct = basePrice > salePrice && basePrice > 0
    ? Math.round(((basePrice - salePrice) / basePrice) * 100)
    : 0;

  const pmCode = pc.requiredPaymentMethodCode;

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
          alt={product.productName}
          loading="lazy"
          onError={() => setImgSrc(DEFAULT_PRODUCT_IMAGE)}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {discountPct > 0 && (
          <span className="absolute top-0 left-0 rounded-br-lg bg-yellow-400 px-1.5 py-0.5 text-[10px] font-black text-red-700">
            -{discountPct}%
          </span>
        )}
        {pmCode && (
          <div className="absolute bottom-0 left-0 right-0 flex items-center gap-1 bg-blue-600/90 px-2 py-0.5 text-[10px] font-semibold text-white">
            <CreditCard className="size-2.5 shrink-0" />
            {pmCode}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="pt-2 flex flex-col flex-1">
        <p className="line-clamp-2 text-[11px] font-medium text-white leading-tight min-h-[30px]">
          {product.productName}
        </p>
        <div className="mt-1.5">
          <p className="text-[13px] font-black text-yellow-300">
            {formatPrice(salePrice)}
          </p>
          {basePrice > salePrice && (
            <p className="text-[10px] text-white/50 line-through">
              {formatPrice(basePrice)}
            </p>
          )}
        </div>
        <SoldBar pc={pc} />
      </div>
    </Link>
  );
}

/* ── Main ── */
export default function HomeFlashSale() {
  const { navigateWithLoading } = useRouteLoadingNavigation();
  const viewportRef = useRef<HTMLDivElement>(null);
  const [startIndex, setStartIndex] = useState(0);
  const [itemW, setItemW] = useState(0);

  const { data, isPending } = useQuery({
    queryKey: ['active-promotions'],
    queryFn: ({ signal }) => productService.getActivePromotions({ signal }),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  /** Sản phẩm có PC hợp lệ, kèm best-PC và ảnh variant */
  const flashItems = useMemo(() => {
    const raw = data?.price_change ?? [];
    const result: { product: ProductFullResponse; pc: ActivePriceChangeSnapshot; variantImageUrl: string | null }[] = [];
    for (const p of raw) {
      const best = pickBestPcVariant(p);
      if (best) result.push({ product: p, pc: best.pc, variantImageUrl: best.imageUrl });
    }
    return result;
  }, [data]);

  const nearestEndAt = useMemo(() => findNearestEndAt(data?.price_change ?? []), [data]);
  const countdown = useCountdown(nearestEndAt);

  const maxStart = Math.max(0, flashItems.length - VISIBLE_COUNT);
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
  }, [flashItems.length]);

  useEffect(() => {
    if (startIndex > maxStart) setStartIndex(maxStart);
  }, [startIndex, maxStart]);

  const goNext = () => setStartIndex((i) => (i >= maxStart ? 0 : i + 1));
  const goPrev = () => setStartIndex((i) => (i <= 0 ? maxStart : i - 1));

  if (!isPending && flashItems.length === 0) return null;

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
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-yellow-300 fill-yellow-300 flex-shrink-0" />
          <span className="text-sm font-black text-white tracking-wide">Flash Sale</span>
        </div>

        {/* Countdown */}
        {countdown && !countdown.done && (
          <div className="flex items-center gap-1">
            {[countdown.h, countdown.m, countdown.s].map((val, i) => (
              <span key={i} className="flex items-center gap-1">
                <span className="flex h-6 min-w-[26px] items-center justify-center rounded bg-black/40 px-1 font-mono text-[13px] font-bold text-white tabular-nums">
                  {val}
                </span>
                {i < 2 && <span className="text-white/80 font-bold text-sm">:</span>}
              </span>
            ))}
          </div>
        )}

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
              {flashItems.map(({ product, pc, variantImageUrl }) => (
                <div
                  key={product.id}
                  style={itemW > 0 ? { width: itemW, flexShrink: 0 } : { flex: `0 0 ${100 / VISIBLE_COUNT}%` }}
                >
                  <FlashSaleCard product={product} pc={pc} variantImageUrl={variantImageUrl} />
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
              className="absolute left-0 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md text-gray-700 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-600 focus:outline-none"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Sản phẩm tiếp theo"
              onClick={goNext}
              className="absolute right-0 top-1/2 z-10 translate-x-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md text-gray-700 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-600 focus:outline-none"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </section>
  );
}
