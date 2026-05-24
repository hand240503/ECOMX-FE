import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { mapProductFullToCard } from '../../api/mappers/homeProductMapper';
import { productService } from '../../api/services/productService';
import ProductCard from '../../components/product/ProductCard';
import ProductSkeleton from '../../components/product/ProductSkeleton';
import { Button } from '../../components/ui/Button';
import {
  CATEGORY_PRODUCTS_PAGE_SIZE,
  useProductListUrlState,
} from '../../hooks/useProductListUrlState';
import { useI18n } from '../../i18n/I18nProvider';
import { sortBrandsByName, type SubcategoryBrandGroup } from '../../lib/categoryFilterBuckets';
import {
  applyClientFilters,
  enrichBrandOptionsWithCounts,
  sortProductsByMode,
  type ProductSortMode,
  uniqueBrandsFromProducts,
  uniqueTagsFromProducts,
} from '../../lib/categoryProductUtils';
import { cn } from '../../lib/cn';
import MainFooter from '../../layout/footer/MainFooter';
import MainHeader from '../../layout/header/MainHeader';
import CategoryBreadcrumb, { type BreadcrumbItem } from '../category/CategoryBreadcrumb';
import CategoryFilterPanel from '../category/CategoryFilterPanel';
import CategoryMobileFilterBar from '../category/CategoryMobileFilterBar';
import CategoryPagination from '../category/CategoryPagination';
import CategoryProductToolbar from '../category/CategoryProductToolbar';
import CategorySidebarHero from '../category/CategorySidebarHero';

export type HomePromoListVariant = 'hotSale' | 'featured';

const SKELETON_COUNT = 8;

/** Mã giả cho filter panel (không có danh mục con). */
const PROMO_LISTING_CATEGORY_CODE = '';

type HomePromoListPageProps = {
  variant: HomePromoListVariant;
};

/**
 * Hot sale / Nổi bật — `GET ...?all=true`, lọc · sắp xếp · phân trang client (UI giống `/products?category=…`).
 */
