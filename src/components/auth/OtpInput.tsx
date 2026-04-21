import { useEffect, useMemo, useRef } from 'react';
import { cn } from '../../lib/cn';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  error?: string;
}

export default function OtpInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  error
}: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = useMemo(() => {
    const chars = value.slice(0, length).split('');
    return Array.from({ length }, (_, index) => chars[index] ?? '');
  }, [length, value]);

  useEffect(() => {
    if (value.length === 0 && refs.current[0]) {
      refs.current[0].focus();
    }
  }, [value.length]);

  const setDigitAt = (index: number, digit: string) => {
    const next = [...digits];
    next[index] = digit;
    onChange(next.join(''));
  };

  const handleInput = (index: number, rawValue: string) => {
    const clean = rawValue.replace(/\D/g, '');
    if (!clean) {
      setDigitAt(index, '');
      return;
    }

    if (clean.length > 1) {
      const next = clean.slice(0, length).split('');
      onChange(Array.from({ length }, (_, i) => next[i] ?? '').join(''));
      const focusIndex = Math.min(clean.length, length - 1);
      refs.current[focusIndex]?.focus();
      return;
    }

    setDigitAt(index, clean);
    refs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, key: string) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
    if (key === 'ArrowLeft' && index > 0) {
      refs.current[index - 1]?.focus();
    }
    if (key === 'ArrowRight' && index < length - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        {digits.map((digit, index) => (
          <input
            key={`otp-${index}`}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="text"
            inputMode="numeric"
            pattern="\d*"
            maxLength={1}
            value={digit}
            onChange={(event) => handleInput(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event.key)}
            disabled={disabled}
            className={cn(
              'h-12 w-11 rounded-sm border text-center text-lg font-semibold tracking-wide outline-none transition-all duration-200',
              'focus:border-primary focus:ring-2 focus:ring-primary/20',
              error ? 'border-danger focus:ring-danger/20' : 'border-border',
              disabled ? 'cursor-not-allowed bg-background text-text-disabled' : 'bg-surface text-text-primary'
            )}
          />
        ))}
      </div>
      {error ? <p className="mt-1.5 text-caption text-danger">{error}</p> : null}
    </div>
  );
}
