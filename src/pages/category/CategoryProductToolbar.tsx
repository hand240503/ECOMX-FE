import { LayoutGrid, List, Loader2 } from 'lucide-react';
import type { ProductSortMode, SearchSortMode } from '../../lib/categoryProductUtils';
import type { ProductViewMode } from '../../hooks/useProductListUrlState';
import { useI18n } from '../../i18n/I18nProvider';
import { cn } from '../../lib/cn';

interface CategoryProductToolbarProps {
  from: number;
  to: number;
  total: number;
  matchedOnPage: number;
  rawOnPage: number;
  hasClientFilters: boolean;
  sort: ProductSortMode | SearchSortMode;
  view: ProductViewMode;
  onSortChange: (value: ProductSortMode | SearchSortMode) => void;
  onViewChange: (value: ProductViewMode) => void;
  isFetching: boolean;
  isLoading: boolean;
  /** Trang tìm kiếm: thêm “Liên quan nhất”. */
  searchMode?: boolean;
}

const CategoryProductToolbar = ({
  from,
  to,
  total,
  matchedOnPage,
  rawOnPage,
  hasClientFilters,
  sort,
  view,
  onSortChange,
  onViewChange,
  isFetching,
  isLoading,
  searchMode = false,
}: CategoryProductToolbarProps) => {
  const { t } = useI18n();

  const summary = hasClientFilters
    ? t('category_toolbar_filtered')
        .replace('{matched}', String(matchedOnPage))
        .replace('{total}', total.toLocaleString('vi-VN'))
    : t('category_toolbar_summary')
        .replace('{from}', rawOnPage === 0 ? '0' : String(from))
        .replace('{to}', rawOnPage === 0 ? '0' : String(to))
        .replace('{total}', total.toLocaleString('vi-VN'));

  return (
    <div className="relative flex min-h-[44px] flex-col gap-3 border-b border-border bg-background/80 px-3 py-3 tablet:flex-row tablet:items-center tablet:justify-between tablet:px-4">
      {isFetching && !isLoading && (
        <div
          className="absolute right-2 top-2 flex items-center gap-1 text-caption text-primary"
          aria-live="polite"
        >
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        </div>
      )}

      <p className="max-w-xl text-caption text-text-secondary">{summary}</p>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-caption text-text-secondary">
          <span className="whitespace-nowrap">{t('category_sort_label')}</span>
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as ProductSortMode | SearchSortMode)}
            className="min-w-[10rem] cursor-pointer rounded-sm border border-border bg-surface px-3 py-2 text-body text-text-primary shadow-header transition-shadow duration-200 hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {searchMode && <option value="relevant">{t('search_sort_relevant')}</option>}
            <option value="popular">{t('category_sort_popular')}</option>
            <option value="newest">{t('category_sort_newest')}</option>
            <option value="price_asc">{t('category_sort_price_asc')}</option>
            <option value="price_desc">{t('category_sort_price_desc')}</option>
            <option value="rating">{t('category_sort_rating')}</option>
          </select>
        </label>

        <div className="hidden items-center gap-0.5 rounded-sm border border-border bg-surface p-0.5 shadow-header desktop:flex">
          <button
            type="button"
            aria-pressed={view === 'grid'}
            onClick={() => onViewChange('grid')}
            className={cn(
              'rounded-sm p-2 transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
              view === 'grid'
                ? 'bg-primary text-white shadow-elevation-card'
                : 'text-text-secondary hover:bg-background'
            )}
          >
            <LayoutGrid className="h-5 w-5" aria-hidden />
          </button>
          <button
            type="button"
            aria-pressed={view === 'list'}
            onClick={() => onViewChange('list')}
            className={cn(
              'rounded-sm p-2 transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
              view === 'list'
                ? 'bg-primary text-white shadow-elevation-card'
                : 'text-text-secondary hover:bg-background'
            )}
          >
            <List className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryProductToolbar;
