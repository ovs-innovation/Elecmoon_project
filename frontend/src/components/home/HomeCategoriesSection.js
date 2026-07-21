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
      <section id="categories" className="bg-gray-50 py-10 lg:py-14 scroll-mt-28">
        <div className="max-w-screen-2xl mx-auto px-3 sm:px-6 lg:px-10">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-8" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 sm:gap-4 lg:gap-5">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="min-h-[248px] bg-white rounded-2xl animate-pulse border border-gray-100 overflow-hidden"
              >
                <div className="p-3 pb-1">
                  <div className="aspect-[5/4] bg-gray-100 rounded-xl" />
                </div>
                <div className="px-4 py-3 border-t border-gray-50">
                  <div className="h-3 bg-gray-100 rounded w-3/4 mb-2" />
                  <div className="h-2 bg-gray-50 rounded w-1/3" />
                </div>
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
      className="bg-gray-50 py-10 lg:py-14 border-y border-gray-100 scroll-mt-28"
    >
      <div className="max-w-screen-2xl mx-auto px-3 sm:px-6 lg:px-10">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 rounded-full bg-[#0b1d3d]/5 text-[10px] font-black text-[#0b1d3d] uppercase tracking-[0.2em]">
              <FiGrid className="w-3 h-3" />
              Shop by Category
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Browse Our Product Categories
            </h2>
            <p className="text-gray-500 text-sm mt-2 max-w-xl">
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
