import { useContext } from "react";
import Link from "next/link";
import Image from "next/image";
import { IoClose } from "react-icons/io5";

//internal import
import { pages } from "@utils/data";
import { SidebarContext } from "@context/SidebarContext";
import CategoryDrawerItem from "@components/category/CategoryDrawerItem";
import useUtilsFunction from "@hooks/useUtilsFunction";

const CategoryDrawerSkeleton = () => (
  <div className="relative grid gap-2 p-6 animate-pulse" aria-hidden="true">
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="h-10 bg-gray-100 rounded-lg" />
    ))}
  </div>
);

const Category = () => {
  const {
    categoryDrawerOpen,
    closeCategoryDrawer,
    categoryTree,
    isCategoriesLoading,
  } = useContext(SidebarContext);
  const { showingTranslateValue } = useUtilsFunction();

  return (
    <div className="flex flex-col w-full bg-white cursor-pointer scrollbar-hide">
      {categoryDrawerOpen && (
        <div className="w-full flex justify-between items-center h-16 px-6 py-4 bg-white text-white border-b border-gray-100">
          <h2 className="font-semibold font-serif text-lg m-0 text-heading flex align-center">
            <Link href="/" className="mr-10">
              <Image
                width={100}
                height={38}
                src="/logo/full-logo.png"
                alt="Elecmoon"
              />
            </Link>
          </h2>
          <button
            onClick={closeCategoryDrawer}
            className="flex text-xl items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-[#EF4036] p-2 focus:outline-none transition-opacity hover:text-[#C53030]"
            aria-label="close"
          >
            <IoClose />
          </button>
        </div>
      )}
      <div className="w-full">
        {categoryDrawerOpen && (
          <h2 className="font-semibold font-serif text-lg m-0 text-heading flex align-center border-b px-8 py-3">
            All Categories
          </h2>
        )}
        {isCategoriesLoading ? (
          <CategoryDrawerSkeleton />
        ) : (
          <div className="relative grid gap-2 p-6">
            {(() => {
              const findMainCategories = (list) => {
                if (list?.length === 1) {
                  const name = showingTranslateValue(list[0].name)?.toLowerCase()?.trim();
                  if (name === "home" || name === "all categories" || name === "all departments" || !list[0].parentId) {
                    if (list[0].children && list[0].children.length > 0) {
                      return findMainCategories(list[0].children);
                    }
                  }
                }
                return list || [];
              };

              const filtered = findMainCategories(categoryTree).filter((cat) => {
                const name = showingTranslateValue(cat.name)?.toLowerCase()?.trim();
                return name !== "home" && name !== "all categories" && name !== "all departments" && name !== "";
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

        {categoryDrawerOpen && (
          <div className="relative grid gap-2 mt-5">
            <h3 className="font-semibold font-serif text-lg m-0 text-heading flex align-center border-b px-8 py-3">
              Pages
            </h3>
            <div className="relative grid gap-1 p-6">
              {pages.map((item) => (
                <a
                  key={item.title}
                  href={item.href}
                  className="p-2 flex font-serif items-center rounded-md hover:bg-gray-50 w-full hover:text-[#EF4036]"
                >
                  <item.icon
                    className="flex-shrink-0 h-4 w-4"
                    aria-hidden="true"
                  />
                  <p className="inline-flex items-center justify-between ml-2 text-sm font-medium w-full hover:text-[#EF4036]">
                    {item.title}
                  </p>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Category;
