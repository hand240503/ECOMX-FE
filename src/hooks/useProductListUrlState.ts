import { useCallback, useMemo } from 'react';
import { useLocation, useParams, useSearchParams } from 'react-router-dom';
import type { ClientProductFilters, ProductSortMode } from '../lib/categoryProductUtils';

export type ProductViewMode = 'grid' | 'list';

const DEFAULT_SORT: ProductSortMode = 'popular';

function parseIntOrNull(s: string | null): number | null {
  if (s == null || s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function parseBrandIds(s: string | null): number[] {
  if (!s?.trim()) return [];
  return s
    .split(',')
    .map((x) => Number(x.trim()))
    .filter((n) => Number.isFinite(n));
}

function parseTags(s: string | null): string[] {
  if (!s?.trim()) return [];
  return s
    .split(',')
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
}

function isSortValue(v: string | null): v is ProductSortMode {
  return (
    v === 'popular' ||
    v === 'newest' ||
    v === 'price_asc' ||
    v === 'price_desc' ||
    v === 'rating'
  );
}

export const CATEGORY_PRODUCTS_PAGE_SIZE = 20;

const PRODUCTS_CATEGORY_PATH_PREFIX = '/products/category/';

/**
 * Đọc `category` từ path `/products/category/:id` (chỉ khi pathname khớp) hoặc query `?category=`.
 * Theo `docs/home-category-product-list-flow.md`, query thường là **code**; số thuần vẫn hỗ trợ.
 * Path segment chỉ tin khi pathname đúng — tránh `useParams` trả id cũ sau khi chuyển sang `/products?category=…`.
 */
export function useProductListUrlState() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const params = useParams<{ categoryId?: string }>();

  const pathCategorySegment = useMemo(() => {
    if (!location.pathname.startsWith(PRODUCTS_CATEGORY_PATH_PREFIX)) return '';
    const id = params.categoryId?.trim() ?? '';
    return id;
  }, [location.pathname, params.categoryId]);

  const fromQuery = searchParams.get('category')?.trim() ?? '';
  const fromLocationSearch =
    new URLSearchParams(location.search).get('category')?.trim() ?? '';
  const categoryParam = (pathCategorySegment || fromQuery || fromLocationSearch).trim();
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const sortRaw = searchParams.get('sort');
  const sort: ProductSortMode = isSortValue(sortRaw) ? sortRaw : DEFAULT_SORT;
  const minPrice = parseIntOrNull(searchParams.get('minPrice'));
  const maxPrice = parseIntOrNull(searchParams.get('maxPrice'));
  const brandIds = parseBrandIds(searchParams.get('brands'));
  const minRatingRaw = parseIntOrNull(searchParams.get('minRating'));
  const minRating = minRatingRaw != null ? Math.min(5, Math.max(1, minRatingRaw)) : null;
  const inStock = searchParams.get('inStock') === '1';
  const freeship = searchParams.get('freeship') === '1';
  const tagCodes = parseTags(searchParams.get('tags'));
  const view: ProductViewMode = searchParams.get('view') === 'list' ? 'list' : 'grid';

  const apiPage = page - 1;

  const clientFilters: ClientProductFilters = useMemo(
    () => ({
      minPrice,
      maxPrice,
      brandIds,
      minRating,
      inStock,
      freeship,
      tagCodes,
    }),
    [minPrice, maxPrice, brandIds, minRating, inStock, freeship, tagCodes]
  );

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (minPrice != null) n++;
    if (maxPrice != null) n++;
    if (brandIds.length) n++;
    if (minRating != null) n++;
    if (inStock) n++;
    if (freeship) n++;
    if (tagCodes.length) n++;
    return n;
  }, [minPrice, maxPrice, brandIds, minRating, inStock, freeship, tagCodes]);

  const update = useCallback(
    (mutate: (next: URLSearchParams) => void, resetPage: boolean) => {
      const next = new URLSearchParams(searchParams);
      mutate(next);
      if (resetPage) next.delete('page');
      setSearchParams(next, { replace: false });
    },
    [searchParams, setSearchParams]
  );

  const setPage = useCallback(
    (nextPage: number) => {
      update((next) => {
        if (nextPage <= 1) next.delete('page');
        else next.set('page', String(nextPage));
      }, false);
    },
    [update]
  );

  const setSort = useCallback(
    (value: ProductSortMode) => {
      update((next) => {
        if (value === DEFAULT_SORT) next.delete('sort');
        else next.set('sort', value);
      }, true);
    },
    [update]
  );

  const setView = useCallback(
    (value: ProductViewMode) => {
      update((next) => {
        if (value === 'grid') next.delete('view');
        else next.set('view', 'list');
      }, false);
    },
    [update]
  );

  const setPriceRange = useCallback(
    (min: number | null, max: number | null) => {
      update((next) => {
        if (min == null) next.delete('minPrice');
        else next.set('minPrice', String(min));
        if (max == null) next.delete('maxPrice');
        else next.set('maxPrice', String(max));
      }, true);
    },
    [update]
  );

  const toggleBrand = useCallback(
    (id: number) => {
      update((next) => {
        const set = new Set(brandIds);
        if (set.has(id)) set.delete(id);
        else set.add(id);
        const arr = [...set].sort((a, b) => a - b);
        if (!arr.length) next.delete('brands');
        else next.set('brands', arr.join(','));
      }, true);
    },
    [update, brandIds]
  );

  const setMinRating = useCallback(
    (value: number | null) => {
      update((next) => {
        if (value == null) next.delete('minRating');
        else next.set('minRating', String(value));
      }, true);
    },
    [update]
  );

  const setInStock = useCallback(
    (value: boolean) => {
      update((next) => {
        if (!value) next.delete('inStock');
        else next.set('inStock', '1');
      }, true);
    },
    [update]
  );

  const setFreeship = useCallback(
    (value: boolean) => {
      update((next) => {
        if (!value) next.delete('freeship');
        else next.set('freeship', '1');
      }, true);
    },
    [update]
  );

  const toggleTag = useCallback(
    (code: string) => {
      const lower = code.toLowerCase();
      update((next) => {
        const set = new Set(tagCodes);
        if (set.has(lower)) set.delete(lower);
        else set.add(lower);
        const arr = [...set].sort();
        if (!arr.length) next.delete('tags');
        else next.set('tags', arr.join(','));
      }, true);
    },
    [update, tagCodes]
  );

  const clearAllFilters = useCallback(() => {
    update((next) => {
      next.delete('minPrice');
      next.delete('maxPrice');
      next.delete('brands');
      next.delete('minRating');
      next.delete('inStock');
      next.delete('freeship');
      next.delete('tags');
      next.delete('sort');
    }, true);
  }, [update]);

  return {
    categoryParam,
    page,
    apiPage,
    sort,
    view,
    clientFilters,
    activeFilterCount,
    setPage,
    setSort,
    setView,
    setPriceRange,
    toggleBrand,
    setMinRating,
    setInStock,
    setFreeship,
    toggleTag,
    clearAllFilters,
  };
}

export type ProductListUrlSnapshot = ReturnType<typeof useProductListUrlState>;
