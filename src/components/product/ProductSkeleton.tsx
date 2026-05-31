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
          'animate-pulse rounded-[20px] border border-[#F0F0F5] bg-white p-4',
          'shadow-[0_2px_12px_rgba(0,0,0,0.06)]',
          className
        )}
      >
        <div className="flex gap-4">
          <div className="h-24 w-24 flex-shrink-0 rounded-2xl bg-[#f0f0f8]" />
          <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
            <div className="space-y-2">
              <div className="h-3.5 w-full rounded-lg bg-[#f0f0f8]" />
              <div className="h-3.5 w-[80%] rounded-lg bg-[#f0f0f8]" />
              <div className="h-2.5 w-20 rounded-lg bg-[#f0f0f8]" />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-2.5 w-20 rounded-lg bg-[#f0f0f8]" />
              <div className="h-2.5 w-16 rounded-lg bg-[#f0f0f8]" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <div className="h-4 w-24 rounded-lg bg-[#f0d0d5]" />
              <div className="h-3 w-16 rounded-lg bg-[#f0f0f8]" />
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      className={cn(
        'animate-pulse rounded-[20px] border border-[#F0F0F5] bg-white',
        'shadow-[0_2px_12px_rgba(0,0,0,0.06)]',
        className
      )}
    >
      {/* Image area */}
      <div className="relative overflow-hidden rounded-t-[20px] bg-gradient-to-br from-[#f5f5fa] to-[#ebebf5] pt-[100%]">
        <div className="absolute left-3 top-3 h-6 w-14 rounded-xl bg-[#e8d0d3]" />
        <div className="absolute right-3 top-3 h-8 w-8 rounded-full bg-[#e8e8f0]" />
      </div>

      {/* Content */}
      <div className="flex flex-col px-3.5 pb-3.5 pt-3">
        <div className="h-2 w-16 rounded bg-[#ebebf5]" />
        <div className="mt-1.5 space-y-2">
          <div className="h-3.5 w-full rounded-lg bg-[#f0f0f8]" />
          <div className="h-3.5 w-[75%] rounded-lg bg-[#f0f0f8]" />
        </div>

        {/* Stars */}
        <div className="mt-2 flex items-center gap-1.5">
          <div className="h-3 w-[60px] rounded-full bg-[#f5e8cc]" />
          <div className="h-2.5 w-20 rounded-lg bg-[#f0f0f8]" />
        </div>

        {/* Spec chips */}
        <div className="mt-2 flex gap-1">
          {[40, 52, 44].map(w => (
            <div key={w} className="h-5 rounded-lg bg-[#f0f0f8]" style={{ width: w }} />
          ))}
        </div>

        {/* Price */}
        <div className="mt-3 flex items-baseline gap-2">
          <div className="h-5 w-28 rounded-lg bg-[#f0c0c5]" />
          <div className="h-3.5 w-16 rounded-lg bg-[#f0f0f8]" />
        </div>

        {/* Button */}
        <div className="mt-3 h-10 w-full rounded-xl bg-[#f0c0c5]" />
      </div>
    </article>
  );
};

export default ProductSkeleton;
