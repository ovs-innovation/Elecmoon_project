import Image from "next/image";
import { useRouter } from "next/router";
import { useContext, useState, useEffect } from "react";
import {
  IoChevronDownOutline,
  IoChevronForwardOutline,
  IoRemoveSharp,
} from "react-icons/io5";
import { FiArrowRight, FiPackage } from "react-icons/fi";

import { SidebarContext } from "@context/SidebarContext";
import useUtilsFunction from "@hooks/useUtilsFunction";
import { getCategorySearchUrl } from "@utils/categoryUrl";
import { isCloudinaryUrl, optimizeImageUrl } from "@utils/cloudinaryImage";

const CategoryDrawerItem = ({ title, icon, nested = [], id, slug }) => {
  const router = useRouter();
  const { closeCategoryDrawer } = useContext(SidebarContext);
  const { showingTranslateValue } = useUtilsFunction();

  const [show, setShow] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const navigateToCategory = (catId, categoryName, categorySlug) => {
    const url = getCategorySearchUrl(catId, categoryName, categorySlug);
    router.push(url);
    closeCategoryDrawer();
  };

  const handleCategoryClick = () => {
    if (nested && nested.length > 0) {
      setShow(!show);
    } else {
      navigateToCategory(id, title, slug);
    }
  };

  const hasKids = nested && nested.length > 0;
  const iconSrc = icon && !imgFailed ? optimizeImageUrl(icon, { width: 48 }) : null;

  return (
    <div className="relative group">
      <button
        type="button"
        onClick={handleCategoryClick}
        className={`p-2.5 flex items-center justify-between rounded-lg w-full transition-colors duration-200 text-left ${
          show ? "bg-red-50/50 text-[#ED1C24]" : "hover:bg-gray-50 text-gray-800 hover:text-[#0b1d3d]"
        }`}
        aria-expanded={hasKids ? show : undefined}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="relative w-6 h-6 rounded bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
            {iconSrc ? (
              <Image
                src={iconSrc}
                alt={title || "Category"}
                fill
                sizes="24px"
                className="object-contain p-0.5"
                unoptimized={isCloudinaryUrl(iconSrc)}
                onError={() => setImgFailed(true)}
              />
            ) : (
              <FiPackage className="w-3.5 h-3.5 text-gray-400" />
            )}
          </div>

          <span className="truncate text-xs font-bold uppercase tracking-wide">
            {title}
          </span>
        </div>

        {hasKids ? (
          <span className="text-gray-400 ml-2 flex-shrink-0">
            {show ? (
              <IoChevronDownOutline className="w-4 h-4 text-[#ED1C24]" />
            ) : (
              <IoChevronForwardOutline className="w-4 h-4" />
            )}
          </span>
        ) : null}
      </button>

      {/* Expanded Subcategories Accordion */}
      {show && hasKids ? (
        <div className="border-l-2 border-red-100 ml-5 pl-2 my-1 space-y-1">
          {/* View All Parent Category Products */}
          <button
            type="button"
            onClick={() => navigateToCategory(id, title, slug)}
            className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-black uppercase tracking-wider text-[#ED1C24] hover:bg-red-50/80 rounded-md transition-colors text-left"
          >
            <span>View All {title} Products</span>
            <FiArrowRight className="w-3.5 h-3.5" />
          </button>

          {/* Subcategories list */}
          <ul className="space-y-0.5">
            {nested.map((child) => {
              const cName = showingTranslateValue(child.name);
              if (!cName) return null;
              return (
                <li key={child._id}>
                  <button
                    type="button"
                    onClick={() => navigateToCategory(child._id, cName, child.slug)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-gray-700 hover:text-[#0b1d3d] hover:bg-gray-50 rounded-md transition-colors text-left"
                  >
                    <span className="truncate">{cName}</span>
                    <IoChevronForwardOutline className="w-3 h-3 text-gray-300 flex-shrink-0" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
};

export default CategoryDrawerItem;
