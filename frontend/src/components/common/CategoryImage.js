import { useState, useEffect } from "react";
import Image from "next/image";
import { FiGrid } from "react-icons/fi";
import { IMAGE_PLACEHOLDER, optimizeImageUrl } from "@utils/cloudinaryImage";

const CategoryImage = ({
  src,
  alt,
  className = "",
  imageClassName = "object-contain p-3 sm:p-4",
  sizes = "(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 180px",
  priority = false,
  aspectClass = "aspect-[4/3]",
  optimizeWidth = 320,
}) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [src]);

  const showPlaceholder = !src || imgError;
  // Use exact database/admin URL — only apply Cloudinary resize when URL is valid
  const imageSrc =
    !src || imgError ? IMAGE_PLACEHOLDER : optimizeImageUrl(src, { width: optimizeWidth });

  return (
    <div
      className={`relative w-full ${aspectClass} overflow-hidden rounded-xl bg-gradient-to-br from-gray-50 to-gray-100/80 flex-shrink-0 ${className}`}
    >
      {showPlaceholder ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-2">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
            <FiGrid className="w-6 h-6 sm:w-7 sm:h-7 text-[#0b1d3d]/25" />
          </div>
          <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 text-center line-clamp-2 px-1">
            {alt || "Category"}
          </span>
        </div>
      ) : (
        <Image
          src={imgError ? IMAGE_PLACEHOLDER : imageSrc}
          alt={alt || "Category"}
          fill
          sizes={sizes}
          priority={priority}
          loading={priority ? "eager" : "lazy"}
          className={`${imageClassName} transition-transform duration-300`}
          onError={() => setImgError(true)}
        />
      )}
    </div>
  );
};

export default CategoryImage;
