import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Controller, Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

//internal import

import useGetSetting from "@hooks/useGetSetting";
import useUtilsFunction from "@hooks/useUtilsFunction";
import { resolveShopNowHref } from "@utils/bannerLink";

const MainCarousel = () => {
  const { storeCustomizationSetting, loading, isFetched } = useGetSetting();
  const { showingTranslateValue, showingUrl, showingImage } =
    useUtilsFunction();

  // Add custom styles to ensure proper responsive height
  React.useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .mySwiper {
        height: 200px !important;
        width: 100% !important;
      }
      .mySwiper .swiper-slide {
        height: 200px !important;
      }
      @media (min-width: 480px) {
        .mySwiper, .mySwiper .swiper-slide {
          height: 240px !important;
        }
      }
      @media (min-width: 640px) {
        .mySwiper, .mySwiper .swiper-slide {
          height: 280px !important;
        }
      }
      @media (min-width: 768px) {
        .mySwiper, .mySwiper .swiper-slide {
          height: 320px !important;
        }
      }
      @media (min-width: 1024px) {
        .mySwiper, .mySwiper .swiper-slide {
          height: 360px !important;
        }
      }
      @media (min-width: 1280px) {
        .mySwiper, .mySwiper .swiper-slide {
          height: 400px !important;
        }
      }
      @media (min-width: 1536px) {
        .mySwiper, .mySwiper .swiper-slide {
          height: 440px !important;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const rawSliderData = [
    {
      id: 1,
      title: showingTranslateValue(
        storeCustomizationSetting?.slider?.first_title
      ),
      info: showingTranslateValue(
        storeCustomizationSetting?.slider?.first_description
      ),
      buttonName: showingTranslateValue(
        storeCustomizationSetting?.slider?.first_button
      ),
      url: showingUrl(storeCustomizationSetting?.slider?.first_link),
      image: showingImage(storeCustomizationSetting?.slider?.first_img),
    },
    {
      id: 2,
      title: showingTranslateValue(
        storeCustomizationSetting?.slider?.second_title
      ),
      info: showingTranslateValue(
        storeCustomizationSetting?.slider?.second_description
      ),
      buttonName: showingTranslateValue(
        storeCustomizationSetting?.slider?.second_button
      ),
      url: showingUrl(storeCustomizationSetting?.slider?.second_link),
      image: showingImage(storeCustomizationSetting?.slider?.second_img),
    },
    {
      id: 3,
      title: showingTranslateValue(
        storeCustomizationSetting?.slider?.third_title
      ),
      info: showingTranslateValue(
        storeCustomizationSetting?.slider?.third_description
      ),
      buttonName: showingTranslateValue(
        storeCustomizationSetting?.slider?.third_button
      ),
      url: showingUrl(storeCustomizationSetting?.slider?.third_link),
      image: showingImage(storeCustomizationSetting?.slider?.third_img),
    },
    {
      id: 4,
      title: showingTranslateValue(
        storeCustomizationSetting?.slider?.four_title
      ),
      info: showingTranslateValue(
        storeCustomizationSetting?.slider?.four_description
      ),
      buttonName: showingTranslateValue(
        storeCustomizationSetting?.slider?.four_button
      ),
      url: showingUrl(storeCustomizationSetting?.slider?.four_link),
      image: showingImage(storeCustomizationSetting?.slider?.four_img),
    },
    {
      id: 5,
      title: showingTranslateValue(
        storeCustomizationSetting?.slider?.five_title
      ),
      info: showingTranslateValue(
        storeCustomizationSetting?.slider?.five_description
      ),
      buttonName: showingTranslateValue(
        storeCustomizationSetting?.slider?.five_button
      ),
      url: showingUrl(storeCustomizationSetting?.slider?.five_link),
      image: showingImage(storeCustomizationSetting?.slider?.five_img),
    },
  ];

  // Filter out any slides that don't have an admin image or title
  const sliderData = rawSliderData.filter((item) => item.image && item.title);

  if (!isFetched || loading || sliderData.length === 0) {
    return null;
  }

  return (
    <>
      <div className="w-full h-[200px] sm:h-[240px] md:h-[280px] lg:h-[320px] xl:h-[360px] 2xl:h-[400px]">
        <Swiper
          spaceBetween={10}
          centeredSlides={true}
          autoplay={{
            delay: 2000,
            disableOnInteraction: false,
          }}
          loop={true}
          pagination={
            (storeCustomizationSetting?.slider?.bottom_dots ||
              storeCustomizationSetting?.slider?.both_slider) && {
              clickable: true,
              dynamicBullets: true,
            }
          }
          navigation={
            (storeCustomizationSetting?.slider?.left_right_arrow ||
              storeCustomizationSetting?.slider?.both_slider) && {
              clickable: true,
            }
          }
          modules={[Autoplay, Pagination, Navigation]}
          className="mySwiper h-[200px] sm:h-[240px] md:h-[280px] lg:h-[320px] xl:h-[360px] 2xl:h-[400px]"
          breakpoints={{
            320: {
              spaceBetween: 10,
              slidesPerView: 1,
            },
            480: {
              spaceBetween: 15,
              slidesPerView: 1,
            },
            640: {
              spaceBetween: 20,
              slidesPerView: 1,
            },
            768: {
              spaceBetween: 25,
              slidesPerView: 1,
            },
            1024: {
              spaceBetween: 30,
              slidesPerView: 1,
            },
            1280: {
              spaceBetween: 30,
              slidesPerView: 1,
            },
          }}
        >
          {sliderData?.map((item, i) => (
            <SwiperSlide
              className="relative rounded-lg overflow-hidden h-[200px] sm:h-[240px] md:h-[280px] lg:h-[320px] xl:h-[360px] 2xl:h-[400px]"
              key={i + 1}
            >
              <div className="text-sm text-gray-600 hover:text-green-dark w-full h-full relative">
                <Image
                  src={item.image || "/slider/slider-1.jpg"}
                  alt={item.title || `Slider image ${i + 1}`}
                  fill
                  className="object-fit"
                  priority={i === 0}
                  sizes="(max-width: 480px) 100vw, (max-width: 640px) 100vw, (max-width: 768px) 100vw, (max-width: 1024px) 100vw, (max-width: 1280px) 100vw, 100vw"
                />
              </div>
              <div className="absolute top-0 left-0 z-10 w-full h-full">
                <div className="max-w-screen-xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 h-full flex flex-col justify-center items-start">
                  <div className="w-full sm:w-11/12 md:w-10/12 lg:w-1/2 xl:w-5/12 2xl:w-5/12">
                  <h1 className="mb-1 sm:mb-2 font-serif text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl font-bold text-gray-800 leading-tight">
                    {item.title}
                  </h1>
                  <p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl leading-relaxed text-gray-600 font-sans mb-2 sm:mb-3 md:mb-4 lg:mb-5 xl:mb-6 max-w-[240px] sm:max-w-[320px] md:max-w-[500px] lg:max-w-[650px] xl:max-w-[750px] 2xl:max-w-[850px] break-words">
                    {item.info}
                  </p>
                  <Link
                    href={resolveShopNowHref(item.url)}
                    className="inline-block text-xs sm:text-sm md:text-base lg:text-lg font-serif font-medium px-3 py-1 sm:px-4 sm:py-2 md:px-5 md:py-2 lg:px-6 lg:py-3 xl:px-8 xl:py-3 bg-[#EF4036] text-center rounded-md text-white hover:bg-[#C53030] transition-all duration-300 transform hover:scale-105"
                  >
                    {item.buttonName}
                  </Link>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </>
  );
};

export default MainCarousel;
