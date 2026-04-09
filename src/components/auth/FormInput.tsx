import type { InputHTMLAttributes } from 'react';
import type { FieldError } from 'react-hook-form';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: FieldError | string;
}

export default function FormInput({ label, error, id, className, ...props }: FormInputProps) {
  const message = typeof error === 'string' ? error : error?.message;

  return (
    <div>
      <label htmlFor={id} className="block mb-2 text-sm font-semibold text-slate-700">
        {label}
      </label>
      <input
        id={id}
        className={`w-full px-4 py-3.5 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent text-sm transition-colors ${
          message ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-rose-500'
        } ${className ?? ''}`}
        {...props}
      />
      {message ? <p className="mt-1.5 text-xs text-red-500">{message}</p> : null}
    </div>
  );
}
