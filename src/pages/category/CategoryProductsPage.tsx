import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { mapProductFullToCard } from '../../api/mappers/homeProductMapper';
import { categoryService } from '../../api/services/categoryService';
import ProductCard from '../../components/product/ProductCard';
import ProductSkeleton from '../../components/product/ProductSkeleton';
import { Button } from '../../components/ui/Button';
import { useCategoryCatalog } from '../../hooks/useCategoryCatalog';
import { useCategoryChildren } from '../../hooks/useCategoryChildren';
import {
  CATEGORY_PRODUCTS_PAGE_SIZE,
  useProductListUrlState,
} from '../../hooks/useProductListUrlState';
import { useProductsByCategory } from '../../hooks/useProductsByCategory';
import { useI18n } from '../../i18n/I18nProvider';
import {
  findCategoryById,
  parseNumericCategoryIdFromParam,
  resolveCategoryByParam,
} from '../../lib/categoryCatalog';
import {
  buildBrandGroupsBySubcategory,
  sortBrandsByName,
  sortCategoriesByName,
  type SubcategoryBrandGroup,
} from '../../lib/categoryFilterBuckets';
import {
  applyClientFilters,
  sortProductsByMode,
  type ProductSortMode,
  uniqueBrandsFromProducts,
  uniqueTagsFromProducts,
} from '../../lib/categoryProductUtils';
import { cn } from '../../lib/cn';
import MainFooter from '../../layout/footer/MainFooter';
import MainHeader from '../../layout/header/MainHeader';
import CategoryBreadcrumb, { type BreadcrumbItem } from './CategoryBreadcrumb';
import CategoryFilterPanel from './CategoryFilterPanel';
import CategoryMobileFilterBar from './CategoryMobileFilterBar';
import CategorySidebarHero from './CategorySidebarHero';
import CategoryPagination from './CategoryPagination';
import CategoryProductToolbar from './CategoryProductToolbar';

const SKELETON_COUNT = 8;

