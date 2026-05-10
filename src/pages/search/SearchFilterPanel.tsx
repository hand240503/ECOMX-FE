import { useMemo, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import type { ProductFullResponse } from '../../api/types/product.types';
import { FilterFacetCheckbox } from '../../components/filters/FilterFacetCheckbox';
import { PriceBucketRadioList } from '../../components/filters/PriceBucketRadioList';
import type { SearchUrlSnapshot } from '../../hooks/useSearchUrlState';
import type { BrandOption } from '../../lib/categoryFilterBuckets';
import { useI18n } from '../../i18n/I18nProvider';
import { cn } from '../../lib/cn';

function SidebarAccordionRow({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-neutral-200/80 last:border-b-0">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors duration-200 hover:bg-neutral-50/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#e67e22]/35"
      >
        <span className="text-body font-bold uppercase leading-snug tracking-wide text-text-primary">
          {title}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-neutral-500 transition-transform duration-200 ease-in-out',
            open ? 'rotate-180' : ''
          )}
          aria-hidden
        />
      </button>
      {open && (
        <div className="border-t border-neutral-200/90 bg-[#fafafa] px-4 py-2">{children}</div>
      )}
    </div>
  );
}

export interface SearchCategoryFacet {
  id: number;
  name: string;
  count: number;
}

interface SearchFilterPanelProps {
  url: SearchUrlSnapshot;
  categoryFacets: SearchCategoryFacet[];
  flatBrands: BrandOption[];
  /** Kết quả để đếm từng khoảng giá (đã áp dụng bộ lọc trừ min/max giá). */
  priceFacetProducts: ProductFullResponse[];
}

