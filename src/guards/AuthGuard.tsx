import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../api/services/authService';

interface AuthGuardProps {
  children: ReactNode;
}

/**
 * Redirect về home nếu user đã login
 * Dùng cho: /login, /register
 */
const AuthGuard = ({ children }: AuthGuardProps) => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const isAuthenticated = authService.isAuthenticated();

      if (isAuthenticated) {
        console.log('User already logged in, redirecting to home...');
        navigate('/', { replace: true });
      } else {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [navigate]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Đang kiểm tra...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;