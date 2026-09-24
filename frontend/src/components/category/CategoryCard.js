import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";
import CategoryImage from "@components/common/CategoryImage";
import { getCategoryCardImage } from "@utils/categoryDisplayImage";
import useUtilsFunction from "@hooks/useUtilsFunction";

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
  const { showingTranslateValue } = useUtilsFunction();
  const desc = category?.description ? showingTranslateValue(category.description) : "";
  const kidsCount = (category?.children || []).length;

  const displayImage =
    imageSrc || getCategoryCardImage(category, {}) || category?.icon;

  const size = compact
    ? "w-[88px] h-[88px] sm:w-[100px] sm:h-[100px]"
    : "w-[100px] h-[100px] sm:w-[112px] sm:h-[112px] md:w-[120px] md:h-[120px]";

  const cardClass = [
    "group relative flex flex-col items-center text-center h-full",
    "cursor-pointer transition-all duration-300 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b1d3d]/30 focus-visible:ring-offset-2 rounded-2xl",
    "px-1.5 py-2 sm:py-3",
    className,
  ].join(" ");

  const circleClass = [
    "relative mx-auto overflow-hidden rounded-full border bg-white",
    "transition-all duration-300 ease-out",
    size,
    isActive
      ? "border-[#0b1d3d] shadow-[0_10px_28px_rgba(11,29,61,0.18)] ring-2 ring-[#0b1d3d]/15"
      : "border-gray-100 shadow-[0_4px_16px_rgba(11,29,61,0.08)] group-hover:border-[#ED1C24]/40 group-hover:shadow-[0_12px_32px_rgba(11,29,61,0.14)] group-hover:-translate-y-0.5",
  ].join(" ");

  const inner = (
    <>
      <div className={circleClass}>
        <div
          className="absolute inset-0 bg-gradient-to-b from-[#f8fafc] via-white to-[#eef2f7]"
          aria-hidden
        />
        <CategoryImage
          src={displayImage}
          alt={name || "Category"}
          className="relative z-10 w-full h-full border-0 shadow-none bg-transparent"
          roundedClass="rounded-full"
          aspectClass="aspect-square w-full h-full"
          imageClassName="object-contain p-3 sm:p-3.5 transition-transform duration-500 ease-out group-hover:scale-105"
          sizes="(max-width: 640px) 100px, 120px"
          optimizeWidth={240}
        />
      </div>

      <div className="mt-2.5 w-full px-0.5">
        <h3
          className={`text-[11px] sm:text-xs font-bold leading-snug line-clamp-2 transition-colors duration-200 ${
            isActive
              ? "text-[#0b1d3d]"
              : "text-gray-800 group-hover:text-[#0b1d3d]"
          }`}
          title={name}
        >
          {name}
        </h3>
        {desc ? (
          <p className="mt-0.5 text-[9.5px] text-gray-400 line-clamp-1">
            {desc}
          </p>
        ) : null}
        {showExplore ? (
          <div
            className={`mt-1 inline-flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-wider transition-colors duration-200 ${
              compact ? "hidden sm:inline-flex" : ""
            } ${
              isActive
                ? "text-[#ED1C24]"
                : "text-gray-400 group-hover:text-[#ED1C24]"
            }`}
          >
            <span>{kidsCount > 0 ? `${kidsCount} Types` : "Explore"}</span>
            <FiArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        ) : null}
        {fromProduct ? (
          <span className="sr-only">Live product preview</span>
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
