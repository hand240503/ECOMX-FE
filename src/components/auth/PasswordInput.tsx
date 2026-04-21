import { useState, type InputHTMLAttributes } from 'react';
import type { FieldError } from 'react-hook-form';
import { authInputClass, authLabelClass } from '../../lib/authFormClasses';
import { cn } from '../../lib/cn';

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  error?: FieldError | string;
}

export default function PasswordInput({ label, error, id, className, disabled, ...props }: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);
  const message = typeof error === 'string' ? error : error?.message;

  return (
    <div>
      <label htmlFor={id} className={authLabelClass}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={isVisible ? 'text' : 'password'}
          disabled={disabled}
          className={cn(authInputClass(Boolean(message), Boolean(disabled)), 'pr-12', className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setIsVisible((prev) => !prev)}
          className={cn(
            'absolute right-3 top-1/2 -translate-y-1/2 text-caption font-medium text-text-secondary',
            'transition-colors hover:text-text-primary',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 rounded-sm'
          )}
          aria-label={isVisible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        >
          {isVisible ? 'Ẩn' : 'Hiện'}
        </button>
      </div>
      {message ? <p className="mt-1.5 text-caption text-danger">{message}</p> : null}
    </div>
  );
}
