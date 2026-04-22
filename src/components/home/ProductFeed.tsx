import axios from 'axios';
import { useMemo } from 'react';
import ProductCard from '../product/ProductCard';
import ProductSkeleton from '../product/ProductSkeleton';
import { useI18n } from '../../i18n/I18nProvider';
import { mapProductFullToCard } from '../../api/mappers/homeProductMapper';
import { useHomeRecommendations, useHomeRecommendationsSnapshot } from '../../hooks/useHomeRecommendations';
import { Button } from '../ui/Button';

const SKELETON_COUNT = 12;

type ProductFeedProps = {
  /** Tiêu đề khối (mặc định: deal trang chủ) */
  title?: string;
  /**
   * Giới hạn số sản phẩm (1 lần gọi API, không "Xem thêm").
   * Dùng trên trang giỏ trống: 10 sản phẩm + nút "Xem tất cả" (chưa nối route).
   */
  maxItems?: number;
};

const ProductFeed = ({ title, maxItems }: ProductFeedProps) => {
  const { t } = useI18n();
  const heading = title ?? t('home_deal_title');
  const limited = maxItems != null && maxItems > 0;
  const limit = limited ? maxItems : undefined;

  const infiniteQuery = useHomeRecommendations({ enabled: !limited });
  const snapshotQuery = useHomeRecommendationsSnapshot(limited && limit != null ? limit : 0);

  const {
    products,
    isPending,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = limited
    ? {
        products: snapshotQuery.data ?? [],
        isPending: snapshotQuery.isPending,
        isError: snapshotQuery.isError,
        error: snapshotQuery.error,
        refetch: snapshotQuery.refetch,
        fetchNextPage: async () => {
          /* no-op */
        },
        hasNextPage: false,
        isFetchingNextPage: false,
      }
    : infiniteQuery;

  const items = useMemo(
    () => (limited && limit != null ? products.slice(0, limit) : products).map(mapProductFullToCard),
    [limited, limit, products]
  );

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

  const skeletonCount = limited && maxItems != null ? Math.min(maxItems, 12) : SKELETON_COUNT;

  return (
    <section className="mt-4 rounded-md border border-border bg-surface shadow-header">
      <div
        className={`border-b border-border p-4 ${limited ? 'flex flex-col gap-3 tablet:flex-row tablet:items-center tablet:justify-between' : ''}`}
      >
        <h2 className="text-heading text-text-primary">{heading}</h2>
        {limited ? (
          <Button
            type="button"
            variant="profileOutline"
            size="sm"
            className="shrink-0 self-start tablet:self-auto"
            onClick={() => {
              /* TODO: tích hợp màn hình / route xem toàn bộ gợi ý */
            }}
          >
            {t('cart_recommendations_view_all')}
          </Button>
        ) : null}
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
          {Array.from({ length: skeletonCount }).map((_, index) => (
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

      {!isError && !showInitialSkeleton && !limited && hasNextPage && (
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
