import { useEffect, useMemo, useRef } from 'react';

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
            className={`h-12 w-11 text-center rounded-xl border text-lg font-semibold tracking-wide outline-none focus:ring-2 ${
              error ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-rose-500'
            } ${disabled ? 'bg-slate-100 cursor-not-allowed' : ''}`}
          />
        ))}
      </div>
      {error ? <p className="mt-1.5 text-xs text-red-500">{error}</p> : null}
    </div>
  );
}
