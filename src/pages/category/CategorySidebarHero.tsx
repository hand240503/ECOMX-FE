import { Link } from 'react-router-dom';
import type { CategoryResponse } from '../../api/types/category.types';
import { useI18n } from '../../i18n/I18nProvider';
import { cn } from '../../lib/cn';

export type CategorySidebarHeroLayout = 'sidebar' | 'mobile';

interface CategorySidebarHeroProps {
  name: string;
  totalProducts: number;
  subcategories: CategoryResponse[];
  currentCode: string;
  layout: CategorySidebarHeroLayout;
}

/**
 * Khối tiêu đề danh mục + số SP + chip danh mục con — đặt sidebar (desktop) hoặc full-width (mobile).
 */
const CategorySidebarHero = ({
  name,
  totalProducts,
  subcategories,
  currentCode,
  layout,
}: CategorySidebarHeroProps) => {
  const { t } = useI18n();
  const countLabel = t('category_hero_count').replace(
    '{count}',
    totalProducts.toLocaleString('vi-VN')
  );

  const isSidebar = layout === 'sidebar';

  return (
    <section
      className={cn(
        'overflow-hidden rounded-md border border-primary/20 bg-gradient-to-br from-primary/10 via-surface to-background shadow-header',
        isSidebar ? 'px-3 py-3' : 'px-4 py-3.5'
      )}
    >
      <h1
        className={cn(
          'font-bold leading-snug text-text-primary',
          isSidebar ? 'text-heading' : 'text-display'
        )}
      >
        {name}
      </h1>
      <p className="mt-1 text-caption text-text-secondary">{countLabel}</p>

      {subcategories.length > 0 && (
        <div className="mt-3">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-text-secondary">
            {t('category_sidebar_series_label')}
          </p>
          <div
            className={cn(
              isSidebar
                ? 'max-h-[13.5rem] overflow-y-auto overflow-x-hidden pr-0.5'
                : '-mx-0.5 flex overflow-x-auto pb-1 scrollbar-hide'
            )}
          >
            <div
              className={cn(
                'flex gap-1.5',
                isSidebar ? 'flex-wrap' : 'min-w-min flex-nowrap px-0.5'
              )}
            >
              {subcategories.map((child) => {
                const active = child.code === currentCode;
                return (
                  <Link
                    key={child.id}
                    to={`/products?category=${encodeURIComponent(child.code)}`}
                    className={cn(
                      'rounded-sm border px-2 py-1 text-caption font-semibold leading-tight transition-all duration-200 ease-in-out',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
                      isSidebar ? 'break-words text-left' : 'flex-shrink-0',
                      active
                        ? 'border-primary bg-primary text-white shadow-elevation-card'
                        : 'border-border bg-surface/95 text-text-primary shadow-header hover:border-primary/35 hover:bg-primary/5'
                    )}
                  >
                    {child.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default CategorySidebarHero;
