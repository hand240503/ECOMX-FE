import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nProvider';
import { useHomeRootCategories } from '../../hooks/useHomeRootCategories';
import { useAuth } from '../../app/auth/AuthProvider';
import { Spinner } from '../ui/Spinner';
import { cn } from '../../lib/cn';

const FALLBACK_ICONS = ['📱', '💻', '🧩', '🖥️', '🎧', '🎮', '📷', '📶', '🔌', '🏠', '⌚', '🍎'] as const;

type SidebarItem = {
  key: string;
  name: string;
  icon: (typeof FALLBACK_ICONS)[number];
  href?: string;
};

const Sidebar = () => {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();
  const { data: roots, isLoading, isError } = useHomeRootCategories();

  const fallbackCategories = useMemo(
    () =>
      [
        t('sidebar_cat_1'),
        t('sidebar_cat_2'),
        t('sidebar_cat_3'),
        t('sidebar_cat_4'),
        t('sidebar_cat_5'),
        t('sidebar_cat_6'),
        t('sidebar_cat_7'),
        t('sidebar_cat_8'),
        t('sidebar_cat_9'),
        t('sidebar_cat_10'),
        t('sidebar_cat_11'),
        t('sidebar_cat_12'),
      ].map((name, index) => ({
        key: `fallback-${index}`,
        name,
        icon: FALLBACK_ICONS[index % FALLBACK_ICONS.length],
      })),
    [t]
  );

  const items = useMemo((): SidebarItem[] => {
    if (!isAuthenticated || isError || !roots?.length) {
      return fallbackCategories.map((c) => ({ ...c }));
    }
    return roots.map((cat, index) => ({
      key: `cat-${cat.id}`,
      name: cat.name,
      icon: FALLBACK_ICONS[index % FALLBACK_ICONS.length],
      href: `/products?category=${encodeURIComponent(cat.code)}`,
    }));
  }, [isAuthenticated, isError, roots, fallbackCategories]);

  const showLoading = isAuthenticated && isLoading;

  return (
    <div className="rounded-md border border-border bg-surface p-3 shadow-header">
      <h3 className="mb-3 border-b border-border pb-3 text-heading text-text-primary">
        {t('sidebar_title')}
      </h3>
      {showLoading ? (
        <div className="flex items-center justify-center py-8 text-text-secondary" aria-busy>
          <Spinner className="text-primary" />
        </div>
      ) : (
        <ul className="flex flex-col gap-0.5">
          {items.map((cat) => {
            const rowClass = cn(
              'flex items-center gap-3 rounded-md p-2 text-body transition-all duration-200 ease-in-out',
              cat.href
                ? 'text-text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
                : 'cursor-default text-text-secondary'
            );
            const inner = (
              <>
                <span
                  className={cn(
                    'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-background text-base transition-colors duration-200',
                    cat.href && 'group-hover:bg-primary/5'
                  )}
                  aria-hidden
                >
                  {cat.icon}
                </span>
                <span className="truncate">{cat.name}</span>
              </>
            );
            return (
              <li key={cat.key}>
                {cat.href ? (
                  <Link to={cat.href} className={cn('group', rowClass)}>
                    {inner}
                  </Link>
                ) : (
                  <span className={rowClass}>{inner}</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default Sidebar;
