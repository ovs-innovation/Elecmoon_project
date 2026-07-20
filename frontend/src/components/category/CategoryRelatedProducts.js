import ProductCard from "@components/product/ProductCard";
import { PRODUCT_GRID_CLASS, PRODUCT_GRID_ITEM_CLASS } from "@utils/productGrid";

const CategoryRelatedProducts = ({
  products = [],
  attributes,
  categoryTitle,
  sortedField,
  onSortChange,
  visibleCount,
  onLoadMore,
  onEnquire,
  sortOptions,
  totalLabel,
  loadMoreLabel,
}) => {
  if (!products?.length) return null;

  const visible = products.slice(0, visibleCount);
  const hasMore = products.length > visibleCount;

  return (
    <section className="mt-2">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
        <div>
          <p className="text-[10px] font-black text-[#ED1C24] uppercase tracking-[0.2em] mb-1">
            Related Products
          </p>
          <h2 className="text-xl sm:text-2xl font-black text-[#0b1d3d] tracking-tight">
            {categoryTitle}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {totalLabel}{" "}
            <span className="font-bold text-[#0b1d3d]">{products.length}</span> items
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <label
            htmlFor="category-related-sort"
            className="text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap"
          >
            Sort By
          </label>
          <select
            id="category-related-sort"
            value={sortedField}
            onChange={(e) => onSortChange(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#0b1d3d]/20 focus:border-[#0b1d3d] min-w-[160px]"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value || "default"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={PRODUCT_GRID_CLASS}>
        {visible.map((product, i) => (
          <div key={product._id || i} className={PRODUCT_GRID_ITEM_CLASS}>
            <ProductCard
              product={product}
              attributes={attributes}
              onEnquire={onEnquire}
              overrideCategoryName={categoryTitle}
            />
          </div>
        ))}
      </div>

      {hasMore ? (
        <div className="flex justify-center mt-10 pb-4">
          <button
            type="button"
            onClick={onLoadMore}
            className="bg-white border-2 border-[#0b1d3d] text-[#0b1d3d] hover:bg-[#0b1d3d] hover:text-white px-8 py-3 rounded-full font-bold transition-all duration-300 text-sm active:scale-95 shadow-md"
          >
            {loadMoreLabel}
          </button>
        </div>
      ) : null}
    </section>
  );
};

export default CategoryRelatedProducts;
