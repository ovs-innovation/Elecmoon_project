import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FiArrowRight, FiChevronRight, FiTag } from "react-icons/fi";
import { isCloudinaryUrl, optimizeImageUrl } from "@utils/cloudinaryImage";

const BrandCard = ({ brand, onClick }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const showLogo = brand?.logo && !imgFailed;
  const logoSrc = showLogo ? optimizeImageUrl(brand.logo, { width: 96 }) : null;

  return (
    <Link
      href={`/brand/${brand.slug || brand._id}`}
      onClick={onClick}
      className="group relative flex items-center gap-3 p-3 bg-white hover:bg-[#fff5f5] rounded-xl border border-gray-100 hover:border-[#ED1C24]/30 hover:shadow-[0_4px_16px_rgba(11,29,61,0.06)] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ED1C24]"
    >
      <div className="relative w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-xs text-[#0b1d3d] group-hover:bg-[#ED1C24]/10 group-hover:text-[#ED1C24] transition-colors">
        {logoSrc ? (
          <Image
            src={logoSrc}
            alt={brand.name || "Brand"}
            fill
            sizes="40px"
            className="object-contain p-1 group-hover:scale-105 transition-transform duration-300"
            unoptimized={isCloudinaryUrl(logoSrc)}
            onError={() => setImgFailed(true)}
          />
        ) : (
          <FiTag className="w-4 h-4 text-gray-400 group-hover:text-[#ED1C24] transition-colors" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="text-[13px] font-bold text-[#0b1d3d] group-hover:text-[#ED1C24] transition-colors line-clamp-1 leading-snug">
          {brand.name}
        </h4>
        {brand.description ? (
          <p className="text-[10.5px] text-gray-500 line-clamp-1 mt-0.5 leading-normal">
            {brand.description}
          </p>
        ) : null}
      </div>

      <FiChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#ED1C24] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
    </Link>
  );
};

const BrandFlyoutPanel = ({ brands = [], isLoading = false, onClose }) => {
  return (
    <div
      className="absolute left-full top-0 w-[480px] xl:w-[560px] bg-white border border-gray-200 shadow-[0_20px_50px_rgba(11,29,61,0.16)] rounded-r-2xl z-[70] p-4 sm:p-5 flex flex-col min-h-[280px] max-h-[460px] h-auto transition-all duration-200"
      role="region"
      aria-label="Shop by Brand"
    >
      {/* Invisible hit bridge extending 12px to the left */}
      <div
        className="absolute -left-3 top-0 bottom-0 w-3 pointer-events-auto"
        aria-hidden="true"
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-gray-100">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#0b1d3d]/5 text-[9px] font-black text-[#0b1d3d] uppercase tracking-[0.16em]">
              <FiTag className="w-2.5 h-2.5" />
              Brands
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-[#0b1d3d] tracking-tight leading-snug">
            Shop by Brand
          </h3>
          <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
            Browse genuine components from leading hardware manufacturers.
          </p>
        </div>

        <Link
          href="/search"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-black uppercase tracking-wider transition-colors whitespace-nowrap flex-shrink-0"
        >
          All Products
          <FiArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Brand list */}
      <div className="mt-3 flex-1 min-h-0 flex flex-col">
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">
            Featured Manufacturers ({brands.length})
          </p>
          <span className="text-[10px] text-gray-400">
            Select a brand to view products
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-2.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-14 bg-gray-50 rounded-xl animate-pulse border border-gray-100"
              />
            ))}
          </div>
        ) : brands.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-400">
            No brands currently listed.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
            {brands.map((b) => (
              <BrandCard key={b._id} brand={b} onClick={onClose} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(BrandFlyoutPanel);
