import type { InputHTMLAttributes } from 'react';
import type { FieldError } from 'react-hook-form';
import { authInputClass, authLabelClass } from '../../lib/authFormClasses';
import { cn } from '../../lib/cn';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: FieldError | string;
}

export default function FormInput({ label, error, id, className, disabled, ...props }: FormInputProps) {
  const message = typeof error === 'string' ? error : error?.message;

  return (
    <div>
      <label htmlFor={id} className={authLabelClass}>
        {label}
      </label>
      <input
        id={id}
        disabled={disabled}
        className={cn(authInputClass(Boolean(message), Boolean(disabled)), className)}
        {...props}
      />
      {message ? <p className="mt-1.5 text-caption text-danger">{message}</p> : null}
    </div>
  );
}
