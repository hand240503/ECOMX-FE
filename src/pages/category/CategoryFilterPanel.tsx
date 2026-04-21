import { useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronDown } from 'lucide-react';
import {
  groupBrandGroupsBySubcategoryLetter,
  groupFlatBrandsByLetter,
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
        <div className="border-t border-border bg-background/30 px-4 py-3">
          {children}
        </div>
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
    <div className="max-h-[min(70vh,28rem)] overflow-x-hidden overflow-y-auto rounded-md border border-border bg-background/50 shadow-inner">
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
  if (!brands.length) return null;
  return (
    <ul className="space-y-1.5">
      {brands.map((b) => (
        <li key={b.id}>
          <label className="flex cursor-pointer items-center gap-2 rounded-sm py-0.5 text-caption text-text-primary transition-colors hover:bg-primary/5">
            <input
              type="checkbox"
              checked={selectedIds.includes(b.id)}
              onChange={() => onToggle(b.id)}
              className="h-4 w-4 rounded-sm border-border text-primary focus:ring-primary"
            />
            <span className="truncate">{b.name}</span>
          </label>
        </li>
      ))}
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
}: CategoryFilterPanelProps) => {
  const { t } = useI18n();
  const {
    clientFilters,
    activeFilterCount,
    clearAllFilters,
    setPriceRange,
    toggleBrand,
    setMinRating,
    setInStock,
    setFreeship,
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

  const flatBrandLetterBlocks = useMemo(
    () => groupFlatBrandsByLetter(flatBrandsNoSubs),
    [flatBrandsNoSubs]
  );

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

  const hasGroupedNav = brandGroups.length > 0;
  const showOtherBucket = hasGroupedNav && flatBrandsNoSubs.length > 0;
  const showFlatBrandsOnly = !hasGroupedNav && flatBrandsNoSubs.length > 0;
  const showCategoryBrandRow = hasGroupedNav || showFlatBrandsOnly;

  const firstRowTitle = hasGroupedNav
    ? t('category_filter_subcategories_brands')
    : t('category_filter_brands');

  return (
    <div className="overflow-hidden rounded-md border border-border bg-surface shadow-header">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3.5">
        <h2 className="text-title font-bold text-text-primary">
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
        <SidebarAccordionRow title={firstRowTitle} defaultOpen={false}>
          <p className="mb-3 rounded-md bg-primary/5 px-2.5 py-2 text-caption leading-relaxed text-text-secondary">
            {t('category_filter_letter_hint')}
          </p>
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
            <div className="max-h-[min(50vh,20rem)] overflow-x-hidden overflow-y-auto rounded-md border border-border bg-background/50 shadow-inner">
              <div className="divide-y divide-border">
                {flatBrandLetterBlocks.map(({ key, brands }) => (
                  <LetterIndexRow
                    key={key}
                    id={letterDomId('brand', key)}
                    label={letterLabel(key)}
                    open={openLetters.has(`flat-${key}`)}
                    onToggle={() => toggleLetter(`flat-${key}`)}
                  >
                    <BrandCheckboxList
                      brands={brands}
                      selectedIds={clientFilters.brandIds}
                      onToggle={toggleBrand}
                    />
                  </LetterIndexRow>
                ))}
              </div>
            </div>
          )}
        </SidebarAccordionRow>
      )}

      <SidebarAccordionRow title={t('category_filter_price')} defaultOpen={false}>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <label className="flex-1 text-caption text-text-secondary">
              <span className="mb-1 block">{t('category_filter_price_from')}</span>
              <input
                key={`pf-min-${priceFieldKey}`}
                ref={minPriceRef}
                defaultValue={clientFilters.minPrice != null ? String(clientFilters.minPrice) : ''}
                inputMode="numeric"
                className="w-full rounded-sm border border-border bg-surface px-2 py-2 text-body text-text-primary shadow-header transition-shadow duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary hover:border-primary/25"
              />
            </label>
            <label className="flex-1 text-caption text-text-secondary">
              <span className="mb-1 block">{t('category_filter_price_to')}</span>
              <input
                key={`pf-max-${priceFieldKey}`}
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

      <SidebarAccordionRow title={t('category_filter_rating')} defaultOpen={false}>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((n) => (
            <label
              key={n}
              className="flex cursor-pointer items-center gap-2 text-body text-text-primary"
            >
              <input
                type="radio"
                name="minRating"
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
        <label className="mt-3 flex cursor-pointer items-center gap-2 text-body text-text-primary">
          <input
            type="checkbox"
            checked={clientFilters.freeship}
            onChange={(e) => setFreeship(e.target.checked)}
            className="h-4 w-4 rounded-sm border-border text-primary focus:ring-primary"
          />
          {t('category_filter_freeship')}
        </label>
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
