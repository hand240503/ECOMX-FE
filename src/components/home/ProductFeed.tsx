import axios from 'axios';
import { useMemo } from 'react';
import ProductCard from '../product/ProductCard';
import ProductSkeleton from '../product/ProductSkeleton';
import { useI18n } from '../../i18n/I18nProvider';
import { mapProductFullToCard } from '../../api/mappers/homeProductMapper';
import { useHomeRecommendations } from '../../hooks/useHomeRecommendations';
import { Button } from '../ui/Button';

const SKELETON_COUNT = 12;

const ProductFeed = () => {
  const { t } = useI18n();
  const {
    products,
    isPending,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useHomeRecommendations();

  const items = useMemo(() => products.map(mapProductFullToCard), [products]);

  const showInitialSkeleton = isPending;

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

  return (
    <section className="mt-4 rounded-md border border-border bg-surface shadow-header">
      <div className="border-b border-border p-4">
        <h2 className="text-heading text-text-primary">{t('home_deal_title')}</h2>
      </div>

      {isError && errorDetail && (
        <div className="px-4 py-10 text-center">
          <p className="text-body text-text-primary">{t('home_recommendations_error')}</p>
          <p className="mt-2 text-caption text-text-secondary">{errorDetail}</p>
          <Button type="button" variant="profileOutline" className="mt-4 min-w-[124px]" onClick={() => void refetch()}>
            {t('common_retry')}
          </Button>
        </div>
      )}

      {!isError && showInitialSkeleton && (
        <div className="grid grid-cols-2 gap-3 p-3 tablet:grid-cols-3 tablet:gap-4 desktop:grid-cols-4 wide:grid-cols-5">
          {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
            <ProductSkeleton key={`product-skeleton-${index}`} />
          ))}
        </div>
      )}

      {!isError && !showInitialSkeleton && items.length === 0 && (
        <div className="px-4 py-12 text-center text-body text-text-secondary">{t('home_recommendations_empty')}</div>
      )}

      {!isError && !showInitialSkeleton && items.length > 0 && (
        <div className="grid grid-cols-2 gap-3 p-3 tablet:grid-cols-3 tablet:gap-4 desktop:grid-cols-4 wide:grid-cols-5">
          {items.map((product) => (
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

      {!isError && !showInitialSkeleton && hasNextPage && (
        <div className="flex justify-center py-6">
          <Button
            type="button"
            variant="profileOutline"
            className="min-w-[200px]"
            loading={isFetchingNextPage}
            disabled={isFetchingNextPage}
            onClick={() => void fetchNextPage()}
          >
            {t('home_view_more')}
          </Button>
        </div>
      )}
    </section>
  );
};

export default ProductFeed;
