import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { DEFAULT_PRODUCT_IMAGE } from '../../constants/defaultImages';
import { formatPrice } from '../../lib/formatPrice';
import { useI18n } from '../../i18n/I18nProvider';
import { cn } from '../../lib/cn';

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

export interface ProductCardProps {
  name: string;
  /** Hiển thị dưới tên SP (cùng style listing) */
  brand?: string | null;
  image: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  rating?: number;
  soldCount?: number;
  location?: string;
  isFreeship?: boolean;
  /** Mặc định grid — list dùng trên desktop theo PAGE_category.md */
  variant?: 'grid' | 'list';
  /** Chỉ dùng trang tìm kiếm — highlight từ khoá trong tên */
  highlightKeyword?: string;
  /** PDP / danh sách — điều hướng tới chi tiết */
  to?: string;
  /** Khi true, hiển thị “Từ” trước giá (SP đa biến thể). */
  priceIsFrom?: boolean;
  /** Snapshot BE — có SKU đang Price Change (listing đa biến thể). */
  showPcSaleBadge?: boolean;
  /** Có bậc giá theo SL (`volume_price_tiers`). */
  volumeTierHint?: boolean;
  /** Có chương trình PWP trên response. */
  pwpHint?: boolean;
  /** Gắn thêm class vào thẻ article (ví dụ carousel: min-w-0) */
  className?: string;
}

const ProductCard = ({
  name,
  brand,
  image,
  price,
  originalPrice,
  discountPercent,
  rating = 4.8,
  soldCount = 0,
  location = 'Ha Noi',
  isFreeship = true,
  variant = 'grid',
  highlightKeyword,
  to,
  className,
  priceIsFrom = false,
  showPcSaleBadge = false,
  volumeTierHint = false,
  pwpHint = false,
}: ProductCardProps) => {
  const { t } = useI18n();
  const [imgSrc, setImgSrc] = useState(image);
  useEffect(() => {
    setImgSrc(image);
  }, [image]);

  const roundedRating = Math.min(5, Math.max(0, Math.round(rating)));
  const isList = variant === 'list';

  const imageBlock = (
    <div
      className={cn(
        'relative overflow-hidden rounded-md bg-background',
        isList ? 'h-24 w-24 flex-shrink-0' : 'mb-3 aspect-square'
      )}
    >
      <img
        src={imgSrc}
        alt={name}
        loading="lazy"
        onError={() => setImgSrc(DEFAULT_PRODUCT_IMAGE)}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      {typeof discountPercent === 'number' && (
        <span className="absolute left-0 top-0 rounded-br-sm bg-danger px-1.5 py-0.5 text-caption font-semibold text-white">
          -{discountPercent}%
        </span>
      )}
    </div>
  );

  const body = (
    <div
      className={cn(
        'min-w-0',
        isList && 'flex flex-1 flex-col justify-between py-0.5',
        !isList && 'flex flex-1 flex-col'
      )}
    >
      <h3
        className={cn(
          'line-clamp-2 text-title text-text-primary',
          isList ? 'min-h-0' : 'min-h-[40px]'
        )}
      >
        {highlightKeyword?.trim() ? (
          <HighlightedTitle text={name} highlight={highlightKeyword} />
        ) : (
          name
        )}
      </h3>

      {brand != null && brand.trim() !== '' && (
        <p className="mb-1 line-clamp-1 text-caption text-text-secondary">
          {t('pdp_brand_prefix')}{' '}
          <span className="font-medium text-text-primary">{brand}</span>
        </p>
      )}

      <div className={cn('mb-2 mt-1 flex flex-wrap items-center gap-1', isList && 'mb-1 mt-1')}>
        <div className="flex items-center gap-0.5 text-warning">
          {Array.from({ length: 5 }).map((_, index) => (
            <Star
              key={index}
              size={11}
              fill="currentColor"
              className={index < roundedRating ? '' : 'text-border'}
            />
          ))}
        </div>
        <span className="text-caption text-text-secondary">
          | {t('product_sold').replace('{count}', String(soldCount))}
        </span>
      </div>

      <div className="font-semibold text-danger">
        {priceIsFrom ? (
          <span className="font-normal text-caption text-text-secondary">{t('product_price_from_prefix')}</span>
        ) : null}
        {formatPrice(Math.round(price))}
      </div>
      {typeof originalPrice === 'number' && (
        <div className="text-caption font-semibold text-[#a1a1aa] line-through decoration-[#a1a1aa] decoration-1">
          {formatPrice(Math.round(originalPrice))}
        </div>
      )}

      {(showPcSaleBadge || volumeTierHint || pwpHint) && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {showPcSaleBadge ? (
            <span className="rounded border border-danger/35 bg-danger/10 px-1.5 py-0.5 text-[10px] font-semibold leading-tight text-danger">
              {t('product_badge_sale')}
            </span>
          ) : null}
          {volumeTierHint ? (
            <span className="rounded border border-primary/25 bg-primary/8 px-1.5 py-0.5 text-[10px] font-medium leading-tight text-primary">
              {t('product_hint_volume')}
            </span>
          ) : null}
          {pwpHint ? (
            <span className="rounded border border-warning/35 bg-warning/12 px-1.5 py-0.5 text-[10px] font-medium leading-tight text-warning">
              {t('product_hint_pwp')}
            </span>
          ) : null}
        </div>
      )}

      <div
        className={cn(
          'flex items-center justify-between text-caption text-text-secondary',
          isList ? 'mt-1' : 'mt-auto pt-2'
        )}
      >
        <span className="truncate">{location}</span>
        {isFreeship && (
          <span className="flex-shrink-0 font-medium text-primary">{t('product_freeship')}</span>
        )}
      </div>
    </div>
  );

  const article = (
    <article
      className={cn(
        'group cursor-pointer rounded-md border border-border bg-surface transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-elevation-card',
        isList ? 'flex gap-3 p-3' : 'flex h-full min-h-0 flex-col p-3',
        className
      )}
    >
      {imageBlock}
      {body}
    </article>
  );

  if (to) {
    return (
      <Link to={to} className="block h-full min-h-0 text-inherit no-underline">
        {article}
      </Link>
    );
  }

  return article;
};

export default ProductCard;
