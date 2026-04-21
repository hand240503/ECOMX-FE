import { useCallback, useEffect, useRef, useState } from 'react';
import { Heart, ImageIcon } from 'lucide-react';
import { cn } from '../../../lib/cn';
import { useI18n } from '../../../i18n/I18nProvider';

type ProductGalleryProps = {
  imageUrls: string[];
  activeIndex: number;
  onActiveIndexChange: (i: number) => void;
  isLoading: boolean;
  outOfStock: boolean;
  wishlisted: boolean;
  onToggleWishlist: () => void;
  onOpenLightbox: () => void;
};

function GalleryPlaceholder({ compact }: { compact?: boolean }) {
  const { t } = useI18n();
  return (
    <div
      className={cn(
        'flex w-full flex-col items-center justify-center bg-gradient-to-br from-background via-surface to-primary/10',
        compact ? 'min-h-[200px] py-8' : 'aspect-square'
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface shadow-card ring-1 ring-border/80 tablet:h-20 tablet:w-20">
        <ImageIcon className="h-8 w-8 text-primary/35 tablet:h-10 tablet:w-10" strokeWidth={1.25} aria-hidden />
      </div>
      {!compact && (
        <p className="mt-4 max-w-[220px] px-4 text-center text-caption leading-relaxed text-text-secondary">
          {t('pdp_image_placeholder')}
        </p>
      )}
    </div>
  );
}

export function ProductGallery({
  imageUrls,
  activeIndex,
  onActiveIndexChange,
  isLoading,
  outOfStock,
  wishlisted,
  onToggleWishlist,
  onOpenLightbox,
}: ProductGalleryProps) {
  const { t } = useI18n();
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const [badSrc, setBadSrc] = useState<Set<string>>(() => new Set());

  const hasUrls = imageUrls.length > 0;
  const mainSrc = hasUrls ? imageUrls[activeIndex] ?? imageUrls[0] : '';

  useEffect(() => {
    setBadSrc(new Set());
  }, [imageUrls]);

  const markBad = (url: string) => {
    setBadSrc((prev) => new Set(prev).add(url));
  };

  const showMainPlaceholder = !hasUrls || (mainSrc ? badSrc.has(mainSrc) : true);

  const onMobileScroll = useCallback(() => {
    const el = mobileScrollRef.current;
    if (!el || imageUrls.length <= 1) return;
    const w = el.clientWidth;
    if (w <= 0) return;
    const i = Math.round(el.scrollLeft / w);
    onActiveIndexChange(Math.min(Math.max(0, i), imageUrls.length - 1));
  }, [imageUrls.length, onActiveIndexChange]);

  useEffect(() => {
    const el = mobileScrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', onMobileScroll, { passive: true });
    return () => el.removeEventListener('scroll', onMobileScroll);
  }, [onMobileScroll]);

  const wishlistClass =
    'absolute right-3 top-3 z-dropdown rounded-full border border-border/60 bg-surface/95 p-2.5 shadow-card transition-all duration-200 hover:scale-105 hover:border-primary/30 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="aspect-square w-full animate-pulse rounded-xl bg-border/80" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-[52px] w-[52px] flex-shrink-0 animate-pulse rounded-lg bg-border/80 tablet:h-16 tablet:w-16"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative hidden tablet:block">
        <button
          type="button"
          onClick={onToggleWishlist}
          className={wishlistClass}
          aria-label={t('pdp_wishlist_aria')}
        >
          <Heart
            size={22}
            className={cn(wishlisted ? 'fill-danger text-danger' : 'text-text-secondary')}
            strokeWidth={wishlisted ? 0 : 2}
          />
        </button>

        <div
          className={cn(
            'relative overflow-hidden rounded-xl border border-border/50 bg-background shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]',
            outOfStock && 'opacity-55'
          )}
        >
          {outOfStock && (
            <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-white/50 to-transparent" />
          )}
          {showMainPlaceholder ? (
            <GalleryPlaceholder />
          ) : (
            <button
              type="button"
              onClick={onOpenLightbox}
              className="block aspect-square w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <img
                src={mainSrc}
                alt=""
                loading="eager"
                className="h-full w-full object-cover"
                onError={() => markBad(mainSrc)}
              />
            </button>
          )}
        </div>

        {hasUrls && imageUrls.length > 1 && !showMainPlaceholder && (
          <div className="mt-4 flex gap-2.5 overflow-x-auto pb-1">
            {imageUrls.map((src, i) => (
              <button
                key={`${src}-${i}`}
                type="button"
                onMouseEnter={() => onActiveIndexChange(i)}
                onFocus={() => onActiveIndexChange(i)}
                onClick={() => onActiveIndexChange(i)}
                className={cn(
                  'h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 bg-background transition-all duration-200',
                  i === activeIndex
                    ? 'border-primary shadow-sm ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/40'
                )}
              >
                {badSrc.has(src) ? (
                  <div className="flex h-full w-full items-center justify-center bg-background">
                    <ImageIcon className="h-6 w-6 text-border" aria-hidden />
                  </div>
                ) : (
                  <img
                    src={src}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                    onError={() => markBad(src)}
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative tablet:hidden">
        <button
          type="button"
          onClick={onToggleWishlist}
          className={wishlistClass}
          aria-label={t('pdp_wishlist_aria')}
        >
          <Heart
            size={22}
            className={cn(wishlisted ? 'fill-danger text-danger' : 'text-text-secondary')}
            strokeWidth={wishlisted ? 0 : 2}
          />
        </button>

        <div
          className={cn(
            'relative overflow-hidden rounded-xl border border-border/50 bg-background shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]',
            outOfStock && 'opacity-55'
          )}
        >
          {outOfStock && (
            <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-white/50 to-transparent" />
          )}
          {!hasUrls ? (
            <GalleryPlaceholder />
          ) : (
            <div
              ref={mobileScrollRef}
              className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {imageUrls.map((src, i) => (
                <button
                  key={`${src}-m-${i}`}
                  type="button"
                  onClick={onOpenLightbox}
                  className="w-full min-w-full flex-shrink-0 snap-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  {badSrc.has(src) ? (
                    <GalleryPlaceholder compact />
                  ) : (
                    <img
                      src={src}
                      alt=""
                      loading={i === 0 ? 'eager' : 'lazy'}
                      className="aspect-square w-full object-cover"
                      onError={() => markBad(src)}
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {hasUrls && imageUrls.length > 1 && (
          <div className="mt-3 flex justify-center gap-2">
            {imageUrls.map((src, i) => (
              <span
                key={`dot-${i}`}
                className={cn(
                  'h-2 rounded-full transition-all duration-200',
                  i === activeIndex ? 'w-5 bg-primary' : 'w-2 bg-border',
                  badSrc.has(src) && i === activeIndex && 'bg-text-disabled'
                )}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
