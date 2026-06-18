import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronDown } from 'lucide-react';
import type { ProductFullResponse } from '../../api/types/product.types';
import { FilterFacetCheckbox } from '../../components/filters/FilterFacetCheckbox';
import { PriceBucketRadioList } from '../../components/filters/PriceBucketRadioList';
import {
  groupBrandGroupsBySubcategoryLetter,
  type BrandOption,
  type SubcategoryBrandGroup,
} from '../../lib/categoryFilterBuckets';
import type { ProductListUrlSnapshot } from '../../hooks/useProductListUrlState';
import { useI18n } from '../../i18n/I18nProvider';
import { cn } from '../../lib/cn';

const OTHER_SECTION_KEY = '__other_brands__';

function letterDomId(prefix: string, letterKey: string): string {
  return `${prefix}-${letterKey === '#' ? 'hash' : letterKey}`;
}

interface CategoryFilterPanelProps {
  brandGroups: SubcategoryBrandGroup[];
  flatBrandsNoSubs: BrandOption[];
  currentCategoryCode: string;
  tagOptions: string[];
  url: ProductListUrlSnapshot;
  priceFacetProducts: ProductFullResponse[];
}

/** Hàng accordion kiểu sidebar Tiki: tiêu đề trái, chevron phải, gạch ngang */
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
        <span className="text-[13px] font-bold uppercase leading-snug tracking-wide text-neutral-900">
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

/** Một dòng trong khối chỉ mục A–Z: gọn, dùng chung viền / divide-y của container */
function LetterIndexRow({
  id,
  label,
  open,
  onToggle,
  children,
}: {
  id: string;
  label: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div>
      <button
        type="button"
        id={`letter-acc-${id}`}
        aria-expanded={open}
        aria-controls={`letter-panel-${id}`}
        onClick={onToggle}
        className={cn(
          'flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary',
          open
            ? 'bg-primary/10 text-primary'
            : 'text-text-primary hover:bg-surface active:bg-background'
        )}
      >
        <span
          className={cn(
            'min-w-[2rem] text-body font-bold tabular-nums tracking-tight',
            open ? 'text-primary' : 'text-text-primary'
          )}
        >
          {label}
        </span>
        <span
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all duration-200 ease-in-out',
            open
              ? 'border-primary/30 bg-primary/15 text-primary shadow-sm'
              : 'border-border bg-surface text-text-secondary shadow-header'
          )}
          aria-hidden
        >
          <ChevronDown
            className={cn('h-3.5 w-3.5 transition-transform duration-200 ease-in-out', open && 'rotate-180')}
          />
        </span>
      </button>
      {open && (
        <div
          id={`letter-panel-${id}`}
          role="region"
          aria-labelledby={`letter-acc-${id}`}
          className="border-t border-border/90 bg-gradient-to-b from-background/80 to-surface/95 px-2 pb-2.5 pt-1"
        >
          <div className="ml-1.5 border-l-2 border-primary/25 pl-3">{children}</div>
        </div>
      )}
    </div>
  );
}

function LetterIndexShell({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-hidden rounded-md border border-neutral-200/80 bg-white/70">
      <div className="divide-y divide-border">{children}</div>
    </div>
  );
}

