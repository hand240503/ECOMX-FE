import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nProvider';
import { cn } from '../../lib/cn';
import { HOME_PROMO_NAV_ITEMS, homePromoCategoryPath } from './homePromoNavItems';

const QuickLinks = () => {
  const { t } = useI18n();

  return (
    <div className="mb-4 rounded-md border border-border bg-surface p-4 shadow-header">
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-4 pb-1 tablet:gap-x-6 desktop:gap-x-8">
        {HOME_PROMO_NAV_ITEMS.map((item) => (
          <Link
            key={item.id}
            to={homePromoCategoryPath(item.categoryCode)}
            className="group flex min-w-[72px] max-w-[7.5rem] flex-col items-center px-0.5 tablet:min-w-[80px] tablet:max-w-[8.5rem]"
          >
            <div
              className={cn(
                'mb-2 flex h-12 w-12 items-center justify-center rounded-md bg-primary/10',
                'transition-all duration-200 ease-in-out',
                'group-hover:-translate-y-1 group-hover:bg-primary/15 group-hover:shadow-elevation-card'
              )}
            >
              <span className="text-2xl" aria-hidden>
                {item.icon}
              </span>
            </div>
            <span className="w-full text-center text-caption font-medium leading-tight text-text-primary line-clamp-2">
              {t(item.titleKey)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default QuickLinks;
