import type { PropsWithChildren, ReactNode } from 'react';
import LoadingLink from '../LoadingLink';

interface AuthCardProps extends PropsWithChildren {
  title: string;
  description: string;
  footer?: ReactNode;
}

export default function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="flex justify-center mb-7">
          <LoadingLink to="/" className="flex flex-col items-center">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl px-7 py-3.5 shadow-lg ring-1 ring-blue-400/20">
              <span className="text-white font-black text-3xl leading-none tracking-tight caret-transparent select-none">
                ECOMX
              </span>
            </div>
          </LoadingLink>
        </div>

        <div className="bg-white/95 backdrop-blur rounded-3xl border border-rose-100 shadow-[0_20px_60px_-20px_rgba(244,63,94,0.35)] p-7 sm:p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-[28px] font-bold text-slate-800 tracking-tight">{title}</h1>
            <p className="mt-1.5 text-sm text-slate-500">{description}</p>
          </div>
          {children}
        </div>

        {footer ? <div className="mt-4 text-center text-sm text-slate-600">{footer}</div> : null}
      </div>
    </div>
  );
}
