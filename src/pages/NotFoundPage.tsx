import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/I18nProvider';

const NotFoundPage = () => {
  const { t } = useI18n();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <h1 className="text-display text-text-primary">404</h1>
      <p className="mt-2 text-center text-body text-text-secondary">{t('not_found_message')}</p>
      <Link
        to="/"
        className="mt-6 rounded-sm bg-primary px-6 py-3 text-body font-semibold text-white transition-colors hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {t('not_found_back_home')}
      </Link>
    </div>
  );
};

export default NotFoundPage;
