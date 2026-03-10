const ProductSkeleton = () => {
  return (
    <article className="bg-white rounded-md p-3 border border-gray-100 animate-pulse">
      <div className="relative aspect-square mb-3 rounded-md overflow-hidden bg-gray-200" />

      <div className="space-y-2 min-h-[40px]">
        <div className="h-3 bg-gray-200 rounded" />
        <div className="h-3 w-4/5 bg-gray-200 rounded" />
      </div>

      <div className="flex items-center gap-2 mt-2 mb-2">
        <div className="h-2.5 w-16 bg-gray-200 rounded" />
        <div className="h-2.5 w-14 bg-gray-200 rounded" />
      </div>

      <div className="h-4 w-20 bg-gray-200 rounded" />
      <div className="h-3 w-16 bg-gray-200 rounded mt-1" />

      <div className="mt-3 flex items-center justify-between">
        <div className="h-2.5 w-16 bg-gray-200 rounded" />
        <div className="h-2.5 w-12 bg-gray-200 rounded" />
      </div>
    </article>
  );
};

export default ProductSkeleton;
