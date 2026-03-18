import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { authService } from '../../api/services';
import type { AuthResponse } from '../../api/types/auth.types';

export type AuthStatus = 'unknown' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  status: AuthStatus;
  user: AuthResponse['user_info'] | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  bootstrapAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [status, setStatus] = useState<AuthStatus>('unknown');
  const [user, setUser] = useState<AuthResponse['user_info'] | null>(null);

  const setAuthenticated = useCallback((nextUser: AuthResponse['user_info'] | null) => {
    setUser(nextUser);
    setStatus('authenticated');
  }, []);

  const setUnauthenticated = useCallback(() => {
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  const bootstrapAuth = useCallback(async () => {
    if (!authService.isAuthenticated()) {
      setUnauthenticated();
      return;
    }

    try {
      const profile = await authService.fetchCurrentUser();
      setAuthenticated(profile);
    } catch {
      authService.clearAuth();
      setUnauthenticated();
    }
  }, [setAuthenticated, setUnauthenticated]);

  const syncAuthState = useCallback(() => {
    if (!authService.isAuthenticated()) {
      setUnauthenticated();
      return;
    }

    const cachedUser = authService.getCurrentUser();
    if (cachedUser) {
      setAuthenticated(cachedUser);
      return;
    }

    setStatus('unknown');
    void bootstrapAuth();
  }, [bootstrapAuth, setAuthenticated, setUnauthenticated]);

  useEffect(() => {
    void bootstrapAuth();
  }, [bootstrapAuth]);

  useEffect(() => {
    const onAuthChanged = () => {
      syncAuthState();
    };

    window.addEventListener('auth:changed', onAuthChanged);
    window.addEventListener('storage', onAuthChanged);
    return () => {
      window.removeEventListener('auth:changed', onAuthChanged);
      window.removeEventListener('storage', onAuthChanged);
    };
  }, [syncAuthState]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      isAuthenticated: status === 'authenticated',
      isLoading: status === 'unknown',
      bootstrapAuth
    }),
    [bootstrapAuth, status, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
