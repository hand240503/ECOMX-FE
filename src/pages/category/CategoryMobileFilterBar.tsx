import { Filter } from 'lucide-react';
import type { ProductSortMode, SearchSortMode } from '../../lib/categoryProductUtils';
import { useI18n } from '../../i18n/I18nProvider';
import { cn } from '../../lib/cn';

interface CategoryMobileFilterBarProps {
  activeFilterCount: number;
  sort: ProductSortMode | SearchSortMode;
  onOpenSheet: () => void;
  searchMode?: boolean;
}

const CategoryMobileFilterBar = ({
  activeFilterCount,
  sort,
  onOpenSheet,
  searchMode = false,
}: CategoryMobileFilterBarProps) => {
  const { t } = useI18n();

  const sortShort = () => {
    switch (sort) {
      case 'relevant':
        return searchMode ? t('search_sort_relevant') : t('category_sort_popular');
      case 'newest':
        return t('category_sort_newest');
      case 'price_asc':
        return t('category_sort_price_asc');
      case 'price_desc':
        return t('category_sort_price_desc');
      case 'rating':
        return t('category_sort_rating');
      case 'popular':
      default:
        return t('category_sort_popular');
    }
  };

  const chipClass =
    'inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-caption font-medium text-text-primary transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2';

  return (
    <div className="mb-4 flex gap-2 overflow-x-auto rounded-md border border-border bg-surface px-2 py-2.5 shadow-header scrollbar-hide desktop:hidden">
      <button type="button" className={cn(chipClass, 'relative')} onClick={() => onOpenSheet()}>
        <Filter className="h-4 w-4" aria-hidden />
        {t('category_mobile_filter_open')}
        {activeFilterCount > 0 && (
          <span className="ml-0.5 min-w-[1.25rem] rounded-full bg-primary px-1.5 text-center text-[10px] font-bold leading-5 text-white">
            {activeFilterCount}
          </span>
        )}
      </button>
      <button type="button" className={chipClass} onClick={() => onOpenSheet()}>
        {t('category_sort_label')}: {sortShort()}
      </button>
    </div>
  );
};

export default CategoryMobileFilterBar;
