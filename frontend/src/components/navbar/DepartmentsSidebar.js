import Link from "next/link";
import Image from "next/image";
import { useContext, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FiChevronRight, FiGrid, FiMenu } from "react-icons/fi";
import { SidebarContext } from "@context/SidebarContext";
import useUtilsFunction from "@hooks/useUtilsFunction";
import { getCategorySearchUrl } from "@utils/categoryUrl";
import { isCloudinaryUrl, optimizeImageUrl } from "@utils/cloudinaryImage";
import BrandServices from "@services/BrandServices";

const CategoryIcon = ({ src, alt }) => {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <span className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
        <FiGrid className="w-3 h-3 text-gray-400" />
      </span>
    );
  }
  const imageSrc = optimizeImageUrl(src, { width: 48 });
  return (
    <span className="relative w-6 h-6 rounded bg-white border border-gray-100 overflow-hidden flex-shrink-0">
      <Image
        src={imageSrc}
        alt={alt || "Category"}
        fill
        sizes="24px"
        className="object-contain p-0.5"
        unoptimized={isCloudinaryUrl(imageSrc)}
        onError={() => setFailed(true)}
      />
    </span>
  );
};

/**
 * Always-visible All Departments sidebar — hover opens subcategory / brand panel.
 */
const DepartmentsSidebar = ({ className = "" }) => {
  const { categories, isCategoriesLoading } = useContext(SidebarContext);
  const { showingTranslateValue } = useUtilsFunction();
  const [activeCatId, setActiveCatId] = useState(null);
  const [brandPanel, setBrandPanel] = useState(false);

  const { data: brands = [] } = useQuery({
    queryKey: ["brands-show"],
    queryFn: () => BrandServices.getShowingBrands(),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const activeCat = categories?.find((c) => c._id === activeCatId);
  const activeChildren = activeCat?.children || [];
  const showFlyout = brandPanel || Boolean(activeCatId);

  return (
    <aside
      className={`relative hidden lg:flex flex-col w-[220px] xl:w-[240px] flex-shrink-0 self-stretch h-auto min-h-0 bg-white border border-gray-200 z-50 overflow-visible ${className}`}
      onMouseLeave={() => {
        setBrandPanel(false);
        setActiveCatId(null);
      }}
    >
      <div className="h-11 px-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-wider bg-[#ED1C24] text-white flex-shrink-0">
        <FiMenu className="w-4 h-4" />
        All Departments
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        <button
          type="button"
          onMouseEnter={() => {
            setBrandPanel(true);
            setActiveCatId(null);
          }}
          className={`w-full flex items-center justify-between px-3 py-2 text-left text-[10px] font-black uppercase tracking-wide border-b border-gray-50 ${
            brandPanel
              ? "bg-[#fff5f5] text-[#ED1C24]"
              : "text-[#0b1d3d] hover:bg-gray-50"
          }`}
        >
          Shop by Brand
          <FiChevronRight className="w-3.5 h-3.5 text-gray-400" />
        </button>

        {isCategoriesLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="px-3 py-2 animate-pulse">
                <div className="h-3 bg-gray-100 rounded w-3/4" />
              </div>
            ))
          : (categories || []).map((cat) => {
              const name = showingTranslateValue(cat.name);
              if (!name) return null;
              const hasKids = (cat.children || []).length > 0;
              const isActive = activeCatId === cat._id && !brandPanel;
              return (
                <div
                  key={cat._id}
                  onMouseEnter={() => {
                    setBrandPanel(false);
                    setActiveCatId(cat._id);
                  }}
                >
                  <Link
                    href={getCategorySearchUrl(cat._id, name, cat.slug)}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                      isActive
                        ? "bg-gray-50 text-[#0b1d3d]"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <CategoryIcon src={cat.icon} alt={name} />
                    <span className="flex-1 truncate uppercase tracking-wide text-[10px] font-bold">
                      {name}
                    </span>
                    {hasKids && (
                      <FiChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                    )}
                  </Link>
                </div>
              );
            })}
      </div>

      {/* Hover panel — same style as before (brands / subcategories) */}
      {showFlyout ? (
        <div className="absolute left-full top-0 bottom-0 w-72 xl:w-80 bg-white border border-gray-200 shadow-[0_16px_48px_rgba(0,0,0,0.14)] overflow-y-auto p-4 z-[60]">
          {brandPanel ? (
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-3">
                Brands
              </p>
              {brands.length === 0 ? (
                <p className="text-xs text-gray-400">
                  No brands yet. Add in Admin → Brands.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-1">
                  {brands.map((b) => (
                    <Link
                      key={b._id}
                      href={`/brand/${b.slug || b._id}`}
                      className="px-3 py-2 text-sm font-bold text-gray-700 hover:text-[#0b1d3d] hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      {b.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : activeChildren.length > 0 ? (
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-3">
                {showingTranslateValue(activeCat?.name)}
              </p>
              <div className="grid grid-cols-1 gap-1">
                {activeChildren.map((child) => {
                  const cName = showingTranslateValue(child.name);
                  if (!cName) return null;
                  return (
                    <Link
                      key={child._id}
                      href={getCategorySearchUrl(
                        child._id,
                        cName,
                        child.slug
                      )}
                      className="flex items-center gap-2 px-3 py-2 text-[12px] font-semibold text-gray-700 hover:text-[#0b1d3d] hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <CategoryIcon src={child.icon} alt={cName} />
                      <span className="truncate">{cName}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : activeCat ? (
            <div className="h-full flex flex-col items-start justify-center gap-3 px-2">
              <p className="text-[11px] font-black uppercase tracking-widest text-gray-400">
                {showingTranslateValue(activeCat.name)}
              </p>
              <Link
                href={getCategorySearchUrl(
                  activeCat._id,
                  showingTranslateValue(activeCat.name),
                  activeCat.slug
                )}
                className="text-sm font-bold text-[#ED1C24] hover:underline"
              >
                Browse all products →
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}
    </aside>
  );
};

export default DepartmentsSidebar;
