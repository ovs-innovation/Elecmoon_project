import React, { useContext } from "react";
import Link from "next/link";
import { FiArrowRight, FiGrid } from "react-icons/fi";
import { SidebarContext } from "@context/SidebarContext";
import useUtilsFunction from "@hooks/useUtilsFunction";
import useCategoryPreviewImages from "@hooks/useCategoryPreviewImages";
import { getCategorySearchUrl } from "@utils/categoryUrl";
import CategoryCard from "@components/category/CategoryCard";
import { getCategoryCardImage } from "@utils/categoryDisplayImage";

const HomeCategoriesSection = () => {
  const { categories, isCategoriesLoading } = useContext(SidebarContext);
  const { showingTranslateValue } = useUtilsFunction();
  const previewImages = useCategoryPreviewImages();

  if (isCategoriesLoading) {
    return (
      <section id="categories" className="bg-gray-50 py-6 lg:py-8 scroll-mt-28">
        <div className="max-w-screen-2xl mx-auto px-3 sm:px-6 lg:px-10">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-5" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 sm:gap-4 lg:gap-5">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center py-2 animate-pulse">
                <div className="w-[100px] h-[100px] sm:w-[112px] sm:h-[112px] rounded-full bg-gray-100 border border-gray-50" />
                <div className="h-3 bg-gray-100 rounded w-16 mt-3" />
                <div className="h-2 bg-gray-50 rounded w-10 mt-1.5" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!categories?.length) return null;

  return (
    <section
      id="categories"
      className="bg-gray-50 py-6 lg:py-8 border-y border-gray-100 scroll-mt-28"
    >
      <div className="max-w-screen-2xl mx-auto px-3 sm:px-6 lg:px-10">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-2 rounded-full bg-[#0b1d3d]/5 text-[10px] font-black text-[#0b1d3d] uppercase tracking-[0.2em]">
              <FiGrid className="w-3 h-3" />
              Shop by Category
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Browse Our Product Categories
            </h2>
            <p className="text-gray-500 text-sm mt-1.5 max-w-xl">
              Batteries, BMS, cells and components — pick a category to see related products.
            </p>
          </div>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 text-[11px] font-black text-[#0b1d3d] hover:text-[#ED1C24] uppercase tracking-widest transition-colors whitespace-nowrap"
          >
            View All Products <FiArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 sm:gap-4 lg:gap-5">
          {categories.map((cat) => {
            const name = showingTranslateValue(cat.name);
            if (!name) return null;
            const href = getCategorySearchUrl(cat._id, name, cat.slug);
            const productImage = previewImages[String(cat._id)];
            const cardImage = getCategoryCardImage(cat, previewImages);
            const fromProduct = Boolean(productImage && productImage === cardImage);

            return (
              <CategoryCard
                key={cat._id}
                category={cat}
                name={name}
                imageSrc={cardImage}
                href={href}
                fromProduct={fromProduct}
                compact={categories.length >= 6}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default React.memo(HomeCategoriesSection);
