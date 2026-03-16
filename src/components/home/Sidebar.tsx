import { useI18n } from '../../i18n/I18nProvider';

const Sidebar = () => {
  const { t } = useI18n();
  const categories = [
    { name: t('sidebar_cat_1'), icon: '📱' },
    { name: t('sidebar_cat_2'), icon: '💻' },
    { name: t('sidebar_cat_3'), icon: '🧩' },
    { name: t('sidebar_cat_4'), icon: '🖥️' },
    { name: t('sidebar_cat_5'), icon: '🎧' },
    { name: t('sidebar_cat_6'), icon: '🎮' },
    { name: t('sidebar_cat_7'), icon: '📷' },
    { name: t('sidebar_cat_8'), icon: '📶' },
    { name: t('sidebar_cat_9'), icon: '🔌' },
    { name: t('sidebar_cat_10'), icon: '🏠' },
    { name: t('sidebar_cat_11'), icon: '⌚' },
    { name: t('sidebar_cat_12'), icon: '🍎' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm p-3">
      <h3 className="font-bold text-gray-800 mb-3 px-2">{t('sidebar_title')}</h3>
      <ul className="flex flex-col gap-1">
        {categories.map((cat, index) => (
          <li key={index}>
            <a href="#" className="flex items-center gap-3 p-2 hover:bg-blue-50 rounded-md text-sm text-gray-700 transition-colors">
              <span className="text-base" aria-hidden>
                {cat.icon}
              </span>
              <span className="truncate">{cat.name}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
