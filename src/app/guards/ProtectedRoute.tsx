import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../../api/services';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const isAuthenticated = authService.isAuthenticated();

    if (!isAuthenticated) {
      navigate('/login', {
        replace: true,
        state: { from: location.pathname }
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
