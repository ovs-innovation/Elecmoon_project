import Link from "next/link";
import { FiArrowRight, FiPackage } from "react-icons/fi";
import CategoryImage from "@components/common/CategoryImage";
import { getCategoryCardImage } from "@utils/categoryDisplayImage";

const CategoryCard = ({
  category,
  name,
  imageSrc,
  isActive = false,
  href,
  onClick,
  onMouseEnter,
  className = "",
  showExplore = true,
  fromProduct = false,
  compact = false,
}) => {
  const displayImage =
    imageSrc || getCategoryCardImage(category, {}) || category?.icon;

  const cardClass = [
    "group relative flex flex-col h-full overflow-hidden cursor-pointer",
    "bg-white rounded-2xl border transition-all duration-300 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b1d3d]/30 focus-visible:ring-offset-2",
    compact ? "min-h-[210px] sm:min-h-[230px]" : "min-h-[248px] sm:min-h-[272px] md:min-h-[288px]",
    isActive
      ? "border-[#0b1d3d] shadow-[0_14px_44px_rgba(11,29,61,0.16)] ring-2 ring-[#0b1d3d]/12"
      : "border-gray-100/90 shadow-[0_4px_18px_rgba(11,29,61,0.07)] hover:border-[#ED1C24]/35 hover:shadow-[0_22px_56px_rgba(11,29,61,0.14)] sm:hover:-translate-y-1.5",
    className,
  ].join(" ");

  const inner = (
    <>
      <div
        className={`absolute top-0 inset-x-0 h-[3px] z-20 transition-all duration-300 ${
          isActive ? "bg-[#ED1C24]" : "bg-transparent group-hover:bg-[#ED1C24]"
        }`}
        aria-hidden
      />

      <div className="relative flex-[3] min-h-[148px] sm:min-h-[168px] md:min-h-[178px] p-3 sm:p-3.5 pb-1.5">
        <div
          className="absolute inset-3 sm:inset-3.5 rounded-xl bg-gradient-to-b from-[#f8fafc] via-white to-[#eef2f7]"
          aria-hidden
        />
        <div
          className="absolute inset-3 sm:inset-3.5 rounded-xl opacity-60 bg-[radial-gradient(ellipse_at_50%_0%,rgba(237,28,36,0.07),transparent_65%)]"
          aria-hidden
        />

        {fromProduct ? (
          <span className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20 inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md bg-[#0b1d3d] text-white text-[8px] sm:text-[9px] font-bold uppercase tracking-wide shadow-sm max-w-[calc(100%-3rem)]">
            <FiPackage className="w-2.5 h-2.5 shrink-0" aria-hidden />
            <span className="truncate">{compact ? "Live" : "Live product"}</span>
          </span>
        ) : null}

        <CategoryImage
          src={displayImage}
          alt={name || "Category"}
          className="relative z-10 w-full h-full rounded-xl border border-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
          aspectClass={`aspect-[5/4] w-full h-full ${compact ? "min-h-[120px] sm:min-h-[152px]" : "min-h-[132px] sm:min-h-[152px]"}`}
          imageClassName="object-contain p-2 sm:p-3 transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          sizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 240px"
          optimizeWidth={520}
        />
      </div>

      <div
        className={`relative z-10 flex flex-[1] items-center justify-between gap-2.5 px-3.5 sm:px-4 py-3 sm:py-3.5 border-t ${
          isActive
            ? "bg-gradient-to-r from-[#0b1d3d]/[0.04] to-transparent border-[#0b1d3d]/10"
            : "bg-white border-gray-100/80"
        }`}
      >
        <div className="flex-1 min-w-0">
          <h3
            className={`text-xs sm:text-sm font-bold leading-snug line-clamp-2 transition-colors duration-200 ${
              isActive ? "text-[#0b1d3d]" : "text-gray-800 group-hover:text-[#0b1d3d]"
            }`}
          >
            {name}
          </h3>
          {showExplore ? (
            <p
              className={`mt-0.5 text-[10px] font-semibold uppercase tracking-wider transition-colors duration-200 ${
                compact ? "hidden sm:block" : ""
              } ${
                isActive
                  ? "text-[#ED1C24]"
                  : "text-gray-400 group-hover:text-[#ED1C24]/80"
              }`}
            >
              Explore
            </p>
          ) : null}
        </div>

        {showExplore ? (
          <span
            className={`flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
              isActive
                ? "bg-[#ED1C24] text-white shadow-md shadow-[#ED1C24]/25"
                : "bg-gray-100 text-gray-500 group-hover:bg-[#0b1d3d] group-hover:text-white group-hover:shadow-md"
            }`}
            aria-hidden
          >
            <FiArrowRight className="w-4 h-4" />
          </span>
        ) : null}
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cardClass} onMouseEnter={onMouseEnter}>
        {inner}
      </Link>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className={cardClass}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {inner}
    </div>
  );
};

export default CategoryCard;
