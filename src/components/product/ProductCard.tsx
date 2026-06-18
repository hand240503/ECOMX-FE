import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Zap } from 'lucide-react';
import { DEFAULT_PRODUCT_IMAGE } from '../../constants/defaultImages';
import { formatPrice } from '../../lib/formatPrice';
import { useI18n } from '../../i18n/I18nProvider';
import { cn } from '../../lib/cn';
import { useCart } from '../../app/cart/CartProvider';
import { useAuth } from '../../app/auth/AuthProvider';
import { productService } from '../../api/services/productService';
import { cartLineKey } from '../../lib/cartStorage';
import { saveCheckoutLineKeys } from '../../lib/checkoutIntent';
import { toast } from 'react-hot-toast';

/* ─────────────────────────── helpers ─────────────────────────── */
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function HighlightedTitle({ text, highlight }: { text: string; highlight: string }) {
  const q = highlight.trim();
  if (!q) return <>{text}</>;
  const parts = text.split(new RegExp(`(${escapeRegExp(q)})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === q.toLowerCase() ? (
          <mark key={i} className="rounded-sm bg-[#FFF9C4] px-0.5 text-inherit">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

/* ─────────────────────────── types ─────────────────────────── */
export interface ProductCardProps {
  id?: number;
  name: string;
  brand?: string | null;
  image: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  rating?: number;
  soldCount?: number;
  location?: string;
  isFreeship?: boolean;
  variant?: 'grid' | 'list';
  highlightKeyword?: string;
  to?: string;
  priceIsFrom?: boolean;
  showPcSaleBadge?: boolean;
  volumeTierHint?: boolean;
  pwpHint?: boolean;
  className?: string;
  /** Spec chips for tech products — shown as pill badges */
  ram?: string;
  storage?: string;
  battery?: string;
  /** Whether wishlist heart is active */
  isWishlisted?: boolean;
  onWishlistToggle?: (e: React.MouseEvent) => void;
  onAddToCart?: (e: React.MouseEvent) => void;
}

/* ─────────────────────────── component ─────────────────────────── */
const ProductCard = ({
  id,
  name,
  brand,
  image,
  price,
  originalPrice,
  discountPercent,
  rating = 5,
  soldCount = 0,
  location = 'Hà Nội',
  isFreeship = true,
  variant = 'grid',
  highlightKeyword,
  to,
  className,
  priceIsFrom = false,
  showPcSaleBadge = false,
  volumeTierHint = false,
  pwpHint = false,
  ram,
  storage,
  battery,
  isWishlisted = false,
  onWishlistToggle,
  onAddToCart,
}: ProductCardProps) => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();

  const [imgSrc, setImgSrc] = useState(image);
  const [wishlisted, setWishlisted] = useState(isWishlisted);
  const [heartBeat, setHeartBeat] = useState(false);
  const heartRef = useRef<HTMLButtonElement>(null);

  const [buyLoading, setBuyLoading] = useState(false);

  useEffect(() => { setImgSrc(image); }, [image]);
  useEffect(() => { setWishlisted(isWishlisted); }, [isWishlisted]);

  const roundedRating = Math.min(5, Math.max(0, rating));
  const fullStars   = Math.floor(roundedRating);
  const hasHalf     = roundedRating - fullStars >= 0.5;
  const isList      = variant === 'list';

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlisted(v => !v);
    setHeartBeat(true);
    setTimeout(() => setHeartBeat(false), 400);
    onWishlistToggle?.(e);
  };

  const handleBuyNow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!id) {
      if (to) navigate(to);
      return;
    }

    setBuyLoading(true);
    try {
      const { product } = await productService.getDetail({ id });

      if (product.variants && product.variants.length > 0) {
        toast(t('pdp_variant_pick_price') || 'Vui lòng chọn phân loại sản phẩm', { icon: 'ℹ️' });
        if (to) navigate(to);
        return;
      }

      const priceRow = product.prices && product.prices.length > 0 ? product.prices[0] : null;
      if (!priceRow) {
        toast.error('Sản phẩm hiện tại không khả dụng');
        return;
      }

      addItem({
        productId: product.id,
        productName: product.productName,
        thumbnailUrl: imgSrc || null,
        unitId: priceRow.unitId,
        productVariantId: undefined,
        unitName: priceRow.unitName,
        unitPrice: priceRow.currentValue,
        quantity: 1,
      });

      const key = cartLineKey({
        productId: product.id,
        unitId: priceRow.unitId,
        productVariantId: undefined,
      });

      if (!isAuthenticated) {
        saveCheckoutLineKeys([key]);
        navigate('/login', { state: { from: '/checkout' } });
      } else {
        navigate('/checkout', { state: { keys: [key] } });
      }
    } catch (err) {
      console.error(err);
      toast.error('Có lỗi xảy ra khi xử lý mua ngay');
    } finally {
      setBuyLoading(false);
    }
  };

  /* ─── spec chips ─── */
  const specs = [
    ram     ? { label: ram,     icon: '💾' } : null,
    storage ? { label: storage, icon: '📦' } : null,
    battery ? { label: battery, icon: '🔋' } : null,
  ].filter(Boolean) as { label: string; icon: string }[];

  /* ─── sold count format ─── */
  const soldDisplay = soldCount >= 1000
    ? `${(soldCount / 1000).toFixed(soldCount % 1000 === 0 ? 0 : 1)}k`
    : soldCount.toString();

  /* ═══════════════════ LIST VARIANT ═══════════════════ */
  if (isList) {
    const listArticle = (
      <article
        className={cn(
          'group cursor-pointer rounded-[20px] border border-[#F0F0F5] bg-white',
          'transition-all duration-300 ease-out',
          'hover:-translate-y-0.5 hover:border-[#E30019]/20',
          'hover:shadow-[0_8px_32px_rgba(227,0,25,0.12)]',
          'flex gap-4 p-4',
          className
        )}
      >
        {/* Image */}
        <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-[#fafafa] to-[#f0f0f5]">
          <img
            src={imgSrc}
            alt={name}
            loading="lazy"
            onError={() => setImgSrc(DEFAULT_PRODUCT_IMAGE)}
            className="h-full w-full object-contain p-1 transition-transform duration-500 group-hover:scale-110"
          />
          {typeof discountPercent === 'number' && (
            <span className="absolute left-0 top-0 rounded-br-xl rounded-tl-2xl bg-gradient-to-r from-[#E30019] to-[#FF5F6D] px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
              -{discountPercent}%
            </span>
          )}
        </div>

        {/* Body */}
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div>
            <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-[#1a1a2e]">
              {highlightKeyword?.trim()
                ? <HighlightedTitle text={name} highlight={highlightKeyword} />
                : name}
            </h3>
            {brand && (
              <p className="mt-0.5 text-xs text-[#8888a0]">{brand}</p>
            )}
          </div>

          {/* Stars */}
          <div className="mt-1 flex items-center gap-1.5">
            <StarRow full={fullStars} half={hasHalf} />
            <span className="text-[11px] text-[#8888a0]">
              Đã bán {soldDisplay}
            </span>
          </div>

          {/* Price row */}
          <div className="mt-1 flex items-baseline gap-2">
            <span className="bg-gradient-to-r from-[#E30019] to-[#FF5F6D] bg-clip-text text-base font-bold text-transparent">
              {priceIsFrom && <span className="text-xs font-normal text-[#8888a0]">Từ </span>}
              {formatPrice(Math.round(price))}
            </span>
            {typeof originalPrice === 'number' && (
              <span className="text-xs text-[#b0b0c0] line-through">
                {formatPrice(Math.round(originalPrice))}
              </span>
            )}
          </div>
        </div>
      </article>
    );

    if (to) {
      return <Link to={to} className="block text-inherit no-underline">{listArticle}</Link>;
    }
    return listArticle;
  }

  /* ═══════════════════ GRID VARIANT (premium) ═══════════════════ */
  const gridArticle = (
    <article
      className={cn(
        'product-card group relative cursor-pointer select-none',
        'flex h-full flex-col',
        'rounded-[20px] border border-[#F0F0F5] bg-white',
        'shadow-[0_2px_12px_rgba(0,0,0,0.06)]',
        'transition-all duration-350 ease-out',
        'hover:-translate-y-2 hover:border-[#E30019]/15',
        'hover:shadow-[0_16px_48px_rgba(227,0,25,0.15),0_4px_16px_rgba(0,0,0,0.08)]',
        className
      )}
      style={{ transitionDuration: '350ms' }}
    >
      {/* ── Image Zone ── */}
      <div className="relative overflow-hidden rounded-t-[20px] bg-gradient-to-br from-[#fafafa] to-[#f2f2f8] pt-[100%]">
        <img
          src={imgSrc}
          alt={name}
          loading="lazy"
          onError={() => setImgSrc(DEFAULT_PRODUCT_IMAGE)}
          className="absolute inset-0 m-auto h-[85%] w-[85%] object-contain transition-transform duration-500 ease-out group-hover:scale-110"
        />

        {/* Discount badge */}
        {typeof discountPercent === 'number' && (
          <div className="absolute left-3 top-3 z-10">
            <span className="inline-flex items-center gap-0.5 rounded-xl bg-gradient-to-r from-[#E30019] to-[#FF5F6D] px-2.5 py-1 text-[11px] font-bold tracking-wide text-white shadow-[0_2px_8px_rgba(227,0,25,0.4)]">
              <Zap size={9} fill="white" strokeWidth={0} />
              -{discountPercent}%
            </span>
          </div>
        )}

        {/* Wishlist button */}
        <button
          ref={heartRef}
          onClick={handleWishlist}
          aria-label="Thêm vào yêu thích"
          className={cn(
            'absolute right-3 top-3 z-10',
            'flex h-8 w-8 items-center justify-center rounded-full',
            'border border-white/60 bg-white/80 backdrop-blur-sm',
            'shadow-[0_2px_8px_rgba(0,0,0,0.12)]',
            'transition-all duration-200',
            'hover:scale-110 hover:bg-white hover:shadow-[0_4px_12px_rgba(227,0,25,0.25)]',
            heartBeat && 'scale-125'
          )}
        >
          <Heart
            size={15}
            className={cn(
              'transition-all duration-200',
              wishlisted ? 'fill-[#E30019] text-[#E30019]' : 'text-[#aaaabc]'
            )}
            fill={wishlisted ? '#E30019' : 'none'}
          />
        </button>


      </div>

      {/* ── Content Zone ── */}
      <div className="flex flex-1 flex-col px-3.5 pb-3.5 pt-3">
        {/* Brand */}
        {brand && brand.trim() && (
          <p className="mb-0.5 truncate text-[10px] font-semibold uppercase tracking-widest text-[#9999b8]">
            {brand}
          </p>
        )}

        {/* Name */}
        <h3 className="line-clamp-2 min-h-[40px] text-[13.5px] font-semibold leading-[1.45] text-[#1a1a2e]">
          {highlightKeyword?.trim()
            ? <HighlightedTitle text={name} highlight={highlightKeyword} />
            : name}
        </h3>

        {/* Stars + sold */}
        <div className="mt-2 flex items-center gap-1.5">
          <StarRow full={fullStars} half={hasHalf} />
          <span className="text-[11px] text-[#8888a0]">
            ({soldDisplay} đã bán)
          </span>
        </div>

        {/* Spec chips */}
        {specs.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {specs.map(s => (
              <span
                key={s.label}
                className="inline-flex items-center gap-0.5 rounded-lg border border-[#ebebf5] bg-[#f7f7fb] px-2 py-0.5 text-[10.5px] font-medium text-[#5555a0]"
              >
                {s.icon} {s.label}
              </span>
            ))}
          </div>
        )}

        {/* Promotion badges */}
        {(showPcSaleBadge || volumeTierHint || pwpHint) && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {showPcSaleBadge && (
              <span className="rounded-lg border border-[#E30019]/30 bg-[#E30019]/8 px-1.5 py-0.5 text-[10px] font-semibold text-[#E30019]">
                {t('product_badge_sale')}
              </span>
            )}
            {volumeTierHint && (
              <span className="rounded-lg border border-primary/25 bg-primary/8 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                {t('product_hint_volume')}
              </span>
            )}
            {pwpHint && (
              <span className="rounded-lg border border-warning/35 bg-warning/12 px-1.5 py-0.5 text-[10px] font-medium text-warning">
                {t('product_hint_pwp')}
              </span>
            )}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Price block */}
        <div className="mt-2.5">
          <div className="flex items-baseline gap-2">
            <span className="bg-gradient-to-r from-[#E30019] to-[#FF5F6D] bg-clip-text text-[17px] font-bold leading-none text-transparent">
              {priceIsFrom && (
                <span className="text-xs font-normal text-[#8888a0]">Từ </span>
              )}
              {formatPrice(Math.round(price))}
            </span>
            {typeof originalPrice === 'number' && (
              <span className="text-xs font-medium text-[#b0b0c0] line-through">
                {formatPrice(Math.round(originalPrice))}
              </span>
            )}
          </div>

          {/* Freeship chip */}
          {isFreeship && (
            <span className="mt-1 inline-flex items-center gap-0.5 text-[10.5px] font-semibold text-[#27AE60]">
              🚚 {t('product_freeship')}
            </span>
          )}
        </div>

        {/* CTA — Mua ngay */}
        <button
          onClick={handleBuyNow}
          disabled={buyLoading}
          className={cn(
            'mt-3 w-full rounded-xl py-2.5',
            'bg-gradient-to-r from-[#E30019] to-[#FF5F6D]',
            'text-[13px] font-bold tracking-wide text-white',
            'shadow-[0_4px_16px_rgba(227,0,25,0.35)]',
            'transition-all duration-200',
            'hover:shadow-[0_6px_24px_rgba(227,0,25,0.50)] hover:brightness-110',
            'active:scale-[0.97] active:shadow-[0_2px_8px_rgba(227,0,25,0.30)]',
            buyLoading && 'opacity-65 cursor-not-allowed'
          )}
        >
          {buyLoading ? 'Đang xử lý...' : 'Mua ngay'}
        </button>
      </div>
    </article>
  );

  if (to) {
    return (
      <Link to={to} className="block h-full text-inherit no-underline">
        {gridArticle}
      </Link>
    );
  }

  return gridArticle;
};

/* ─────────────────────────── StarRow ─────────────────────────── */
function StarRow({ full, half }: { full: number; half: boolean }) {
  return (
    <div className="flex items-center gap-[1px]" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < full;
        const isHalf = !filled && i === full && half;
        return (
          <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill="none">
            {isHalf ? (
              <>
                <defs>
                  <linearGradient id={`hg-${i}`} x1="0" x2="1" y1="0" y2="0">
                    <stop offset="50%" stopColor="#F5A623" />
                    <stop offset="50%" stopColor="#e0e0ec" />
                  </linearGradient>
                </defs>
                <polygon
                  points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
                  fill={`url(#hg-${i})`}
                  stroke="#F5A623"
                  strokeWidth="1.5"
                />
              </>
            ) : (
              <polygon
                points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
                fill={filled ? '#F5A623' : '#e0e0ec'}
                stroke={filled ? '#F5A623' : '#d0d0e0'}
                strokeWidth="1.5"
              />
            )}
          </svg>
        );
      })}
    </div>
  );
}

export default ProductCard;
