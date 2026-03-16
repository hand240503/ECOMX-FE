import { useI18n } from '../../i18n/I18nProvider';

const TopBanner = () => {
  const { t } = useI18n();
  return (
    <div className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white text-center py-2 text-sm">
      <span className="font-medium">
        {t('top_banner_text')} <span className="font-bold">{t('top_banner_highlight')}</span>
      </span>
    </div>
  );
};

export default TopBanner;
