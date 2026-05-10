import { cn } from '../../lib/cn';

export type ProductSkeletonVariant = 'grid' | 'list';

type ProductSkeletonProps = {
  variant?: ProductSkeletonVariant;
  className?: string;
};

const ProductSkeleton = ({ variant = 'grid', className }: ProductSkeletonProps) => {
  if (variant === 'list') {
    return (
      <article
        className={cn(
          'animate-pulse rounded-md border border-border bg-surface p-3',
          className
        )}
      >
        <div className="flex gap-3">
          <div className="h-24 w-24 flex-shrink-0 rounded-md bg-border" />
          <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
            <div className="space-y-2">
              <div className="h-3.5 w-full rounded bg-border" />
              <div className="h-3.5 w-[85%] rounded bg-border" />
              <div className="h-2.5 w-24 rounded bg-border" />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <div className="h-2.5 w-16 rounded bg-border" />
              <div className="h-2.5 w-14 rounded bg-border" />
            </div>
            <div className="mt-2 space-y-1">
              <div className="h-4 w-24 rounded bg-border" />
              <div className="h-3 w-16 rounded bg-border" />
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="h-2.5 w-20 rounded bg-border" />
              <div className="h-2.5 w-12 rounded bg-border" />
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      className={cn(
        'animate-pulse rounded-md border border-border bg-surface p-3',
        className
      )}
    >
      <div className="relative mb-3 aspect-square overflow-hidden rounded-md bg-border" />

      <div className="min-h-[40px] space-y-2">
        <div className="h-3 rounded bg-border" />
        <div className="h-3 w-4/5 rounded bg-border" />
      </div>

      <div className="mb-2 mt-2 flex items-center gap-2">
        <div className="h-2.5 w-16 rounded bg-border" />
        <div className="h-2.5 w-14 rounded bg-border" />
      </div>

      <div className="h-4 w-20 rounded bg-border" />
      <div className="mt-1 h-3 w-16 rounded bg-border" />

      <div className="mt-3 flex items-center justify-between">
        <div className="h-2.5 w-16 rounded bg-border" />
        <div className="h-2.5 w-12 rounded bg-border" />
      </div>
    </article>
  );
};

export default ProductSkeleton;
