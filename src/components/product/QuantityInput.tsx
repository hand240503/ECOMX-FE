import { cn } from '../../lib/cn';

type QuantityInputProps = {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  disabled?: boolean;
  className?: string;
};

export function QuantityInput({
  value,
  onChange,
  min = 1,
  disabled,
  className,
}: QuantityInputProps) {
  const dec = () => {
    if (disabled) return;
    onChange(Math.max(min, value - 1));
  };

  const inc = () => {
    if (disabled) return;
    onChange(value + 1);
  };

  const onInput = (raw: string) => {
    if (disabled) return;
    const n = Number.parseInt(raw, 10);
    if (!Number.isFinite(n)) return;
    onChange(Math.max(min, n));
  };

  return (
    <div
      className={cn(
        'inline-flex h-11 items-stretch overflow-hidden rounded-lg border border-border bg-surface shadow-sm',
        disabled && 'opacity-50',
        className
      )}
    >
      <button
        type="button"
        onClick={dec}
        disabled={disabled || value <= min}
        className="w-10 text-lg font-medium text-text-primary transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed"
        aria-label="Giảm số lượng"
      >
        −
      </button>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        disabled={disabled}
        onChange={(e) => onInput(e.target.value)}
        className="w-12 border-x border-border bg-surface text-center text-body text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
        aria-label="Số lượng"
      />
      <button
        type="button"
        onClick={inc}
        disabled={disabled}
        className="w-10 text-lg font-medium text-text-primary transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed"
        aria-label="Tăng số lượng"
      >
        +
      </button>
    </div>
  );
}
