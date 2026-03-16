import { Star } from 'lucide-react';
import { useI18n } from '../../i18n/I18nProvider';

export interface ProductCardProps {
  name: string;
  image: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  rating?: number;
  soldCount?: number;
  location?: string;
  isFreeship?: boolean;
}

const formatPrice = (value: number) => `${value.toLocaleString('vi-VN')} ₫`;

const ProductCard = ({
  name,
  image,
  price,
  originalPrice,
  discountPercent,
  rating = 4.8,
  soldCount = 0,
  location = 'Ha Noi',
  isFreeship = true
}: ProductCardProps) => {
  const { t } = useI18n();
  const roundedRating = Math.round(rating);

  return (
    <article className="group bg-white rounded-md p-3 border border-transparent hover:border-blue-200 hover:shadow-sm cursor-pointer transition-all">
      <div className="relative aspect-square mb-3 rounded-md overflow-hidden bg-gray-50">
        <img src={image} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        {typeof discountPercent === 'number' && (
          <span className="absolute left-0 top-0 bg-[#fdd835] text-[#27272a] text-[10px] font-semibold px-1.5 py-0.5 rounded-br-md">
            -{discountPercent}%
          </span>
        )}
      </div>

      <h3 className="text-sm text-gray-800 line-clamp-2 min-h-[40px]">{name}</h3>

      <div className="flex items-center gap-1 mt-1 mb-2">
        <div className="flex items-center gap-0.5 text-yellow-400">
          {Array.from({ length: 5 }).map((_, index) => (
            <Star
              key={index}
              size={11}
              fill="currentColor"
              className={index < roundedRating ? '' : 'text-gray-300'}
            />
          ))}
        </div>
        <span className="text-[11px] text-gray-500">| {t('product_sold').replace('{count}', String(soldCount))}</span>
      </div>

      <div className="text-red-500 font-semibold">{formatPrice(price)}</div>
      {typeof originalPrice === 'number' && (
        <div className="text-xs text-gray-400 line-through">{formatPrice(originalPrice)}</div>
      )}

      <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
        <span>{location}</span>
        {isFreeship && <span className="text-blue-600 font-medium">{t('product_freeship')}</span>}
      </div>
    </article>
  );
};

export default ProductCard;
