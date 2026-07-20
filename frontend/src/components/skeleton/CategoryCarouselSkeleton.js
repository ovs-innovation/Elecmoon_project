const CategoryCarouselSkeleton = ({ count = 5 }) => (
  <div
    className="flex gap-4 overflow-hidden my-10 px-3 animate-pulse"
    aria-hidden="true"
  >
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="flex-shrink-0 w-56 sm:w-64 min-h-[248px] sm:min-h-[272px] bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm"
      >
        <div className="flex-[3] p-3 pb-1">
          <div className="aspect-[5/4] bg-gray-100 rounded-xl" />
        </div>
        <div className="px-4 py-3.5 border-t border-gray-50 space-y-2">
          <div className="h-3.5 bg-gray-100 rounded w-4/5" />
          <div className="h-2 bg-gray-50 rounded w-1/3" />
        </div>
      </div>
    ))}
  </div>
);

export default CategoryCarouselSkeleton;