const SearchFilterPanel = ({
  url,
  categoryFacets,
  flatBrands,
  priceFacetProducts,
}: SearchFilterPanelProps) => {
  const { t } = useI18n();
  const {
    clientFilters,
    activeFilterCount,
    clearAllFilters,
    setPriceRange,
    toggleBrand,
    setMinRating,
    setInStock,
    searchCategoryId,
    setSearchCategoryId,
  } = url;

  const sortedFacets = useMemo(
    () => [...categoryFacets].sort((a, b) => a.name.localeCompare(b.name, 'vi')),
    [categoryFacets]
  );

  return (
    <div className="overflow-x-hidden rounded-md border border-neutral-200/90 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-neutral-200/90 px-4 py-3.5">
        <h2 className="text-title font-bold text-text-primary">{t('search_filter_heading')}</h2>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={() => clearAllFilters()}
            className="shrink-0 text-caption font-medium text-primary transition-colors hover:text-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            {t('category_filter_clear_all')}
          </button>
        )}
      </div>

      <SidebarAccordionRow title={t('search_filter_categories')} defaultOpen>
        <div className="space-y-2">
          <label className="flex cursor-pointer items-start gap-2 text-body text-text-primary">
            <input
              type="radio"
              name="searchCategory"
              checked={searchCategoryId == null}
              onChange={() => setSearchCategoryId(null)}
              className="mt-1 h-4 w-4 border-border text-primary focus:ring-primary"
            />
            <span>{t('search_filter_all_categories')}</span>
          </label>
          {sortedFacets.map((c) => (
            <label
              key={c.id}
              className="flex cursor-pointer items-start gap-2 text-body text-text-primary"
            >
              <input
                type="radio"
                name="searchCategory"
                checked={searchCategoryId === c.id}
                onChange={() => setSearchCategoryId(c.id)}
                className="mt-1 h-4 w-4 border-border text-primary focus:ring-primary"
              />
              <span>
                {c.name}{' '}
                <span className="text-caption text-text-secondary">({c.count})</span>
              </span>
            </label>
          ))}
        </div>
      </SidebarAccordionRow>

      <SidebarAccordionRow title={t('category_filter_price')} defaultOpen>
        <PriceBucketRadioList
          minPrice={clientFilters.minPrice}
          maxPrice={clientFilters.maxPrice}
          onPriceRangeChange={setPriceRange}
          priceFacetProducts={priceFacetProducts}
        />
      </SidebarAccordionRow>

      {flatBrands.length > 0 && (
        <SidebarAccordionRow title={t('category_filter_brands')} defaultOpen={false}>
          <ul className="divide-y divide-neutral-200/95">
            {flatBrands.map((b) => {
              const selected = clientFilters.brandIds.includes(b.id);
              return (
                <li key={b.id}>
                  <div
                    className={cn(
                      'flex items-center gap-3 py-3 transition-colors duration-150',
                      selected &&
                        'relative -mx-1 rounded-md bg-[#fff8f4] px-1 ring-1 ring-[#fde8dc]/90'
                    )}
                  >
                    <button
                      type="button"
                      aria-pressed={selected}
                      aria-label={
                        typeof b.count === 'number' ? `${b.name} (${b.count})` : b.name
                      }
                      onClick={() => toggleBrand(b.id)}
                      className="shrink-0 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-[#e67e22]/60 focus-visible:ring-offset-1"
                    >
                      <FilterFacetCheckbox checked={selected} />
                    </button>
                    <div className="min-w-0 flex-1 text-[13px] leading-snug tracking-tight">
                      <button
                        type="button"
                        onClick={() => toggleBrand(b.id)}
                        className="inline max-w-full text-left focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e67e22]/50"
                      >
                        <span className="font-medium text-neutral-900">{b.name}</span>
                        {typeof b.count === 'number' && (
                          <span className="font-normal text-neutral-500"> ({b.count})</span>
                        )}
                      </button>
                      {selected && (
                        <>
                          {' '}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleBrand(b.id);
                            }}
                            className="inline align-baseline text-[13px] font-medium text-[#c0392b] decoration-transparent underline-offset-2 hover:text-[#a93226] hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e67e22]/45"
                          >
                            {t('category_filter_remove_choice')}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </SidebarAccordionRow>
      )}

      <SidebarAccordionRow title={t('category_filter_rating')} defaultOpen={false}>
        <ul className="divide-y divide-neutral-200/95">
          {[5, 4, 3, 2, 1].map((n) => {
            const selected = clientFilters.minRating === n;
            const label = t('category_filter_rating_at_least').replace('{n}', String(n));
            return (
              <li key={n}>
                <div
                  className={cn(
                    'flex items-center gap-3 py-3 transition-colors duration-150',
                    selected && 'relative -mx-1 rounded-md bg-[#fff8f4] px-1 ring-1 ring-[#fde8dc]/90'
                  )}
                >
                  <button
                    type="button"
                    aria-pressed={selected}
                    aria-label={label}
                    onClick={() => (selected ? setMinRating(null) : setMinRating(n))}
                    className="shrink-0 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-[#e67e22]/60 focus-visible:ring-offset-1"
                  >
                    <FilterFacetCheckbox checked={selected} />
                  </button>
                  <div className="min-w-0 flex-1 text-[13px] leading-snug tracking-tight text-neutral-900">
                    <button
                      type="button"
                      onClick={() => (selected ? setMinRating(null) : setMinRating(n))}
                      className="inline text-left font-medium hover:text-black focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e67e22]/50"
                    >
                      {label}
                    </button>
                    {selected && (
                      <>
                        {' '}
                        <button
                          type="button"
                          onClick={() => setMinRating(null)}
                          className="inline align-baseline text-[13px] font-medium text-[#c0392b] decoration-transparent underline-offset-2 hover:text-[#a93226] hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e67e22]/45"
                        >
                          {t('category_filter_remove_choice')}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </SidebarAccordionRow>

      <SidebarAccordionRow title={t('category_filter_row_in_stock')} defaultOpen={false}>
        <ul className="divide-y divide-neutral-200/95">
          <li>
            <div
              className={cn(
                'flex items-center gap-3 py-3 transition-colors duration-150',
                clientFilters.inStock &&
                  'relative -mx-1 rounded-md bg-[#fff8f4] px-1 ring-1 ring-[#fde8dc]/90'
              )}
            >
              <button
                type="button"
                aria-pressed={clientFilters.inStock}
                aria-label={t('category_filter_stock')}
                onClick={() => setInStock(!clientFilters.inStock)}
                className="shrink-0 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-[#e67e22]/60 focus-visible:ring-offset-1"
              >
                <FilterFacetCheckbox checked={clientFilters.inStock} />
              </button>
              <div className="min-w-0 flex-1 text-[13px] leading-snug tracking-tight text-neutral-900">
                <button
                  type="button"
                  onClick={() => setInStock(!clientFilters.inStock)}
                  className="inline text-left font-medium hover:text-black focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e67e22]/50"
                >
                  {t('category_filter_stock')}
                </button>
                {clientFilters.inStock && (
                  <>
                    {' '}
                    <button
                      type="button"
                      onClick={() => setInStock(false)}
                      className="inline align-baseline text-[13px] font-medium text-[#c0392b] decoration-transparent underline-offset-2 hover:text-[#a93226] hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e67e22]/45"
                    >
                      {t('category_filter_remove_choice')}
                    </button>
                  </>
                )}
              </div>
            </div>
          </li>
        </ul>
      </SidebarAccordionRow>
    </div>
  );
};

export default SearchFilterPanel;
