import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouteLoadingNavigation } from '../../app/loading/useRouteLoadingNavigation';
import { useI18n } from '../../i18n/I18nProvider';
import { HOME_PROMO_NAV_ITEMS } from './homePromoNavItems';

const FeaturedCategoryTabs = () => {
  const { navigateWithLoading } = useRouteLoadingNavigation();
  const { t } = useI18n();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' });
  };

  return (
    <div className="relative border-b border-border bg-surface">
      <div className="mx-auto w-full max-w-container px-4 tablet:px-6">
        <div className="group relative flex items-center">
          <button
            type="button"
            onClick={() => scroll('left')}
            className="absolute left-0 z-10 hidden h-full items-center bg-gradient-to-r from-white via-white to-transparent pr-4 group-hover:flex"
            aria-label="Cuộn trái"
          >
            <ChevronLeft className="h-4 w-4 text-gray-500" />
          </button>

          <div
            ref={scrollRef}
            className="scrollbar-hide flex gap-1 overflow-x-auto py-1"
          >
            {HOME_PROMO_NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  navigateWithLoading(
                    `/products?category=${encodeURIComponent(item.categoryCode)}`
                  )
                }
                className="flex flex-shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-text-secondary whitespace-nowrap hover:bg-blue-50 hover:text-blue-600 transition-colors"
              >
                <span>{item.icon}</span>
                <span>{t(item.titleKey)}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => scroll('right')}
            className="absolute right-0 z-10 hidden h-full items-center bg-gradient-to-l from-white via-white to-transparent pl-4 group-hover:flex"
            aria-label="Cuộn phải"
          >
            <ChevronRight className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeaturedCategoryTabs;
