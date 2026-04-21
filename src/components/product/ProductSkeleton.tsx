const ProductSkeleton = () => {
  return (
    <article className="animate-pulse rounded-md border border-border bg-surface p-3">
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