function BrandCheckboxList({
  brands,
  selectedIds,
  onToggle,
}: {
  brands: BrandOption[];
  selectedIds: number[];
  onToggle: (id: number) => void;
}) {
  const { t } = useI18n();
  if (!brands.length) return null;
  return (
    <ul className="divide-y divide-neutral-200/95">
      {brands.map((b) => {
        const selected = selectedIds.includes(b.id);
        return (
          <li key={b.id}>
            <div
              className={cn(
                'flex items-center gap-3 py-3 transition-colors duration-150',
                selected && 'relative -mx-1 rounded-md bg-[#fff8f4] px-1 ring-1 ring-[#fde8dc]/90'
              )}
            >
              <button
                type="button"
                aria-pressed={selected}
                aria-label={
                  typeof b.count === 'number' ? `${b.name} (${b.count})` : b.name
                }
                onClick={() => onToggle(b.id)}
                className="shrink-0 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-[#e67e22]/60 focus-visible:ring-offset-1"
              >
                <FilterFacetCheckbox checked={selected} />
              </button>
              <div className="min-w-0 flex-1 text-[13px] leading-snug tracking-tight">
                <button
                  type="button"
                  onClick={() => onToggle(b.id)}
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
                        onToggle(b.id);
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
  );
}

function SubcategoryBrandBlock({
  child,
  brands,
  currentCategoryCode,
  selectedIds,
  onToggleBrand,
}: {
  child: SubcategoryBrandGroup['subcategory'];
  brands: BrandOption[];
  currentCategoryCode: string;
  selectedIds: number[];
  onToggleBrand: (id: number) => void;
}) {
  const active = child.code === currentCategoryCode;
  return (
    <div className="py-2.5 first:pt-1 last:pb-1">
      <Link
        to={`/products?category=${encodeURIComponent(child.code)}`}
        className={cn(
          'flex items-center gap-2 rounded-sm py-0.5 text-caption font-semibold transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
          active ? 'text-primary' : 'text-text-primary'
        )}
      >
        {active && <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />}
        <span className="leading-snug">{child.name}</span>
      </Link>
      {brands.length > 0 && (
        <div className="mt-1.5 space-y-1 border-l border-primary/20 pl-2.5">
          <BrandCheckboxList brands={brands} selectedIds={selectedIds} onToggle={onToggleBrand} />
        </div>
      )}
    </div>
  );
}

const CategoryFilterPanel = ({
  brandGroups,
  flatBrandsNoSubs,
  currentCategoryCode,
  tagOptions,
  url,
  priceFacetProducts,
}: CategoryFilterPanelProps) => {
  const { t } = useI18n();
  const {
    clientFilters,
    activeFilterCount,
    clearAllFilters,
    setPriceRange,
    toggleBrand,
    toggleTag,
  } = url;

  const [openLetters, setOpenLetters] = useState<Set<string>>(() => new Set());

  const toggleLetter = (key: string) => {
    setOpenLetters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const letterLabel = (key: string) => (key === '#' ? t('category_filter_letter_hash') : key);

  const letterBlocks = useMemo(
    () => groupBrandGroupsBySubcategoryLetter(brandGroups),
    [brandGroups]
  );

  const hasGroupedNav = brandGroups.length > 0;
  const showOtherBucket = hasGroupedNav && flatBrandsNoSubs.length > 0;
  const showFlatBrandsOnly = !hasGroupedNav && flatBrandsNoSubs.length > 0;
  const showCategoryBrandRow = hasGroupedNav || showFlatBrandsOnly;

  const firstRowTitle = hasGroupedNav
    ? t('category_filter_subcategories_brands')
    : t('category_filter_brands');

  return (
    <div className="overflow-x-hidden rounded-md border border-neutral-200/90 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-neutral-200/90 px-4 py-3.5">
        <h2 className="text-[15px] font-bold uppercase tracking-wide text-neutral-900">
          {t('category_filter_card_heading')}
        </h2>
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

      {showCategoryBrandRow && (
        <SidebarAccordionRow title={firstRowTitle} defaultOpen={showFlatBrandsOnly}>
          {hasGroupedNav && (
            <p className="mb-3 rounded-md bg-primary/5 px-2.5 py-2 text-caption leading-relaxed text-text-secondary">
              {t('category_filter_letter_hint')}
            </p>
          )}
          {hasGroupedNav && (
            <LetterIndexShell>
              {letterBlocks.map(({ key, groups }) => (
                <LetterIndexRow
                  key={key}
                  id={letterDomId('sub', key)}
                  label={letterLabel(key)}
                  open={openLetters.has(key)}
                  onToggle={() => toggleLetter(key)}
                >
                  <div className="divide-y divide-border/70">
                    {groups.map(({ subcategory: child, brands }) => (
                      <SubcategoryBrandBlock
                        key={child.id}
                        child={child}
                        brands={brands}
                        currentCategoryCode={currentCategoryCode}
                        selectedIds={clientFilters.brandIds}
                        onToggleBrand={toggleBrand}
                      />
                    ))}
                  </div>
                </LetterIndexRow>
              ))}
              {showOtherBucket && (
                <LetterIndexRow
                  id={OTHER_SECTION_KEY}
                  label={t('category_filter_brands_other')}
                  open={openLetters.has(OTHER_SECTION_KEY)}
                  onToggle={() => toggleLetter(OTHER_SECTION_KEY)}
                >
                  <BrandCheckboxList
                    brands={flatBrandsNoSubs}
                    selectedIds={clientFilters.brandIds}
                    onToggle={toggleBrand}
                  />
                </LetterIndexRow>
              )}
            </LetterIndexShell>
          )}
          {showFlatBrandsOnly && (
            <BrandCheckboxList
              brands={flatBrandsNoSubs}
              selectedIds={clientFilters.brandIds}
              onToggle={toggleBrand}
            />
          )}
        </SidebarAccordionRow>
      )}

      <SidebarAccordionRow title={t('category_filter_price')} defaultOpen>
        <PriceBucketRadioList
          minPrice={clientFilters.minPrice}
          maxPrice={clientFilters.maxPrice}
          onPriceRangeChange={setPriceRange}
          priceFacetProducts={priceFacetProducts}
        />
      </SidebarAccordionRow>

      {tagOptions.length > 0 && (
        <SidebarAccordionRow title={t('category_filter_tags')} defaultOpen={false}>
          <div className="flex flex-wrap gap-2">
            {tagOptions.map((tag) => {
              const active = clientFilters.tagCodes.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    'rounded-sm border px-2 py-1 text-caption transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                    active
                      ? 'border-primary bg-primary text-white shadow-elevation-card'
                      : 'border-border bg-background text-text-primary shadow-header hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-elevation-card'
                  )}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </SidebarAccordionRow>
      )}
    </div>
  );
};

export default CategoryFilterPanel;
