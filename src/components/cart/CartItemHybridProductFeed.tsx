import { useMemo } from 'react';
import ProductCard from '../product/ProductCard';
import ProductSkeleton from '../product/ProductSkeleton';
import { useI18n } from '../../i18n/I18nProvider';
import { mapProductFullToCard } from '../../api/mappers/homeProductMapper';
import { useCartRecommendationsWithHomeFallback } from '../../hooks/useCartItemHybridRecommendations';
import { Button } from '../ui/Button';
import axios from 'axios';

const SKELETON_COUNT = 12;

type CartItemHybridProductFeedProps = {
  /** Các `productId` trong giỏ (có thể trùng theo từng dòng) — sẽ unique + giữ thứ tự. */
  cartProductIds: number[];
  title: string;
};

const CartItemHybridProductFeed = ({ cartProductIds, title }: CartItemHybridProductFeedProps) => {
  const { t } = useI18n();
  const query = useCartRecommendationsWithHomeFallback(cartProductIds);
  const products = useMemo(
    () => (query.data?.products ?? []).map(mapProductFullToCard),
    [query.data?.products]
  );

  const showInitialSkeleton = query.isPending;
  const isError = query.isError;

  const errorDetail = useMemo(() => {
    const err = query.error;
    if (!err) return null;
    if (axios.isAxiosError(err)) {
      const body = err.response?.data as { message?: string } | undefined;
      if (typeof body?.message === 'string' && body.message.trim() !== '') {
        return body.message.trim();
      }
    }
    return err instanceof Error && err.message ? err.message : t('common_unexpected_error');
  }, [query.error, t]);

  const hybridSourceNote =
    query.data?.source === 'home' && products.length > 0
      ? t('cart_recommendations_fallback_note')
      : null;

  return (
    <section className="mt-4 rounded-md border border-border bg-surface shadow-header">
      <div className="border-b border-border p-4">
        <h2 className="text-heading text-text-primary">{title}</h2>
        {hybridSourceNote ? <p className="mt-1 text-caption text-text-secondary">{hybridSourceNote}</p> : null}
      </div>

      {isError && errorDetail && (
        <div className="px-4 py-10 text-center">
          <p className="text-body text-text-primary">{t('home_recommendations_error')}</p>
          <p className="mt-2 text-caption text-text-secondary">{errorDetail}</p>
          <Button type="button" variant="profileOutline" className="mt-4 min-w-[124px]" onClick={() => void query.refetch()}>
            {t('common_retry')}
          </Button>
        </div>
      )}

      {!isError && showInitialSkeleton && (
        <div className="grid grid-cols-2 gap-3 p-3 tablet:grid-cols-3 tablet:gap-4 desktop:grid-cols-4 wide:grid-cols-5">
          {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
            <ProductSkeleton key={`cart-rec-skeleton-${index}`} />
          ))}
        </div>
      )}

      {!isError && !showInitialSkeleton && products.length === 0 && (
        <div className="px-4 py-12 text-center text-body text-text-secondary">{t('home_recommendations_empty')}</div>
      )}

      {!isError && !showInitialSkeleton && products.length > 0 && (
        <div className="grid grid-cols-2 gap-3 p-3 tablet:grid-cols-3 tablet:gap-4 desktop:grid-cols-4 wide:grid-cols-5">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              to={`/products/${product.id}`}
              name={product.name}
              image={product.image}
              price={product.price}
              originalPrice={product.originalPrice}
              discountPercent={product.discountPercent}
              rating={product.rating}
              soldCount={product.soldCount}
              location={product.location}
              isFreeship={product.isFreeship}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default CartItemHybridProductFeed;
