import { useState, useMemo } from "react";
import Link from "next/link";
import { FiChevronRight, FiPackage } from "react-icons/fi";
import useUtilsFunction from "@hooks/useUtilsFunction";
import CategoryImage from "@components/common/CategoryImage";
import { getCategoryCardImage } from "@utils/categoryDisplayImage";

const DESCRIPTION_PREVIEW = 160;

const CategoryPageHeader = ({
  category,
  categoryTitle,
  productCount,
  previewImages = {},
  featuredImage,
}) => {
  const { showingTranslateValue } = useUtilsFunction();
  const [expanded, setExpanded] = useState(false);

  const description = useMemo(() => {
    const raw = showingTranslateValue(category?.description);
    return (raw || "").trim();
  }, [category?.description, showingTranslateValue]);

  const isLong = description.length > DESCRIPTION_PREVIEW;
  const displayText =
    expanded || !isLong
      ? description
      : `${description.slice(0, DESCRIPTION_PREVIEW).trim()}…`;

  const heroImage =
    featuredImage || getCategoryCardImage(category, previewImages);

  return (
    <div className="mb-6">
      <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-3 flex-wrap">
        <Link href="/" className="hover:text-[#ED1C24] transition-colors">
          Home
        </Link>
        <FiChevronRight className="w-3 h-3 flex-shrink-0" />
        <Link href="/search" className="hover:text-[#ED1C24] transition-colors">
          Products
        </Link>
        <FiChevronRight className="w-3 h-3 flex-shrink-0" />
        <span className="text-gray-600 font-semibold truncate max-w-[200px] sm:max-w-none">
          {categoryTitle}
        </span>
      </nav>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
        {heroImage ? (
          <div className="flex-shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm">
            <CategoryImage
              src={heroImage}
              alt={categoryTitle}
              className="w-full h-full rounded-none"
              aspectClass="aspect-square"
              imageClassName="object-contain p-2"
              sizes="112px"
              optimizeWidth={224}
              priority
            />
          </div>
        ) : null}

        <div className="min-w-0 flex-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 mb-2 rounded-full bg-[#0b1d3d]/5 text-[10px] font-black text-[#0b1d3d] uppercase tracking-[0.15em]">
            <FiPackage className="w-3 h-3" />
            Category
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0b1d3d] tracking-tight leading-tight">
            {categoryTitle}
          </h1>
          <p className="text-sm font-semibold text-[#ED1C24] mt-1">
            {productCount} related product{productCount === 1 ? "" : "s"}
          </p>
          {description ? (
            <div className="mt-2">
              <p
                className={`text-xs sm:text-sm text-gray-500 leading-relaxed ${
                  expanded ? "line-clamp-none" : "line-clamp-2 sm:line-clamp-none"
                }`}
              >
                {displayText}
              </p>
              {isLong ? (
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="mt-1 text-[10px] font-bold text-[#0b1d3d] hover:text-[#ED1C24] uppercase tracking-wide"
                >
                  {expanded ? "Show less" : "Read more"}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default CategoryPageHeader;
