import { useRouter } from "next/router";
import React, { useContext, useRef } from "react";
import { IoChevronBackOutline, IoChevronForward } from "react-icons/io5";
import { FiGrid } from "react-icons/fi";
import "swiper/css";
import "swiper/css/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";

import { getCategorySearchUrl } from "@utils/categoryUrl";
import { SidebarContext } from "@context/SidebarContext";
import useUtilsFunction from "@hooks/useUtilsFunction";
import useCategoryPreviewImages from "@hooks/useCategoryPreviewImages";
import CategoryCarouselSkeleton from "@components/skeleton/CategoryCarouselSkeleton";
import CategoryCard from "@components/category/CategoryCard";
import { getCategoryCardImage } from "@utils/categoryDisplayImage";

const CategoryCarousel = ({
  activeSlug,
  previewImages: previewImagesProp = null,
  showHeader = false,
}) => {
  const router = useRouter();
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  const { showingTranslateValue } = useUtilsFunction();
  const { categories, isCategoriesLoading } = useContext(SidebarContext);
  const previewImages = useCategoryPreviewImages(previewImagesProp);

  const handleCategoryClick = (category) => {
    const category_name = showingTranslateValue(category?.name);
    const url = getCategorySearchUrl(category?._id, category_name, category?.slug);
    router.push(url);
  };

  const handleCategoryHover = (category) => {
    const category_name = showingTranslateValue(category?.name);
    const url = getCategorySearchUrl(category?._id, category_name, category?.slug);
    router.prefetch(url);
  };

  const enableLoop = categories.length > 6;

  if (isCategoriesLoading) {
    return <CategoryCarouselSkeleton />;
  }

  if (!categories.length) {
    return null;
  }

  return (
    <div className="relative">
      {showHeader ? (
        <div className="flex items-end justify-between gap-4 mb-4 px-1">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-2 rounded-full bg-[#0b1d3d]/5 text-[10px] font-black text-[#0b1d3d] uppercase tracking-[0.2em]">
              <FiGrid className="w-3 h-3" />
              Categories
            </div>
            <h2 className="text-lg sm:text-xl font-black text-[#0b1d3d] tracking-tight">
              Browse by Category
            </h2>
          </div>
        </div>
      ) : null}

      <Swiper
        onInit={(swiper) => {
          swiper.params.navigation.prevEl = prevRef.current;
          swiper.params.navigation.nextEl = nextRef.current;
          swiper.navigation.init();
          swiper.navigation.update();
        }}
        autoplay={{
          delay: 5500,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        spaceBetween={16}
        navigation
        allowTouchMove
        loop={enableLoop}
        breakpoints={{
          320: { slidesPerView: 1.35, spaceBetween: 12 },
          480: { slidesPerView: 1.75, spaceBetween: 14 },
          640: { slidesPerView: 2.35, spaceBetween: 16 },
          860: { slidesPerView: 3, spaceBetween: 18 },
          1024: { slidesPerView: 3.75, spaceBetween: 20 },
          1280: { slidesPerView: 4, spaceBetween: 22 },
          1536: { slidesPerView: 4.75, spaceBetween: 24 },
        }}
        modules={[Autoplay, Navigation]}
        className="mySwiper category-slider !pb-2"
      >
        {categories.map((category) => {
          const catName = showingTranslateValue(category?.name);
          const catSlug =
            category?.slug ||
            catName?.toLowerCase().replace(/[^A-Z0-9]+/gi, "-");
          const isActive =
            activeSlug === catSlug ||
            router.query._id === category?._id ||
            (router.query.category &&
              catName?.toLowerCase().replace(/[^A-Z0-9]+/gi, "-") ===
                router.query.category);

          const productImage = previewImages[String(category._id)];
          const cardImage = getCategoryCardImage(category, previewImages);
          const fromProduct = Boolean(productImage && productImage === cardImage);

          return (
            <SwiperSlide key={category._id} className="!h-auto py-2 px-1">
              <CategoryCard
                category={category}
                name={catName}
                imageSrc={cardImage}
                isActive={isActive}
                fromProduct={fromProduct}
                onClick={() => handleCategoryClick(category)}
                onMouseEnter={() => handleCategoryHover(category)}
              />
            </SwiperSlide>
          );
        })}

        <button ref={prevRef} className="prev" type="button" aria-label="Previous categories">
          <IoChevronBackOutline />
        </button>
        <button ref={nextRef} className="next" type="button" aria-label="Next categories">
          <IoChevronForward />
        </button>
      </Swiper>
    </div>
  );
};

export default React.memo(CategoryCarousel);
