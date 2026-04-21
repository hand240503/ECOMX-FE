import { useMemo, useRef, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import type { SearchUrlSnapshot } from '../../hooks/useSearchUrlState';
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
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors duration-200 hover:bg-background/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
      >
        <span className="text-body font-semibold leading-snug text-text-primary">{title}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-text-secondary transition-transform duration-200 ease-in-out',
            open ? 'rotate-180' : ''
          )}
          aria-hidden
        />
      </button>
      {open && (
        <div className="border-t border-border bg-background/30 px-4 py-3">{children}</div>
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
  flatBrands: { id: number; name: string }[];
}

const SearchFilterPanel = ({ url, categoryFacets, flatBrands }: SearchFilterPanelProps) => {
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

  const minPriceRef = useRef<HTMLInputElement>(null);
  const maxPriceRef = useRef<HTMLInputElement>(null);
  const priceFieldKey = `${clientFilters.minPrice ?? ''}_${clientFilters.maxPrice ?? ''}`;

  const applyPrice = () => {
    const rawMin = minPriceRef.current?.value.trim() ?? '';
    const rawMax = maxPriceRef.current?.value.trim() ?? '';
    const minV = rawMin === '' ? null : Number(rawMin.replace(/\D/g, ''));
    const maxV = rawMax === '' ? null : Number(rawMax.replace(/\D/g, ''));
    const minOk = minV == null || Number.isFinite(minV);
    const maxOk = maxV == null || Number.isFinite(maxV);
    if (!minOk || !maxOk) return;
    if (minV != null && maxV != null && minV > maxV) {
      setPriceRange(maxV, minV);
      return;
    }
    setPriceRange(minV, maxV);
  };

  const sortedFacets = useMemo(
    () => [...categoryFacets].sort((a, b) => a.name.localeCompare(b.name, 'vi')),
    [categoryFacets]
  );

  return (
    <div className="overflow-hidden rounded-md border border-border bg-surface shadow-header">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3.5">
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
        <div className="max-h-[min(50vh,18rem)] space-y-2 overflow-y-auto">
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

      <SidebarAccordionRow title={t('category_filter_price')} defaultOpen={false}>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <label className="flex-1 text-caption text-text-secondary">
              <span className="mb-1 block">{t('category_filter_price_from')}</span>
              <input
                key={`sf-min-${priceFieldKey}`}
                ref={minPriceRef}
                defaultValue={clientFilters.minPrice != null ? String(clientFilters.minPrice) : ''}
                inputMode="numeric"
                className="w-full rounded-sm border border-border bg-surface px-2 py-2 text-body text-text-primary shadow-header transition-shadow duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary hover:border-primary/25"
              />
            </label>
            <label className="flex-1 text-caption text-text-secondary">
              <span className="mb-1 block">{t('category_filter_price_to')}</span>
              <input
                key={`sf-max-${priceFieldKey}`}
                ref={maxPriceRef}
                defaultValue={clientFilters.maxPrice != null ? String(clientFilters.maxPrice) : ''}
                inputMode="numeric"
                className="w-full rounded-sm border border-border bg-surface px-2 py-2 text-body text-text-primary shadow-header transition-shadow duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary hover:border-primary/25"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={() => applyPrice()}
            className="rounded-sm bg-primary px-3 py-2.5 text-caption font-semibold text-white shadow-header transition-all duration-200 ease-in-out hover:bg-primary-dark hover:shadow-elevation-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-[0.98]"
          >
            {t('category_filter_apply')}
          </button>
        </div>
      </SidebarAccordionRow>

      {flatBrands.length > 0 && (
        <SidebarAccordionRow title={t('category_filter_brands')} defaultOpen={false}>
          <div className="max-h-[min(50vh,20rem)] space-y-2 overflow-y-auto rounded-md border border-border bg-background/50">
            {flatBrands.map((b) => (
              <label
                key={b.id}
                className="flex cursor-pointer items-center gap-2 border-b border-border px-3 py-2 text-body text-text-primary last:border-b-0"
              >
                <input
                  type="checkbox"
                  checked={clientFilters.brandIds.includes(b.id)}
                  onChange={() => toggleBrand(b.id)}
                  className="h-4 w-4 rounded-sm border-border text-primary focus:ring-primary"
                />
                {b.name}
              </label>
            ))}
          </div>
        </SidebarAccordionRow>
      )}

      <SidebarAccordionRow title={t('category_filter_rating')} defaultOpen={false}>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((n) => (
            <label
              key={n}
              className="flex cursor-pointer items-center gap-2 text-body text-text-primary"
            >
              <input
                type="radio"
                name="searchMinRating"
                checked={clientFilters.minRating === n}
                onChange={() => setMinRating(n)}
                className="h-4 w-4 border-border text-primary focus:ring-primary"
              />
              {t('category_filter_rating_at_least').replace('{n}', String(n))}
            </label>
          ))}
          {clientFilters.minRating != null && (
            <button
              type="button"
              onClick={() => setMinRating(null)}
              className="text-caption text-primary hover:text-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {t('category_filter_clear_all')}
            </button>
          )}
        </div>
      </SidebarAccordionRow>

      <SidebarAccordionRow title={t('category_filter_row_in_stock')} defaultOpen={false}>
        <label className="flex cursor-pointer items-center gap-2 text-body text-text-primary">
          <input
            type="checkbox"
            checked={clientFilters.inStock}
            onChange={(e) => setInStock(e.target.checked)}
            className="h-4 w-4 rounded-sm border-border text-primary focus:ring-primary"
          />
          {t('category_filter_stock')}
        </label>
      </SidebarAccordionRow>
    </div>
  );
};

export default SearchFilterPanel;
