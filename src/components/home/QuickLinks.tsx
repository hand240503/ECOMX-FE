import { useI18n } from '../../i18n/I18nProvider';
import { cn } from '../../lib/cn';

interface QuickLinkItem {
  id: number;
  titleKey: string;
  icon: string;
}

const QuickLinks = () => {
  const { t } = useI18n();
  const items: QuickLinkItem[] = [
    { id: 1, titleKey: 'quick_link_1', icon: '📱' },
    { id: 2, titleKey: 'quick_link_2', icon: '💻' },
    { id: 3, titleKey: 'quick_link_3', icon: '🎮' },
    { id: 4, titleKey: 'quick_link_4', icon: '📶' },
    { id: 5, titleKey: 'quick_link_5', icon: '🍎' },
    { id: 6, titleKey: 'quick_link_6', icon: '🖥️' },
    { id: 7, titleKey: 'quick_link_7', icon: '🎧' },
    { id: 8, titleKey: 'quick_link_8', icon: '📷' },
    { id: 9, titleKey: 'quick_link_9', icon: '⌚' },
    { id: 10, titleKey: 'quick_link_10', icon: '🔌' }
  ];

  return (
    <div className="mb-4 rounded-md border border-border bg-surface p-4 shadow-header">
      <div className="flex justify-between overflow-x-auto pb-1 scrollbar-hide tablet:justify-start tablet:gap-6 desktop:gap-8">
        {items.map((item) => (
          <div
            key={item.id}
            className="group flex min-w-[76px] cursor-pointer flex-col items-center tablet:min-w-[80px]"
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
            <span className="max-w-[90px] text-center text-caption font-medium leading-tight text-text-primary line-clamp-2">
              {t(item.titleKey)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuickLinks;