export default function HomePromoListPage({ variant }: HomePromoListPageProps) {
  const { t } = useI18n();
  const gridRef = useRef<HTMLDivElement>(null);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const isHotSale = variant === 'hotSale';
  const title = t(isHotSale ? 'home_hot_sale_title' : 'home_featured_title');

  const url = useProductListUrlState({ promoListing: true });
  const { page, sort, view, clientFilters, activeFilterCount, clearAllFilters, ...urlActions } = url;

  const productsQuery = useQuery({
    queryKey: ['products', isHotSale ? 'hot-sale' : 'is-featured', 'all'],
    queryFn: ({ signal }) =>
      isHotSale
        ? productService.getHotSale({ all: true, signal })
        : productService.getIsFeatured({ all: true, signal }),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const rawProducts = useMemo(() => productsQuery.data ?? [], [productsQuery.data]);

  const hasClientFilters = activeFilterCount > 0;

  const processedAll = useMemo(() => {
    const filtered = applyClientFilters(rawProducts, clientFilters);
    return sortProductsByMode(filtered, sort);
  }, [rawProducts, clientFilters, sort]);

  const totalListCount = rawProducts.length;
  const totalPages = Math.max(1, Math.ceil(processedAll.length / CATEGORY_PRODUCTS_PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) {
      urlActions.setPage(totalPages);
    }
  }, [page, totalPages, urlActions.setPage]);

  const pageStart = (page - 1) * CATEGORY_PRODUCTS_PAGE_SIZE;
  const processedProducts = processedAll.slice(pageStart, pageStart + CATEGORY_PRODUCTS_PAGE_SIZE);
  const rawOnPage = processedProducts.length;
  const from = processedAll.length === 0 ? 0 : pageStart + 1;
  const to = processedAll.length === 0 ? 0 : pageStart + rawOnPage;

  const productsForPriceBuckets = useMemo(
    () =>
      applyClientFilters(rawProducts, {
        ...clientFilters,
        minPrice: null,
        maxPrice: null,
      }),
    [rawProducts, clientFilters]
  );

  const tagOptions = useMemo(() => uniqueTagsFromProducts(rawProducts), [rawProducts]);

  const { brandGroups, flatBrandsNoSubs } = useMemo(() => {
    const flat = sortBrandsByName(
      uniqueBrandsFromProducts(rawProducts).map((b) => ({ id: b.id, name: b.name }))
    );
    return {
      brandGroups: [] as SubcategoryBrandGroup[],
      flatBrandsNoSubs: enrichBrandOptionsWithCounts(flat, rawProducts),
    };
  }, [rawProducts]);

  const breadcrumbItems: BreadcrumbItem[] = useMemo(
    () => [{ label: title, current: true }],
    [title]
  );

  const errorDetail = useMemo(() => {
    const err = productsQuery.error;
    if (!err) return null;
    if (axios.isAxiosError(err)) {
      const body = err.response?.data as { message?: string } | undefined;
      if (typeof body?.message === 'string' && body.message.trim() !== '') {
        return body.message.trim();
      }
    }
    return t('common_unexpected_error');
  }, [productsQuery.error, t]);

  useEffect(() => {
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [page]);

  const showInitialSkeleton = productsQuery.isPending && !productsQuery.data;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MainHeader />

      <div className="border-b border-border bg-surface py-3 shadow-header">
        <div className="mx-auto max-w-container px-4 tablet:px-6">
          {!productsQuery.isError && productsQuery.isSuccess && (
            <CategoryBreadcrumb items={breadcrumbItems} />
          )}
          {productsQuery.isError && errorDetail && (
            <p className="text-body text-danger">{t('home_promo_section_error')}</p>
          )}
        </div>
      </div>

      <main className="flex-1 py-4">
        <div className="mx-auto max-w-container px-4 tablet:px-6">
          {showInitialSkeleton && (
            <div className="space-y-4 py-6">
              <div className="h-28 animate-pulse rounded-md bg-border" />
              <div className="h-10 animate-pulse rounded-md bg-border" />
              <div
                className={cn(
                  'grid gap-3 tablet:gap-4',
                  view === 'list'
                    ? 'grid-cols-1'
                    : 'grid-cols-2 tablet:grid-cols-3 desktop:grid-cols-4'
                )}
              >
                {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                  <ProductSkeleton key={`promo-cat-loading-${i}`} variant={view} />
                ))}
              </div>
            </div>
          )}

          {productsQuery.isError && errorDetail && (
            <div className="py-16 text-center">
              <p className="text-body text-text-primary">{t('home_promo_section_error')}</p>
              <p className="mt-2 text-caption text-text-secondary">{errorDetail}</p>
              <Button
                type="button"
                variant="profileOutline"
                className="mt-6 min-w-[124px]"
                onClick={() => void productsQuery.refetch()}
              >
                {t('common_retry')}
              </Button>
            </div>
          )}

          {productsQuery.isSuccess && (
            <>
              <div className="mb-3 desktop:hidden">
                <CategorySidebarHero
                  name={title}
                  totalProducts={totalListCount}
                  subcategories={[]}
                  currentCode={PROMO_LISTING_CATEGORY_CODE}
                  layout="mobile"
                />
              </div>

              <CategoryMobileFilterBar
                activeFilterCount={activeFilterCount}
                sort={sort}
                onOpenSheet={() => setFilterSheetOpen(true)}
              />

              <div className="flex flex-col gap-4 desktop:flex-row desktop:gap-6">
                <aside className="hidden w-[240px] flex-shrink-0 self-start desktop:block">
                  <CategorySidebarHero
                    name={title}
                    totalProducts={totalListCount}
                    subcategories={[]}
                    currentCode={PROMO_LISTING_CATEGORY_CODE}
                    layout="sidebar"
                  />
                  <div className="mt-3">
                    <CategoryFilterPanel
                      brandGroups={brandGroups}
                      flatBrandsNoSubs={flatBrandsNoSubs}
                      currentCategoryCode={PROMO_LISTING_CATEGORY_CODE}
                      tagOptions={tagOptions}
                      url={url}
                      priceFacetProducts={productsForPriceBuckets}
                    />
                  </div>
                </aside>

                <div className="min-w-0 flex-1 overflow-hidden rounded-md border border-border bg-surface shadow-header">
                  <CategoryProductToolbar
                    from={from}
                    to={to}
                    total={totalListCount}
                    matchedOnPage={processedProducts.length}
                    rawOnPage={rawOnPage}
                    hasClientFilters={hasClientFilters}
                    sort={sort}
                    view={view}
                    onSortChange={(v) => {
                      if (v !== 'relevant') urlActions.setSort(v as ProductSortMode);
                    }}
                    onViewChange={urlActions.setView}
                    isFetching={productsQuery.isFetching}
                    isLoading={productsQuery.isPending}
                  />

                  <section
                    ref={gridRef}
                    className={cn(
                      'grid gap-3 px-3 pb-4 transition-opacity duration-200 tablet:gap-4 tablet:px-4',
                      view === 'list'
                        ? 'grid-cols-1'
                        : 'grid-cols-2 tablet:grid-cols-3 desktop:grid-cols-4',
                      productsQuery.isFetching &&
                        !productsQuery.isPending &&
                        !showInitialSkeleton &&
                        'opacity-60'
                    )}
                  >
                    {totalListCount === 0 && (
                      <div className="col-span-full py-16 text-center text-body text-text-secondary">
                        {t('home_promo_list_empty')}
                      </div>
                    )}

                    {totalListCount > 0 && processedAll.length === 0 && (
                      <div className="col-span-full py-16 text-center">
                        <p className="text-heading text-text-primary">
                          {t('category_products_filtered_empty')}
                        </p>
                        <p className="mt-2 text-body text-text-secondary">
                          {t('category_products_filtered_hint')}
                        </p>
                        <Button
                          type="button"
                          variant="profileOutline"
                          className="mt-4"
                          onClick={() => clearAllFilters()}
                        >
                          {t('category_filter_clear_all')}
                        </Button>
                      </div>
                    )}

                    {processedProducts.length > 0 &&
                      processedProducts.map((p) => {
                        const card = mapProductFullToCard(p);
                        return (
                          <ProductCard
                            key={p.id}
                            to={`/products/${p.id}`}
                            variant={view}
                            name={card.name}
                            brand={card.brand}
                            image={card.image}
                            price={card.price}
                            originalPrice={card.originalPrice}
                            discountPercent={card.discountPercent}
                            rating={card.rating}
                            soldCount={card.soldCount}
                            location={card.location}
                            isFreeship={card.isFreeship}
                            priceIsFrom={Boolean(card.priceIsFrom)}
                            showPcSaleBadge={Boolean(card.showPcSaleBadge)}
                            volumeTierHint={Boolean(card.volumeTierHint)}
                            pwpHint={Boolean(card.pwpHint)}
                          />
                        );
                      })}
                  </section>

                  <div className="border-t border-border px-3 tablet:px-4">
                    <CategoryPagination
                      page={page}
                      totalPages={totalPages}
                      onPageChange={urlActions.setPage}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <MainFooter />

      {filterSheetOpen && productsQuery.isSuccess && (
        <div className="fixed inset-0 z-modal flex items-end justify-stretch">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close"
            onClick={() => setFilterSheetOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="promo-filter-sheet-title"
            className="relative max-h-[min(92vh,100dvh)] w-full overflow-y-auto overscroll-contain rounded-t-lg border-t border-primary/10 bg-surface shadow-dropdown"
          >
            <div className="sticky top-0 z-10 border-b border-border bg-surface px-4 py-3">
              <h2 id="promo-filter-sheet-title" className="text-heading text-text-primary">
                {t('category_mobile_filter_sheet_title')}
              </h2>
            </div>
            <div className="px-4 py-2">
              <CategoryFilterPanel
                brandGroups={brandGroups}
                flatBrandsNoSubs={flatBrandsNoSubs}
                currentCategoryCode={PROMO_LISTING_CATEGORY_CODE}
                tagOptions={tagOptions}
                url={url}
                priceFacetProducts={productsForPriceBuckets}
              />
            </div>
            <div className="sticky bottom-0 z-10 flex gap-3 border-t border-border bg-surface p-4 shadow-[0_-6px_16px_-4px_rgba(0,0,0,0.06)]">
              <Button
                type="button"
                variant="profileOutline"
                className="flex-1"
                onClick={() => clearAllFilters()}
              >
                {t('category_filter_clear_all')}
              </Button>
              <Button
                type="button"
                variant="profilePrimary"
                className="flex-1"
                onClick={() => setFilterSheetOpen(false)}
              >
                {t('category_mobile_filter_results')} ({processedAll.length})
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
