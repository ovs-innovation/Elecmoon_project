import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FiChevronRight, FiPackage } from "react-icons/fi";
import { getCategorySearchUrl } from "@utils/categoryUrl";
import { isCloudinaryUrl, optimizeImageUrl } from "@utils/cloudinaryImage";

const SubcategoryCard = ({
  subcategory,
  name,
  description,
  previewImage,
  onClick,
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  const rawImage = subcategory?.icon || previewImage;
  const showImage = rawImage && !imgFailed;
  const imageSrc = showImage ? optimizeImageUrl(rawImage, { width: 96 }) : null;

  const url = getCategorySearchUrl(
    subcategory?._id,
    name,
    subcategory?.slug
  );

  return (
    <Link
      href={url}
      onClick={onClick}
      className="group relative flex items-center gap-3 p-2.5 sm:p-3 bg-white hover:bg-gray-50/70 rounded-xl border border-gray-100 hover:border-[#ED1C24]/30 hover:shadow-[0_4px_16px_rgba(11,29,61,0.06)] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ED1C24]"
    >
      {/* Thumbnail */}
      <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={name || "Subcategory"}
            fill
            sizes="48px"
            className="object-contain p-1 group-hover:scale-105 transition-transform duration-300"
            unoptimized={isCloudinaryUrl(imageSrc)}
            onError={() => setImgFailed(true)}
          />
        ) : (
          <FiPackage className="w-5 h-5 text-gray-400 group-hover:text-[#ED1C24] transition-colors" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="text-[12px] font-bold text-[#0b1d3d] group-hover:text-[#ED1C24] transition-colors line-clamp-1 leading-snug">
          {name}
        </h4>
        {description ? (
          <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5 leading-normal">
            {description}
          </p>
        ) : null}
      </div>

      {/* Arrow */}
      <FiChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#ED1C24] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
    </Link>
  );
};

export default SubcategoryCard;
