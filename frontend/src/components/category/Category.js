import { useContext, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { IoClose } from "react-icons/io5";
import { FiTag, FiChevronDown, FiChevronRight } from "react-icons/fi";
import { useQuery } from "@tanstack/react-query";

//internal import
import { pages } from "@utils/data";
import { SidebarContext } from "@context/SidebarContext";
import CategoryDrawerItem from "@components/category/CategoryDrawerItem";
import useUtilsFunction from "@hooks/useUtilsFunction";
import BrandServices from "@services/BrandServices";

const CategoryDrawerSkeleton = () => (
  <div className="relative grid gap-2 p-4 animate-pulse" aria-hidden="true">
    {Array.from({ length: 7 }).map((_, i) => (
      <div key={i} className="h-9 bg-gray-100 rounded-lg" />
    ))}
  </div>
);

const Category = () => {
  const router = useRouter();
  const {
    categoryDrawerOpen,
    closeCategoryDrawer,
    categoryTree,
    isCategoriesLoading,
  } = useContext(SidebarContext);
  const { showingTranslateValue } = useUtilsFunction();
  const [brandsExpanded, setBrandsExpanded] = useState(false);

  const { data: brands = [] } = useQuery({
    queryKey: ["brands-show"],
    queryFn: () => BrandServices.getShowingBrands(),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const navigateTo = (url) => {
    router.push(url);
    closeCategoryDrawer();
  };

  return (
    <div className="flex flex-col w-full bg-white h-full overflow-y-auto scrollbar-hide">
      {/* Drawer Header */}
      <div className="w-full flex justify-between items-center h-14 px-5 bg-white border-b border-gray-100 flex-shrink-0">
        <Link href="/" onClick={closeCategoryDrawer}>
          <Image
            width={95}
            height={36}
            src="/logo/full-logo.png"
            alt="Elecmoon"
            className="object-contain"
          />
        </Link>
        <button
          onClick={closeCategoryDrawer}
          className="flex text-lg items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-700 hover:text-[#ED1C24] transition-colors"
          aria-label="Close menu"
        >
          <IoClose />
        </button>
      </div>

      <div className="flex-1 py-3 px-4">
        {/* Categories Section Heading */}
        <div className="px-2 py-1.5 flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
            Departments & Categories
          </span>
        </div>

        {isCategoriesLoading ? (
          <CategoryDrawerSkeleton />
        ) : (
          <div className="relative space-y-1">
            {(() => {
              const findMainCategories = (list) => {
                if (list?.length === 1) {
                  const name = showingTranslateValue(list[0].name)?.toLowerCase()?.trim();
                  if (
                    name === "home" ||
                    name === "all categories" ||
                    name === "all departments" ||
                    !list[0].parentId
                  ) {
                    if (list[0].children && list[0].children.length > 0) {
                      return findMainCategories(list[0].children);
                    }
                  }
                }
                return list || [];
              };

              const filtered = findMainCategories(categoryTree).filter((cat) => {
                const name = showingTranslateValue(cat.name)?.toLowerCase()?.trim();
                return (
                  name !== "home" &&
                  name !== "all categories" &&
                  name !== "all departments" &&
                  name !== ""
                );
              });

              return filtered.map((category) => (
                <CategoryDrawerItem
                  key={category._id}
                  id={category._id}
                  icon={category.icon}
                  nested={category.children}
                  title={showingTranslateValue(category?.name)}
                  slug={category.slug}
                />
              ));
            })()}
          </div>
        )}

        {/* Dedicated Shop by Brand Section */}
        {brands.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="px-2 pb-1.5">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                Brands
              </span>
            </div>

            <button
              type="button"
              onClick={() => setBrandsExpanded((prev) => !prev)}
              className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-colors ${
                brandsExpanded
                  ? "bg-red-50/50 text-[#ED1C24]"
                  : "text-gray-800 hover:bg-gray-50 hover:text-[#0b1d3d]"
              }`}
              aria-expanded={brandsExpanded}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center text-gray-500">
                  <FiTag className="w-3.5 h-3.5" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wide">
                  Shop by Brand
                </span>
              </div>
              <FiChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  brandsExpanded ? "rotate-180 text-[#ED1C24]" : "text-gray-400"
                }`}
              />
            </button>

            {brandsExpanded && (
              <div className="border-l-2 border-red-100 ml-5 pl-2 my-1 space-y-1">
                {brands.map((brand) => (
                  <button
                    key={brand._id}
                    type="button"
                    onClick={() =>
                      navigateTo(`/brand/${brand.slug || brand._id}`)
                    }
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-gray-700 hover:text-[#0b1d3d] hover:bg-gray-50 rounded-md transition-colors text-left"
                  >
                    <span className="truncate">{brand.name}</span>
                    <FiChevronRight className="w-3 h-3 text-gray-300" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pages Section */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="px-2 pb-1.5">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
              Quick Links
            </span>
          </div>
          <div className="space-y-0.5">
            {pages.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                onClick={closeCategoryDrawer}
                className="p-2 flex items-center rounded-lg hover:bg-gray-50 w-full text-gray-600 hover:text-[#ED1C24] text-xs font-semibold transition-colors"
              >
                <item.icon className="flex-shrink-0 h-3.5 w-3.5 mr-2.5 text-gray-400" />
                <span>{item.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Category;
