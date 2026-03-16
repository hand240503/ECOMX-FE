import { useI18n } from '../../i18n/I18nProvider';

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
    <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
      <div className="flex justify-between md:justify-start md:gap-8 overflow-x-auto pb-2 scrollbar-hide">
        {items.map((item) => (
          <div key={item.id} className="flex flex-col items-center min-w-[80px] cursor-pointer group">
            <div className="w-12 h-12 rounded-xl mb-2 flex items-center justify-center transition-transform group-hover:-translate-y-1 bg-blue-50">
              <span className="text-2xl" aria-hidden>
                {item.icon}
              </span>
            </div>
            <span className="text-xs text-center text-gray-700 line-clamp-2 max-w-[90px] font-medium leading-tight">
                {t(item.titleKey)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuickLinks;
