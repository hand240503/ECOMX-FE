import { useI18n } from '../../i18n/I18nProvider';

const customerSupportLinks = [
  'footer_support_link_1',
  'footer_support_link_2',
  'footer_support_link_3',
  'footer_support_link_4'
];

const aboutLinks = [
  'footer_about_link_1',
  'footer_about_link_2',
  'footer_about_link_3',
  'footer_about_link_4'
];

const policyLinks = [
  'footer_policy_link_1',
  'footer_policy_link_2',
  'footer_policy_link_3',
  'footer_policy_link_4'
];

const utilityLinks = [
  'footer_utility_link_1',
  'footer_utility_link_2',
  'footer_utility_link_3',
  'footer_utility_link_4'
];

const MainFooter = () => {
  const { t } = useI18n();
  return (
    <footer className="bg-white border-t border-gray-200 mt-6">
      <div className="w-full max-w-[1392px] mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
          <section>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">{t('footer_support_title')}</h4>
            <p className="text-sm text-gray-600">{t('footer_hotline')}</p>
            <p className="text-sm text-gray-600 mb-3">{t('footer_email')}</p>
            <ul className="space-y-2">
              {customerSupportLinks.map((item) => (
                <li key={item}>
                  <button className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                    {t(item)}
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">{t('footer_about_title')}</h4>
            <ul className="space-y-2">
              {aboutLinks.map((item) => (
                <li key={item}>
                  <button className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                    {t(item)}
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">{t('footer_policy_title')}</h4>
            <ul className="space-y-2">
              {policyLinks.map((item) => (
                <li key={item}>
                  <button className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                    {t(item)}
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">{t('footer_utility_title')}</h4>
            <ul className="space-y-2">
              {utilityLinks.map((item) => (
                <li key={item}>
                  <button className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                    {t(item)}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="mt-8 pt-4 border-t border-gray-100 text-xs text-gray-500 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <span>{t('footer_rights').replace('{year}', String(new Date().getFullYear()))}</span>
          <span>{t('footer_company_name')}</span>
        </div>
      </div>
    </footer>
  );
};

export default MainFooter;
