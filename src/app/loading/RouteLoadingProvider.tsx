import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

interface RouteLoadingContextValue {
  isRouteLoading: boolean;
  startRouteTransition: (action: () => void, delayMs?: number) => void;
}

const RouteLoadingContext = createContext<RouteLoadingContextValue | undefined>(undefined);

interface RouteLoadingProviderProps {
  children: ReactNode;
}

export const RouteLoadingProvider = ({ children }: RouteLoadingProviderProps) => {
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const timerRef = useRef<number | null>(null);

  const startRouteTransition = useCallback((action: () => void, delayMs = 450) => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }

    setIsRouteLoading(true);
    timerRef.current = window.setTimeout(() => {
      action();
      setIsRouteLoading(false);
      timerRef.current = null;
    }, delayMs);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const value = useMemo<RouteLoadingContextValue>(
    () => ({
      isRouteLoading,
      startRouteTransition
    }),
    [isRouteLoading, startRouteTransition]
  );

  return <RouteLoadingContext.Provider value={value}>{children}</RouteLoadingContext.Provider>;
};

export const useRouteLoadingState = () => {
  const context = useContext(RouteLoadingContext);
  if (!context) {
    throw new Error('useRouteLoadingState must be used within RouteLoadingProvider');
  }
  return context;
};

