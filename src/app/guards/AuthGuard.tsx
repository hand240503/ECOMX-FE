import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { useI18n } from '../../i18n/I18nProvider';

interface AuthGuardProps {
  children: ReactNode;
}

const AuthGuard = ({ children }: AuthGuardProps) => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { status } = useAuth();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (status === 'unknown') {
      setIsChecking(true);
      return;
    }

    if (status === 'authenticated') {
      navigate('/', { replace: true });
      return;
    }

    setIsChecking(false);
  }, [navigate, status]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">{t('auth_checking')}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;
