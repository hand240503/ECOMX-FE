import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nProvider';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface CategoryBreadcrumbProps {
  items: BreadcrumbItem[];
}

const CategoryBreadcrumb = ({ items }: CategoryBreadcrumbProps) => {
  const { t } = useI18n();

  if (!items.length) return null;

  const renderChain = (chain: BreadcrumbItem[], showEllipsis: boolean) => (
    <nav
      aria-label="Breadcrumb"
      className="flex flex-wrap items-center gap-x-2 gap-y-1 text-caption text-text-secondary"
    >
      <Link
        to="/"
        className="font-medium text-text-secondary transition-colors duration-200 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        {t('category_breadcrumb_home')}
      </Link>
      {showEllipsis && (
        <>
          <span className="text-text-disabled" aria-hidden>
            ›
          </span>
          <span className="text-text-disabled">{t('category_breadcrumb_ellipsis')}</span>
        </>
      )}
      {chain.map((item, index) => (
        <span key={`${item.label}-${index}`} className="flex items-center gap-2">
          <span className="select-none text-text-disabled" aria-hidden>
            ›
          </span>
          {item.href && !item.current ? (
            <Link
              to={item.href}
              className="text-text-secondary transition-colors duration-200 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {item.label}
            </Link>
          ) : (
            <span className={item.current ? 'font-semibold text-primary' : 'text-text-primary'}>
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );

  const collapsed = items.length > 2 ? items.slice(-2) : items;
  const showEllipsis = items.length > 2;

  return (
    <>
      <div className="hidden desktop:block">{renderChain(items, false)}</div>
      <div className="block desktop:hidden">{renderChain(collapsed, showEllipsis)}</div>
    </>
  );
};

export default CategoryBreadcrumb;
