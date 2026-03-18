import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { status } = useAuth();

  useEffect(() => {
    if (status === 'unauthenticated') {
      navigate('/login', {
        replace: true,
        state: { from: location.pathname }
      });
    }
  }, [location.pathname, navigate, status]);

  if (status !== 'authenticated') {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
