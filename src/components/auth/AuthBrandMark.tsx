import type { ReactNode } from 'react';
import LoadingLink from '../LoadingLink';
import { cn } from '../../lib/cn';

type AuthBrandMarkProps = {
  subtitle?: ReactNode;
  className?: string;
};

export default function AuthBrandMark({ subtitle, className }: AuthBrandMarkProps) {
  return (
    <div className={cn('mb-7 flex justify-center', className)}>
      <LoadingLink
        to="/"
        className={cn(
          'flex flex-col items-center rounded-md',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2'
        )}
      >
        <div className="rounded-md bg-primary px-7 py-3.5 shadow-header">
          <span className="select-none text-2xl font-bold tracking-tight text-white">ECOMX</span>
        </div>
        {subtitle ? (
          <span className="mt-3 text-center text-body font-medium text-text-secondary">{subtitle}</span>
        ) : null}
      </LoadingLink>
    </div>
  );
}
