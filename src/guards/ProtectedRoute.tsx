// src/components/auth/ProtectedRoute.tsx
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../api/services/authService';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const isAuthenticated = authService.isAuthenticated();

    if (!isAuthenticated) {
      // ✅ Lưu URL hiện tại để redirect về sau khi login
      console.log('User not authenticated, redirecting to login...');
      navigate('/login', {
        replace: true,
        state: { from: location.pathname } // ✅ Lưu trang trước đó
      });
    }
  }, [navigate, location]);

  const isAuthenticated = authService.isAuthenticated();

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;