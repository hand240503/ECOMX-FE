import { Star } from 'lucide-react';
import { cn } from '../../lib/cn';

type RatingStarsProps = {
  value: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const sizeMap = {
  sm: 11,
  md: 14,
  lg: 20,
} as const;

export function RatingStars({ value, size = 'sm', className }: RatingStarsProps) {
  const rounded = Math.min(5, Math.max(0, Math.round(value)));
  const px = sizeMap[size];

  return (
    <div className={cn('flex items-center gap-0.5', className)} aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={px}
          className={cn(
            i < rounded ? 'fill-warning text-warning' : 'fill-none text-border'
          )}
          strokeWidth={i < rounded ? 0 : 2}
        />
      ))}
    </div>
  );
}
