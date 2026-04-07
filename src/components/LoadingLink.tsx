import type { MouseEvent } from 'react';
import { Link, createPath, useLocation } from 'react-router-dom';
import type { LinkProps } from 'react-router-dom';
import { useRouteLoadingNavigation } from '../app/loading/useRouteLoadingNavigation';

interface LoadingLinkProps extends LinkProps {
  delayMs?: number;
}

const LoadingLink = ({ to, delayMs = 450, onClick, ...props }: LoadingLinkProps) => {
  const location = useLocation();
  const { isRouteLoading, navigateWithLoading } = useRouteLoadingNavigation();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) {
      return;
    }

    // Let browser handle new-tab/window interactions.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
      return;
    }

    const targetPath = typeof to === 'string' ? to : createPath(to);
    const currentPath = `${location.pathname}${location.search}${location.hash}`;

    if (targetPath === currentPath || isRouteLoading) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    navigateWithLoading(to, { delayMs });
  };

  return <Link to={to} onClick={handleClick} {...props} />;
};

export default LoadingLink;