const CategoryProductsPage = () => {
  const { t } = useI18n();
  const gridRef = useRef<HTMLDivElement>(null);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const url = useProductListUrlState();
  const { categoryParam, page, apiPage, sort, view, clientFilters, activeFilterCount, ...urlActions } =
    url;

  const { data: flat, isPending: catalogPending, isError: catalogError, refetch: refetchCatalog } =
    useCategoryCatalog();

  const resolved = useMemo(
    () => (flat && categoryParam ? resolveCategoryByParam(flat, categoryParam) : undefined),
    [flat, categoryParam]
  );

  const numericCategoryId = useMemo(
    () => parseNumericCategoryIdFromParam(categoryParam),
    [categoryParam]
  );

  const activeCategoryId = useMemo(() => {
    if (numericCategoryId != null) return numericCategoryId;
    return resolved?.id;
  }, [numericCategoryId, resolved?.id]);

  const categoryDetailQuery = useQuery({
    queryKey: ['categories', 'detail', numericCategoryId],
    queryFn: () => categoryService.getById(numericCategoryId!),
    enabled:
      typeof numericCategoryId === 'number' &&
      numericCategoryId > 0 &&
      resolved === undefined,
  });

  const displayCategory = resolved ?? categoryDetailQuery.data ?? undefined;

  const awaitingCatalogForCode = Boolean(
    catalogPending && numericCategoryId == null && categoryParam !== ''
  );

  const awaitingMeta = Boolean(
    (categoryDetailQuery.isPending || categoryDetailQuery.isFetching) &&
      !displayCategory &&
      numericCategoryId != null
  );

  const showCategoryNotFound = Boolean(
    !catalogError &&
      !awaitingCatalogForCode &&
      !awaitingMeta &&
      categoryParam !== '' &&
      !displayCategory
  );

  const showMainSkeleton = Boolean(
    !catalogError &&
      ((catalogPending && numericCategoryId == null) || (awaitingMeta && !displayCategory))
  );

  const parent = useMemo(
    () => (flat && displayCategory ? findCategoryById(flat, displayCategory.parentId) : undefined),
    [flat, displayCategory]
  );

  const { data: subcategories = [] } = useCategoryChildren(activeCategoryId);

  const productsQuery = useProductsByCategory(activeCategoryId, apiPage);

  const rawProducts = useMemo(
    () => productsQuery.data?.products ?? [],
    [productsQuery.data?.products]
  );
  const meta = productsQuery.data?.metadata;
  const totalElements = meta?.totalElements ?? 0;
  const totalPages = Math.max(1, meta?.totalPages ?? 1);

  const hasClientFilters = activeFilterCount > 0;

  const processedProducts = useMemo(() => {
    const filtered = applyClientFilters(rawProducts, clientFilters);
    return sortProductsByMode(filtered, sort);
  }, [rawProducts, clientFilters, sort]);

  const tagOptions = useMemo(() => uniqueTagsFromProducts(rawProducts), [rawProducts]);

  const subcategoriesSorted = useMemo(
    () => sortCategoriesByName(subcategories),
    [subcategories]
  );

  const { brandGroups, flatBrandsNoSubs } = useMemo(() => {
    if (!subcategoriesSorted.length) {
      const flat = sortBrandsByName(
        uniqueBrandsFromProducts(rawProducts).map((b) => ({ id: b.id, name: b.name }))
      );
      return { brandGroups: [] as SubcategoryBrandGroup[], flatBrandsNoSubs: flat };
    }
    const { groups, otherBrands } = buildBrandGroupsBySubcategory(
      rawProducts,
      subcategoriesSorted
    );
    return { brandGroups: groups, flatBrandsNoSubs: otherBrands };
  }, [rawProducts, subcategoriesSorted]);

  const breadcrumbItems: BreadcrumbItem[] = useMemo(() => {
    if (!displayCategory) return [];
    const items: BreadcrumbItem[] = [];
    if (parent) {
      items.push({
        label: parent.name,
        href: `/products?category=${encodeURIComponent(parent.code)}`,
      });
    }
    items.push({ label: displayCategory.name, current: true });
    return items;
  }, [parent, displayCategory]);

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

  const rawOnPage = rawProducts.length;
  const from =
    rawOnPage === 0 ? 0 : (page - 1) * CATEGORY_PRODUCTS_PAGE_SIZE + 1;
  const to = rawOnPage === 0 ? 0 : (page - 1) * CATEGORY_PRODUCTS_PAGE_SIZE + rawOnPage;

  const showInitialSkeleton = productsQuery.isPending && !productsQuery.data;

  if (!categoryParam) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <MainHeader />
        <main className="flex-1 py-6">
          <div className="mx-auto max-w-container px-4 tablet:px-6">
            <p className="text-body text-text-primary">{t('category_missing_param')}</p>
            <Link
              to="/"
              className="mt-4 inline-flex text-body font-medium text-primary transition-colors hover:text-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              ← {t('category_breadcrumb_home')}
            </Link>
          </div>
        </main>
        <MainFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MainHeader />

      <div className="border-b border-border bg-surface py-3 shadow-header">
        <div className="mx-auto max-w-container px-4 tablet:px-6">
          {!catalogError && !showCategoryNotFound && !displayCategory && (catalogPending || awaitingMeta) && (
            <div className="h-4 w-2/3 animate-pulse rounded bg-border" />
          )}
          {!catalogPending && catalogError && (
            <p className="text-body text-danger">{t('category_catalog_error')}</p>
          )}
          {showCategoryNotFound && (
            <p className="text-body text-text-primary">{t('category_not_found')}</p>
          )}
          {displayCategory && <CategoryBreadcrumb items={breadcrumbItems} />}
        </div>
      </div>

      <main className="flex-1 py-4">
        <div className="mx-auto max-w-container px-4 tablet:px-6">
          {showMainSkeleton && (
            <div className="space-y-4 py-6">
              <div className="h-28 animate-pulse rounded-md bg-border" />
              <div className="h-10 animate-pulse rounded-md bg-border" />
              <div className="grid grid-cols-2 gap-3 tablet:grid-cols-3 desktop:grid-cols-4">
                {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                  <ProductSkeleton key={`cat-loading-${i}`} />
                ))}
              </div>
            </div>
          )}

          {!catalogPending && catalogError && (
            <div className="py-10 text-center">
              <Button
                type="button"
                variant="profileOutline"
                className="mt-4"
                onClick={() => void refetchCatalog()}
              >
                {t('common_retry')}
              </Button>
            </div>
          )}

          {showCategoryNotFound && (
            <div className="py-10 text-center">
              <Link
                to="/"
                className="text-body font-medium text-primary hover:text-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                ← {t('category_breadcrumb_home')}
              </Link>
            </div>
          )}

          {displayCategory && (
            <>
              <div className="mb-3 desktop:hidden">
                <CategorySidebarHero
                  name={displayCategory.name}
                  totalProducts={totalElements}
                  subcategories={subcategoriesSorted}
                  currentCode={displayCategory.code}
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
                    name={displayCategory.name}
                    totalProducts={totalElements}
                    subcategories={subcategoriesSorted}
                    currentCode={displayCategory.code}
                    layout="sidebar"
                  />
                  <div className="mt-3">
                    <CategoryFilterPanel
                      brandGroups={brandGroups}
                      flatBrandsNoSubs={flatBrandsNoSubs}
                      currentCategoryCode={displayCategory.code}
                      tagOptions={tagOptions}
                      url={url}
                    />
                  </div>
                </aside>

                <div className="min-w-0 flex-1 overflow-hidden rounded-md border border-border bg-surface shadow-header">
                  <CategoryProductToolbar
                    from={from}
                    to={to}
                    total={totalElements}
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
                    {productsQuery.isError && errorDetail && (
                      <div className="col-span-full py-16 text-center">
                        <p className="text-body text-text-primary">{t('category_products_error')}</p>
                        <p className="mt-2 text-caption text-text-secondary">{errorDetail}</p>
                        <Button
                          type="button"
                          variant="profileOutline"
                          className="mt-4"
                          onClick={() => void productsQuery.refetch()}
                        >
                          {t('common_retry')}
                        </Button>
                      </div>
                    )}

                    {!productsQuery.isError && showInitialSkeleton && (
                      <>
                        {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
                          <ProductSkeleton key={`sk-${index}`} />
                        ))}
                      </>
                    )}

                    {!productsQuery.isError &&
                      !showInitialSkeleton &&
                      rawOnPage === 0 && (
                        <div className="col-span-full py-16 text-center text-body text-text-secondary">
                          {t('category_products_empty')}
                        </div>
                      )}

                    {!productsQuery.isError &&
                      !showInitialSkeleton &&
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
                            onClick={() => urlActions.clearAllFilters()}
                          >
                            {t('category_filter_clear_all')}
                          </Button>
                        </div>
                      )}

                    {!productsQuery.isError &&
                      !showInitialSkeleton &&
                      processedProducts.length > 0 &&
                      processedProducts.map((p) => {
                        const card = mapProductFullToCard(p);
                        return (
                          <ProductCard
                            key={p.id}
                            to={`/products/${p.id}`}
                            variant={view}
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
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <MainFooter />

      {filterSheetOpen && displayCategory && (
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
            aria-labelledby="category-filter-sheet-title"
            className="relative flex max-h-[85vh] w-full flex-col rounded-t-lg border-t border-primary/10 bg-surface shadow-dropdown"
          >
            <div className="border-b border-border px-4 py-3">
              <h2 id="category-filter-sheet-title" className="text-heading text-text-primary">
                {t('category_mobile_filter_sheet_title')}
              </h2>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2">
              <CategoryFilterPanel
                brandGroups={brandGroups}
                flatBrandsNoSubs={flatBrandsNoSubs}
                currentCategoryCode={displayCategory.code}
                tagOptions={tagOptions}
                url={url}
              />
            </div>
            <div className="flex gap-3 border-t border-border p-4">
              <Button
                type="button"
                variant="profileOutline"
                className="flex-1"
                onClick={() => urlActions.clearAllFilters()}
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

export default CategoryProductsPage;
