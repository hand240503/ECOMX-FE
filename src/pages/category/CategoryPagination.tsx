import { useI18n } from '../../i18n/I18nProvider';
import { cn } from '../../lib/cn';

type PageToken = number | 'ellipsis';

function buildDesktopPages(current: number, total: number): PageToken[] {
  if (total <= 1) return [1];
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, 'ellipsis', total];
  if (current >= total - 3) return [1, 'ellipsis', total - 4, total - 3, total - 2, total - 1, total];
  return [1, 'ellipsis', current - 1, current, current + 1, 'ellipsis', total];
}

interface CategoryPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const CategoryPagination = ({ page, totalPages, onPageChange }: CategoryPaginationProps) => {
  const { t } = useI18n();

  if (totalPages <= 1) return null;

  const desktopModel = buildDesktopPages(page, totalPages);

  return (
    <div className="flex justify-center pt-6 pb-8 tablet:pt-8 tablet:pb-10">
      <div className="hidden items-center gap-1.5 desktop:flex">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-sm border border-border bg-surface px-3 py-2 text-caption font-medium text-text-primary shadow-header transition-all duration-200 hover:border-primary/30 hover:bg-background disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          {t('category_pagination_prev')}
        </button>
        {desktopModel.map((token, idx) =>
          token === 'ellipsis' ? (
            <span key={`e-${idx}`} className="px-2 text-caption text-text-secondary">
              …
            </span>
          ) : (
            <button
              key={token}
              type="button"
              onClick={() => onPageChange(token)}
              className={cn(
                'min-w-[40px] rounded-sm border px-2 py-2 text-caption font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                token === page
                  ? 'border-primary bg-primary text-white shadow-elevation-card'
                  : 'border-border bg-surface text-text-primary shadow-header hover:border-primary/25 hover:bg-background'
              )}
            >
              {token}
            </button>
          )
        )}
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded-sm border border-border bg-surface px-3 py-2 text-caption font-medium text-text-primary shadow-header transition-all duration-200 hover:border-primary/30 hover:bg-background disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          {t('category_pagination_next')}
        </button>
      </div>

      <div className="flex items-center gap-3 desktop:hidden">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-sm border border-border bg-surface px-3 py-2 text-caption font-medium text-text-primary shadow-header transition-all duration-200 hover:border-primary/30 hover:bg-background disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          {t('category_pagination_prev')}
        </button>
        <span className="rounded-full bg-background px-3 py-1.5 text-caption font-medium text-text-secondary">
          {t('category_pagination_page_of')
            .replace('{current}', String(page))
            .replace('{total}', String(totalPages))}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded-sm border border-border bg-surface px-3 py-2 text-caption font-medium text-text-primary shadow-header transition-all duration-200 hover:border-primary/30 hover:bg-background disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          {t('category_pagination_next')}
        </button>
      </div>
    </div>
  );
};

export default CategoryPagination;
