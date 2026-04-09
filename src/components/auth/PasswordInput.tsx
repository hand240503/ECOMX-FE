import { useState, type InputHTMLAttributes } from 'react';
import type { FieldError } from 'react-hook-form';

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  error?: FieldError | string;
}

export default function PasswordInput({ label, error, id, className, ...props }: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);
  const message = typeof error === 'string' ? error : error?.message;

  return (
    <div>
      <label htmlFor={id} className="block mb-2 text-sm font-semibold text-slate-700">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={isVisible ? 'text' : 'password'}
          className={`w-full px-4 py-3.5 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent text-sm pr-12 transition-colors ${
            message ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-rose-500'
          } ${className ?? ''}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setIsVisible((prev) => !prev)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          aria-label={isVisible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        >
          {isVisible ? 'Ẩn' : 'Hiện'}
        </button>
      </div>
      {message ? <p className="mt-1.5 text-xs text-red-500">{message}</p> : null}
    </div>
  );
}
