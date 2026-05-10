import { useMemo } from 'react';
import type { ProductFullResponse } from '../../api/types/product.types';
import { useI18n } from '../../i18n/I18nProvider';
import { cn } from '../../lib/cn';
import {
  findSearchPriceBucketForFilters,
  productMatchesSearchPriceBucket,
  SEARCH_PRICE_BUCKETS,
} from '../../lib/searchPriceBuckets';
import { FilterFacetCheckbox } from './FilterFacetCheckbox';

export type PriceBucketRadioListProps = {
  minPrice: number | null;
  maxPrice: number | null;
  onPriceRangeChange: (min: number | null, max: number | null) => void;
  priceFacetProducts: ProductFullResponse[];
};

/**
 * Khoảng giá — một lựa chọn; khi bật: «nhãn (số lượng) (Xóa)» cùng một dòng như storefront phổ biến tại VN.
 */
export function PriceBucketRadioList({
  minPrice,
  maxPrice,
  onPriceRangeChange,
  priceFacetProducts,
}: PriceBucketRadioListProps) {
  const { t } = useI18n();
  const activePriceBucket = findSearchPriceBucketForFilters(minPrice, maxPrice);

  const priceBucketCounts = useMemo(() => {
    return SEARCH_PRICE_BUCKETS.map((bucket) => ({
      bucket,
      count: priceFacetProducts.filter((p) => productMatchesSearchPriceBucket(p, bucket)).length,
    }));
  }, [priceFacetProducts]);

  return (
    <ul className="divide-y divide-neutral-200/95">
      {priceBucketCounts.map(({ bucket, count }) => {
        const selected = activePriceBucket?.id === bucket.id;
        const select = () => onPriceRangeChange(bucket.min, bucket.max);
        const clear = () => onPriceRangeChange(null, null);

        return (
          <li key={bucket.id}>
            <div
              className={cn(
                'flex items-center gap-3 py-3 transition-colors duration-150',
                selected && 'relative -mx-1 rounded-md bg-[#fff8f4] px-1 ring-1 ring-[#fde8dc]/90'
              )}
            >
              <button
                type="button"
                aria-pressed={selected}
                aria-label={t(bucket.labelKey)}
                onClick={() => (selected ? clear() : select())}
                className="shrink-0 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-[#e67e22]/60 focus-visible:ring-offset-1"
              >
                <FilterFacetCheckbox checked={selected} />
              </button>

              <div className="min-w-0 flex-1 text-[13px] leading-snug tracking-tight text-neutral-900">
                <button
                  type="button"
                  onClick={() => (selected ? clear() : select())}
                  className="inline text-left align-baseline font-medium text-neutral-900 hover:text-black focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e67e22]/50"
                >
                  {t(bucket.labelKey)}
                </button>
                <span className="inline font-normal text-neutral-500"> ({count})</span>
                {selected && (
                  <>
                    {' '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        clear();
                      }}
                      className="inline align-baseline text-[13px] font-medium text-[#c0392b] decoration-transparent underline-offset-2 transition-colors hover:text-[#a93226] hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e67e22]/45"
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
