import React from "react";
import Link from "next/link";
import { FiArrowRight, FiLayers } from "react-icons/fi";
import useUtilsFunction from "@hooks/useUtilsFunction";
import { getCategorySearchUrl } from "@utils/categoryUrl";
import SubcategoryCard from "./SubcategoryCard";

const CategoryFlyoutPanel = ({
  category,
  previewImages = {},
  onClose,
}) => {
  const { showingTranslateValue } = useUtilsFunction();

  if (!category) return null;

  const categoryName = showingTranslateValue(category.name);
  const categoryDescription = showingTranslateValue(category.description);
  const children = category.children || [];
  const viewAllUrl = getCategorySearchUrl(
    category._id,
    categoryName,
    category.slug
  );

  const isSingleChild = children.length === 1;

  return (
    <div
      className={`absolute left-full top-0 w-[480px] xl:w-[560px] bg-white border border-gray-200 shadow-[0_20px_50px_rgba(11,29,61,0.16)] rounded-r-2xl z-[70] p-4 sm:p-5 flex flex-col transition-all duration-200 ${
        isSingleChild ? "min-h-[190px] max-h-[320px] h-auto" : "min-h-[280px] max-h-[460px] h-auto"
      }`}
      role="region"
      aria-label={`${categoryName} subcategories`}
    >
      {/* Invisible hit bridge extending 12px to the left to prevent gap jitter */}
      <div
        className="absolute -left-3 top-0 bottom-0 w-3 pointer-events-auto"
        aria-hidden="true"
      />

      {/* Top Header */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-gray-100">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#0b1d3d]/5 text-[9px] font-black text-[#0b1d3d] uppercase tracking-[0.16em]">
              <FiLayers className="w-2.5 h-2.5" />
              Category
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-[#0b1d3d] tracking-tight leading-snug line-clamp-1">
            {categoryName}
          </h3>
          {categoryDescription ? (
            <p className="text-[11px] text-gray-500 line-clamp-2 mt-1 leading-relaxed">
              {categoryDescription}
            </p>
          ) : (
            <p className="text-[11px] text-gray-400 mt-0.5">
              Explore specialized products and subcategories in this collection.
            </p>
          )}
        </div>

        <Link
          href={viewAllUrl}
          onClick={onClose}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#fff5f5] hover:bg-[#ffebeb] text-[#ED1C24] text-[11px] font-black uppercase tracking-wider transition-colors whitespace-nowrap flex-shrink-0"
        >
          View All Products
          <FiArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Subcategories Section */}
      <div className="mt-3 flex-1 min-h-0 flex flex-col">
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">
            Subcategories ({children.length})
          </p>
          <span className="text-[10px] text-gray-400">
            Select a subcategory to filter products
          </span>
        </div>

        {isSingleChild ? (
          /* Clean, compact presentation when there's only 1 subcategory */
          <div className="space-y-3 py-1">
            {(() => {
              const child = children[0];
              const cName = showingTranslateValue(child.name);
              const cDesc = showingTranslateValue(child.description);
              return (
                <SubcategoryCard
                  key={child._id}
                  subcategory={child}
                  name={cName}
                  description={cDesc}
                  previewImage={previewImages[String(child._id)]}
                  onClick={onClose}
                />
              );
            })()}

            <div className="pt-2 flex items-center justify-between text-[11px] text-gray-500 bg-gray-50/70 p-2.5 rounded-lg border border-gray-100">
              <span>Looking for all {categoryName} items?</span>
              <Link
                href={viewAllUrl}
                onClick={onClose}
                className="font-bold text-[#ED1C24] hover:underline inline-flex items-center gap-1"
              >
                Browse Entire Category →
              </Link>
            </div>
          </div>
        ) : (
          /* Multi-subcategory 2-column grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
            {children.map((child) => {
              const cName = showingTranslateValue(child.name);
              if (!cName) return null;
              const cDesc = showingTranslateValue(child.description);
              return (
                <SubcategoryCard
                  key={child._id}
                  subcategory={child}
                  name={cName}
                  description={cDesc}
                  previewImage={previewImages[String(child._id)]}
                  onClick={onClose}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(CategoryFlyoutPanel);
