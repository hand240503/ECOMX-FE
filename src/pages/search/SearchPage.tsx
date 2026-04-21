import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { Flame, LayoutGrid, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { mapProductFullToCard } from '../../api/mappers/homeProductMapper';
import { categoryService } from '../../api/services/categoryService';
import { productService } from '../../api/services/productService';
import { recommendationService } from '../../api/services/recommendationService';
import { searchService } from '../../api/services/searchService';
import ProductCard from '../../components/product/ProductCard';
import ProductSkeleton from '../../components/product/ProductSkeleton';
import { Button } from '../../components/ui/Button';
import { ANONYMOUS_USER_ID } from '../../constants/recommendation';
import { useRouteLoadingNavigation } from '../../app/loading/useRouteLoadingNavigation';
import { useAuth } from '../../app/auth/AuthProvider';
import { SEARCH_PAGE_SIZE, useSearchUrlState } from '../../hooks/useSearchUrlState';
import { useI18n } from '../../i18n/I18nProvider';
import {
  applyClientFilters,
  sortProductsByMode,
  uniqueBrandsFromProducts,
} from '../../lib/categoryProductUtils';
import { cn } from '../../lib/cn';
import {
  clearSearchHistory,
  pushSearchHistory,
  readSearchHistory,
} from '../../lib/searchHistory';
import { getOrCreateSessionId } from '../../lib/sessionId';
import MainFooter from '../../layout/footer/MainFooter';
import MainHeader from '../../layout/header/MainHeader';
import CategoryMobileFilterBar from '../category/CategoryMobileFilterBar';
import CategoryPagination from '../category/CategoryPagination';
import CategoryProductToolbar from '../category/CategoryProductToolbar';
import SearchFilterPanel from './SearchFilterPanel';

const SKELETON_COUNT = 8;

const SearchPage = () => {
  const { t } = useI18n();
  const { user } = useAuth();
  const { navigateWithLoading } = useRouteLoadingNavigation();
  const gridRef = useRef<HTMLDivElement>(null);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [recentTick, setRecentTick] = useState(0);

  const url = useSearchUrlState();
  const {
    q,
    page,
    apiPage,
    sort,
    view,
    clientFilters,
    searchCategoryId,
    activeFilterCount,
    clearAllFilters,
    ...urlActions
  } = url;

  const userId = user?.id ?? ANONYMOUS_USER_ID;
  const sessionId = useMemo(() => getOrCreateSessionId(), []);

  const recentSearches = useMemo(() => readSearchHistory(), [recentTick]);

  const searchProductsQuery = useQuery({
    queryKey: ['products', 'search', q, apiPage, SEARCH_PAGE_SIZE],
    queryFn: ({ signal }) =>
      productService.search({ q, page: apiPage, limit: SEARCH_PAGE_SIZE, signal }),
    enabled: q.length > 0,
  });

  const trendingQuery = useQuery({
    queryKey: ['search', 'trending'],
    queryFn: ({ signal }) => searchService.getTrending(signal),
    enabled: q.length === 0,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const featuredCategoriesQuery = useQuery({
    queryKey: ['categories', 'featured-suggested', 6],
    queryFn: ({ signal }) => categoryService.getFeaturedSuggested(6, signal),
    enabled: q.length === 0,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const rawProducts = useMemo(
    () => searchProductsQuery.data?.products ?? [],
    [searchProductsQuery.data?.products]
  );
  const meta = searchProductsQuery.data?.metadata;
  const totalElements = meta?.totalElements ?? 0;
  const totalPages = Math.max(1, meta?.totalPages ?? 1);
  const spellSuggestion = searchProductsQuery.data?.spellSuggestion ?? null;

  const apiEmpty =
    q.length > 0 &&
    searchProductsQuery.isSuccess &&
    !searchProductsQuery.isFetching &&
    totalElements === 0;

  const relatedQuery = useQuery({
    queryKey: ['recommendations', 'search-empty', userId, sessionId],
    queryFn: ({ signal }) =>
      recommendationService.getHome({
        userId,
        sessionId,
        offset: 0,
        limit: 10,
        signal,
      }),
    enabled: apiEmpty,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const categoryFacets = useMemo(() => {
    const map = new Map<number, { id: number; name: string; count: number }>();
    for (const p of rawProducts) {
      const c = p.category;
      if (!c) continue;
      const prev = map.get(c.id);
      if (prev) prev.count += 1;
      else map.set(c.id, { id: c.id, name: c.name, count: 1 });
    }
    return [...map.values()];
  }, [rawProducts]);

  const flatBrands = useMemo(
    () => sortBrandsByNameClient(uniqueBrandsFromProducts(rawProducts)),
    [rawProducts]
  );

  const byCategory = useMemo(() => {
    if (searchCategoryId == null) return rawProducts;
    return rawProducts.filter((p) => p.category?.id === searchCategoryId);
  }, [rawProducts, searchCategoryId]);

  const processedProducts = useMemo(() => {
    const filtered = applyClientFilters(byCategory, clientFilters);
    return sortProductsByMode(filtered, sort);
  }, [byCategory, clientFilters, sort]);

  const hasClientFilters = activeFilterCount > 0;
  const showInitialSkeleton =
    q.length > 0 && searchProductsQuery.isPending && !searchProductsQuery.data;
  const showSummarySkeleton = q.length > 0 && searchProductsQuery.isPending && !searchProductsQuery.data;

  const rawOnPage = rawProducts.length;
  const from =
    rawOnPage === 0 ? 0 : (page - 1) * SEARCH_PAGE_SIZE + 1;
  const to = rawOnPage === 0 ? 0 : (page - 1) * SEARCH_PAGE_SIZE + rawOnPage;

  const errorDetail = useMemo(() => {
    const err = searchProductsQuery.error;
    if (!err) return null;
    if (axios.isAxiosError(err)) {
      const body = err.response?.data as { message?: string } | undefined;
      if (typeof body?.message === 'string' && body.message.trim() !== '') {
        return body.message.trim();
      }
    }
    return t('common_unexpected_error');
  }, [searchProductsQuery.error, t]);

  const navigateToSearch = (keyword: string, recordHistory: boolean) => {
    const trimmed = keyword.trim();
    if (recordHistory && trimmed) pushSearchHistory(trimmed);
    navigateWithLoading({
      pathname: '/search',
      search: trimmed ? `?q=${encodeURIComponent(trimmed)}` : '',
    });
  };

  useEffect(() => {
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [page]);

  const showFilterSidebar =
    q.length > 0 &&
    !searchProductsQuery.isError &&
    !(searchProductsQuery.isSuccess && totalElements === 0);
  const showMobileFilterBar = showFilterSidebar;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MainHeader cartCount={5} />

      {q.length > 0 && (
        <div className="border-b border-border bg-surface py-3">
          <div className="mx-auto max-w-container px-4 tablet:px-6">
            {showSummarySkeleton ? (
              <div className="h-10 w-full max-w-xl animate-pulse rounded-md bg-border" />
            ) : (
              <div className="flex flex-col gap-2 desktop:flex-row desktop:items-start desktop:justify-between">
                <div>
                  <p className="text-body text-text-primary">
                    {t('search_summary_title_prefix')}{' '}
                    <span className="font-semibold text-primary">&quot;{q}&quot;</span>
                  </p>
                  <p className="mt-1 text-caption text-text-secondary">
                    {t('search_summary_count').replace(
                      '{count}',
                      totalElements.toLocaleString('vi-VN')
                    )}
                  </p>
                </div>
                {spellSuggestion && (
                  <p className="text-caption text-text-secondary desktop:max-w-md desktop:text-right">
                    {t('search_spell_prefix')}{' '}
                    <button
                      type="button"
                      onClick={() => navigateToSearch(spellSuggestion, true)}
                      className="font-medium text-primary hover:text-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    >
                      &quot;{spellSuggestion}&quot;
                    </button>
                    ?
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <main className="flex-1 py-4">
        <div className="mx-auto max-w-container px-4 tablet:px-6">
          {q.length === 0 && (
            <div className="space-y-10 pb-10">
              {recentSearches.length > 0 && (
                <section>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h2 className="text-heading text-text-primary">{t('search_recent_title')}</h2>
                    <button
                      type="button"
                      onClick={() => {
                        clearSearchHistory();
                        setRecentTick((x) => x + 1);
                      }}
                      className="text-caption font-medium text-primary hover:text-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    >
                      {t('search_recent_clear')}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((kw) => (
                      <button
                        key={kw}
                        type="button"
                        onClick={() => navigateToSearch(kw, true)}
                        className="rounded-full border border-border bg-surface px-3 py-1.5 text-caption font-medium text-text-primary transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                      >
                        {kw}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              <section>
                <div className="mb-3 flex items-center gap-2">
                  <Flame className="h-5 w-5 text-danger" aria-hidden />
                  <h2 className="text-heading text-text-primary">{t('search_trending_title')}</h2>
                </div>
                {trendingQuery.isPending ? (
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-8 w-24 animate-pulse rounded-full bg-border"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {trendingQuery.data?.map((item) => (
                      <button
                        key={item.keyword}
                        type="button"
                        onClick={() => navigateToSearch(item.keyword, true)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-caption font-medium text-text-primary transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                      >
                        {item.keyword}
                        {item.hot && (
                          <span className="rounded-sm bg-danger px-1 py-0.5 text-[10px] font-bold uppercase text-white">
                            {t('search_trending_hot')}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </section>

              <section>
                <h2 className="mb-4 text-heading text-text-primary">
                  {t('search_suggested_categories')}
                </h2>
                <div className="grid grid-cols-3 gap-3 desktop:grid-cols-6">
                  {featuredCategoriesQuery.isPending
                    ? Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-24 animate-pulse rounded-md bg-border" />
                      ))
                    : featuredCategoriesQuery.data?.map((cat) => (
                        <Link
                          key={cat.id}
                          to={`/products?category=${encodeURIComponent(cat.code)}`}
                          className="flex flex-col items-center gap-2 rounded-md border border-border bg-surface p-4 text-center shadow-header transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-elevation-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                        >
                          <LayoutGrid
                            className="h-8 w-8 text-primary"
                            aria-hidden
                          />
                          <span className="line-clamp-2 text-caption font-medium text-text-primary">
                            {cat.name}
                          </span>
                        </Link>
                      ))}
                </div>
              </section>
            </div>
          )}

          {q.length > 0 && apiEmpty && (
            <div className="space-y-10">
              <div className="flex flex-col items-center py-12 text-center">
                <Search className="mb-4 h-14 w-14 text-text-disabled" aria-hidden />
                <h2 className="text-heading text-text-primary">
                  {t('search_empty_title').replace('{q}', q)}
                </h2>
                <p className="mt-2 max-w-md text-body text-text-secondary">
                  {t('search_empty_hint')}
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  {activeFilterCount > 0 && (
                    <Button
                      type="button"
                      variant="profileOutline"
                      onClick={() => clearAllFilters()}
                    >
                      {t('search_empty_clear_filters')}
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="profilePrimary"
                    onClick={() => navigateWithLoading('/')}
                  >
                    {t('search_empty_home')}
                  </Button>
                </div>
              </div>

              <section>
                <h3 className="mb-4 text-title font-semibold text-text-primary">
                  {t('search_related_title')}
                </h3>
                <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide tablet:-mx-6 tablet:px-6">
                  {relatedQuery.isPending &&
                    Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="w-40 flex-shrink-0">
                        <ProductSkeleton />
                      </div>
                    ))}
                  {!relatedQuery.isPending &&
                    relatedQuery.data?.map((p) => {
                      const card = mapProductFullToCard(p);
                      return (
                        <div key={p.id} className="w-40 flex-shrink-0">
                          <ProductCard
                            to={`/products/${p.id}`}
                            name={card.name}
                            image={card.image}
                            price={card.price}
                            originalPrice={card.originalPrice}
                            discountPercent={card.discountPercent}
                            rating={card.rating}
                            soldCount={card.soldCount}
                            location={card.location}
                            isFreeship={card.isFreeship}
                          />
                        </div>
                      );
                    })}
                </div>
              </section>
            </div>
          )}

          {q.length > 0 && searchProductsQuery.isError && errorDetail && (
            <div className="rounded-md border border-border bg-surface px-4 py-16 text-center shadow-header">
              <p className="text-body text-text-primary">{t('category_products_error')}</p>
              <p className="mt-2 text-caption text-text-secondary">{errorDetail}</p>
              <Button
                type="button"
                variant="profileOutline"
                className="mt-4"
                onClick={() => void searchProductsQuery.refetch()}
              >
                {t('common_retry')}
              </Button>
            </div>
          )}

          {q.length > 0 && !apiEmpty && !searchProductsQuery.isError && (
            <>
              {showMobileFilterBar && (
                <div className="mb-4 desktop:hidden">
                  <CategoryMobileFilterBar
                    activeFilterCount={activeFilterCount}
                    sort={sort}
                    searchMode
                    onOpenSheet={() => setFilterSheetOpen(true)}
                  />
                </div>
              )}

              <div className="flex flex-col gap-4 desktop:flex-row desktop:gap-6">
                {showFilterSidebar && (
                  <aside className="hidden w-[240px] flex-shrink-0 self-start border-r border-border bg-surface pr-4 desktop:block">
                    {showInitialSkeleton ? (
                      <div className="space-y-3">
                        <div className="h-40 animate-pulse rounded-md bg-border" />
                        <div className="h-32 animate-pulse rounded-md bg-border" />
                      </div>
                    ) : (
                      <SearchFilterPanel
                        url={url}
                        categoryFacets={categoryFacets}
                        flatBrands={flatBrands}
                      />
                    )}
                  </aside>
                )}

                <div className="min-w-0 flex-1 overflow-hidden rounded-md border border-border bg-surface shadow-header">
                  <>
                      <CategoryProductToolbar
                        from={from}
                        to={to}
                        total={totalElements}
                        matchedOnPage={processedProducts.length}
                        rawOnPage={rawOnPage}
                        hasClientFilters={hasClientFilters}
                        sort={sort}
                        view={view}
                        searchMode
                        onSortChange={urlActions.setSort}
                        onViewChange={urlActions.setView}
                        isFetching={searchProductsQuery.isFetching}
                        isLoading={searchProductsQuery.isPending}
                      />

                      <section
                        ref={gridRef}
                        className={cn(
                          'grid gap-3 px-3 pb-4 transition-opacity duration-200 tablet:gap-4 tablet:px-4',
                          view === 'list'
                            ? 'grid-cols-1'
                            : 'grid-cols-2 tablet:grid-cols-3 desktop:grid-cols-4',
                          searchProductsQuery.isFetching &&
                            !searchProductsQuery.isPending &&
                            !showInitialSkeleton &&
                            'opacity-60'
                        )}
                      >
                        {showInitialSkeleton && (
                          <>
                            {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
                              <ProductSkeleton key={`sk-${index}`} />
                            ))}
                          </>
                        )}

                        {!showInitialSkeleton &&
                          rawOnPage > 0 &&
                          processedProducts.length === 0 && (
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

                        {!showInitialSkeleton &&
                          processedProducts.length > 0 &&
                          processedProducts.map((p) => {
                            const card = mapProductFullToCard(p);
                            return (
                              <ProductCard
                                key={p.id}
                                to={`/products/${p.id}`}
                                variant={view}
                                highlightKeyword={q}
                                name={card.name}
                                image={card.image}
                                price={card.price}
                                originalPrice={card.originalPrice}
                                discountPercent={card.discountPercent}
                                rating={card.rating}
                                soldCount={card.soldCount}
                                location={card.location}
                                isFreeship={card.isFreeship}
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
                  </>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {q.length > 0 && <MainFooter />}

      {filterSheetOpen && showFilterSidebar && (
        <div className="fixed inset-0 z-modal flex items-end justify-stretch desktop:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close"
            onClick={() => setFilterSheetOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="search-filter-sheet-title"
            className="relative flex max-h-[85vh] w-full flex-col rounded-t-lg border-t border-primary/10 bg-surface shadow-dropdown"
          >
            <div className="border-b border-border px-4 py-3">
              <h2 id="search-filter-sheet-title" className="text-heading text-text-primary">
                {t('category_mobile_filter_sheet_title')}
              </h2>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2">
              <SearchFilterPanel
                url={url}
                categoryFacets={categoryFacets}
                flatBrands={flatBrands}
              />
            </div>
            <div className="flex gap-3 border-t border-border p-4">
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
                {t('category_mobile_filter_results')} ({processedProducts.length})
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function sortBrandsByNameClient(brands: { id: number; name: string }[]) {
  return [...brands].sort((a, b) => a.name.localeCompare(b.name, 'vi'));
}

export default SearchPage;
