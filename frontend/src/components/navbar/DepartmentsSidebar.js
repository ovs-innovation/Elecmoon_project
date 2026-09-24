import Link from "next/link";
import Image from "next/image";
import { useContext, useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { FiChevronRight, FiGrid, FiMenu, FiTag } from "react-icons/fi";
import { SidebarContext } from "@context/SidebarContext";
import useUtilsFunction from "@hooks/useUtilsFunction";
import useCategoryPreviewImages from "@hooks/useCategoryPreviewImages";
import { getCategorySearchUrl } from "@utils/categoryUrl";
import { isCloudinaryUrl, optimizeImageUrl } from "@utils/cloudinaryImage";
import BrandServices from "@services/BrandServices";
import CategoryFlyoutPanel from "./CategoryFlyoutPanel";
import BrandFlyoutPanel from "./BrandFlyoutPanel";

const CategoryIcon = ({ src, alt }) => {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <span className="w-6 h-6 rounded-md bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
        <FiGrid className="w-3.5 h-3.5 text-gray-400" />
      </span>
    );
  }
  const imageSrc = optimizeImageUrl(src, { width: 56 });
  return (
    <span className="relative w-6 h-6 rounded-md bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
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

const formatCategoryDisplay = (rawName) => {
  if (!rawName) return "";
  const trimmed = rawName.trim();
  if (trimmed === trimmed.toUpperCase()) {
    return trimmed
      .toLowerCase()
      .split(" ")
      .map((word) => {
        if (word === "and") return "&";
        if (word === "bms") return "BMS";
        if (word === "or" || word === "of" || word === "in") return word;
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(" ");
  }
  return trimmed.replace(/\bAnd\b/g, "&");
};

/**
 * All Departments sidebar:
 * - Completely contained within sidebar bounds (no elements sticking outside)
 * - Zero scrollbar
 * - Categories with subcategories show `>` and open CategoryFlyoutPanel on hover
 * - Categories without subcategories do NOT show `>` and navigate directly to products on click
 * - Shop by Brand cleanly placed inside the sidebar container with divider and tag icon
 */
const DepartmentsSidebar = ({ className = "" }) => {
  const { categories, isCategoriesLoading } = useContext(SidebarContext);
  const { showingTranslateValue } = useUtilsFunction();
  const previewImages = useCategoryPreviewImages();

  const [activeCatId, setActiveCatId] = useState(null);
  const [brandPanelOpen, setBrandPanelOpen] = useState(false);
  const leaveTimerRef = useRef(null);

  const { data: brands = [], isLoading: isBrandsLoading } = useQuery({
    queryKey: ["brands-show"],
    queryFn: () => BrandServices.getShowingBrands(),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const clearLeaveTimer = useCallback(() => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
  }, []);

  const handleMouseEnterContainer = useCallback(() => {
    clearLeaveTimer();
  }, [clearLeaveTimer]);

  const handleMouseLeaveContainer = useCallback(() => {
    clearLeaveTimer();
    leaveTimerRef.current = setTimeout(() => {
      setActiveCatId(null);
      setBrandPanelOpen(false);
    }, 150);
  }, [clearLeaveTimer]);

  const handleCategoryHover = useCallback(
    (cat) => {
      clearLeaveTimer();
      const hasKids = (cat.children || []).length > 0;
      if (hasKids) {
        setBrandPanelOpen(false);
        setActiveCatId(cat._id);
      } else {
        setBrandPanelOpen(false);
        setActiveCatId(null);
      }
    },
    [clearLeaveTimer]
  );

  const handleBrandHover = useCallback(() => {
    clearLeaveTimer();
    setActiveCatId(null);
    setBrandPanelOpen(true);
  }, [clearLeaveTimer]);

  const closeAllPanels = useCallback(() => {
    clearLeaveTimer();
    setActiveCatId(null);
    setBrandPanelOpen(false);
  }, [clearLeaveTimer]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        closeAllPanels();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearLeaveTimer();
    };
  }, [closeAllPanels, clearLeaveTimer]);

  const activeCat = categories?.find((c) => c._id === activeCatId);
  const hasActiveFlyout = brandPanelOpen || (activeCat && (activeCat.children || []).length > 0);

  return (
    <aside
      className={`relative hidden lg:flex flex-col w-[250px] xl:w-[265px] flex-shrink-0 self-stretch min-h-full bg-white border border-gray-200 z-50 overflow-visible ${className}`}
      onMouseEnter={handleMouseEnterContainer}
      onMouseLeave={handleMouseLeaveContainer}
      aria-label="Departments Navigation"
    >
      {/* Red Header Bar */}
      <div className="h-10 px-3.5 flex items-center gap-2 text-[11.5px] font-black uppercase tracking-wider bg-[#ED1C24] text-white flex-shrink-0 select-none">
        <FiMenu className="w-4 h-4" />
        <span>All Departments</span>
      </div>

      {/* Main navigation list — balanced layout, no bottom void */}
      <div className="flex-1 min-h-0 flex flex-col justify-between py-2 overflow-visible">
        {/* Categories Section */}
        <div className="space-y-0.5">
          <div className="px-3.5 pb-1">
            <span className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400 select-none">
              Categories
            </span>
          </div>

          {isCategoriesLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="px-3.5 py-1.5 flex items-center gap-2.5 animate-pulse">
                  <div className="w-6 h-6 bg-gray-100 rounded-md flex-shrink-0" />
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                </div>
              ))
            : (categories || []).map((cat) => {
                const rawName = showingTranslateValue(cat.name);
                if (!rawName) return null;
                const displayName = formatCategoryDisplay(rawName);
                const hasKids = (cat.children || []).length > 0;
                const isActive = activeCatId === cat._id && !brandPanelOpen;
                const href = getCategorySearchUrl(cat._id, rawName, cat.slug);

                return (
                  <div
                    key={cat._id}
                    onMouseEnter={() => handleCategoryHover(cat)}
                    onFocus={() => handleCategoryHover(cat)}
                  >
                    <Link
                      href={href}
                      onClick={closeAllPanels}
                      className={`group w-full flex items-center gap-2.5 px-3.5 py-1.5 text-[12.5px] font-semibold transition-all ${
                        isActive
                          ? "bg-[#fff5f5] text-[#ED1C24]"
                          : "text-gray-800 hover:bg-gray-50 hover:text-[#0b1d3d]"
                      }`}
                      aria-haspopup={hasKids ? "true" : "false"}
                      aria-expanded={isActive ? "true" : "false"}
                      title={displayName}
                    >
                      <CategoryIcon src={cat.icon} alt={displayName} />
                      <span className="flex-1 truncate tracking-tight">
                        {displayName}
                      </span>
                      {hasKids ? (
                        <FiChevronRight
                          className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${
                            isActive
                              ? "text-[#ED1C24] translate-x-0.5"
                              : "text-gray-300 group-hover:text-gray-500"
                          }`}
                        />
                      ) : null}
                    </Link>
                  </div>
                );
              })}
        </div>

        {/* Distinct Shop by Brand Section at the bottom */}
        {brands.length > 0 && (
          <div className="pt-2 border-t border-gray-100">
            <div className="px-3.5 pb-1">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400 select-none">
                Shop by Brand
              </span>
            </div>

            <button
              type="button"
              onMouseEnter={handleBrandHover}
              onFocus={handleBrandHover}
              onClick={() => setBrandPanelOpen((prev) => !prev)}
              className={`w-full flex items-center justify-between px-3.5 py-1.5 text-left text-[12.5px] font-semibold transition-all group ${
                brandPanelOpen
                  ? "bg-[#fff5f5] text-[#ED1C24]"
                  : "text-gray-800 hover:bg-gray-50 hover:text-[#0b1d3d]"
              }`}
              aria-haspopup="true"
              aria-expanded={brandPanelOpen ? "true" : "false"}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 transition-colors ${
                    brandPanelOpen
                      ? "bg-[#ED1C24]/10 text-[#ED1C24]"
                      : "bg-gray-50 border border-gray-100 text-[#0b1d3d] group-hover:text-[#ED1C24]"
                  }`}
                >
                  <FiTag className="w-3.5 h-3.5" />
                </span>
                <span className="truncate tracking-tight font-semibold">
                  Shop by Brand
                </span>
              </div>
              <FiChevronRight
                className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${
                  brandPanelOpen
                    ? "text-[#ED1C24] translate-x-0.5"
                    : "text-gray-300 group-hover:text-gray-500"
                }`}
              />
            </button>
          </div>
        )}
      </div>

      {/* Flyout Mega Panel */}
      {hasActiveFlyout ? (
        brandPanelOpen ? (
          <BrandFlyoutPanel
            brands={brands}
            isLoading={isBrandsLoading}
            onClose={closeAllPanels}
          />
        ) : activeCat && (activeCat.children || []).length > 0 ? (
          <CategoryFlyoutPanel
            category={activeCat}
            previewImages={previewImages}
            onClose={closeAllPanels}
          />
        ) : null
      ) : null}
    </aside>
  );
};

export default DepartmentsSidebar;
