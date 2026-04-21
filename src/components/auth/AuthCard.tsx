import type { PropsWithChildren, ReactNode } from 'react';
import AuthBrandMark from './AuthBrandMark';
import { cn } from '../../lib/cn';

interface AuthCardProps extends PropsWithChildren {
  title: string;
  description: string;
  tagline?: ReactNode;
  footer?: ReactNode;
}

export default function AuthCard({ title, description, tagline, children, footer }: AuthCardProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8 tablet:px-6">
      <div className="w-full max-w-lg">
        <AuthBrandMark subtitle={tagline} />

        <div
          className={cn(
            'rounded-md border border-border bg-surface p-6 shadow-elevation-card',
            'tablet:p-8'
          )}
        >
          <div className="mb-6 text-center">
            <h1 className="text-display text-text-primary">{title}</h1>
            <p className="mt-1.5 text-body text-text-secondary">{description}</p>
          </div>
          {children}
        </div>

        {footer ? (
          <div className="mt-4 text-center text-body text-text-secondary">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
