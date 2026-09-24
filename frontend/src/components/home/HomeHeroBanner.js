import React, { useRef, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade } from "swiper/modules";
import {
  FiArrowRight,
  FiZap,
  FiPackage,
} from "react-icons/fi";
import useGetSetting from "@hooks/useGetSetting";
import useUtilsFunction from "@hooks/useUtilsFunction";
import { isExternalHref, resolveShopNowHref } from "@utils/bannerLink";
import { isCloudinaryUrl, optimizeImageUrl } from "@utils/cloudinaryImage";
import DepartmentsSidebar from "@components/navbar/DepartmentsSidebar";
import "swiper/css";
import "swiper/css/effect-fade";

const SLIDE_KEYS = ["first", "second", "third", "four", "five"];
const HERO_DEFAULT_IMAGE = "/hero/elecmoon-hero-products.png";

const DEFAULT_HEADLINE = "POWERING\nA SMARTER\nTOMORROW";
const DEFAULT_BODY =
  "High performance battery components for EV, Solar, Energy Storage & Industrial applications.";

const DEFAULT_SHOP_HREF = "/#categories";

const HARDCODED_SLIDES = [1, 2, 3, 4].map((id) => ({
  id,
  image: HERO_DEFAULT_IMAGE,
  title: DEFAULT_HEADLINE,
  body: DEFAULT_BODY,
  href: DEFAULT_SHOP_HREF,
  cta: "Shop Now",
}));

const getAdminImageSrc = (raw) => {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed === "!#") return null;
  return optimizeImageUrl(trimmed, { width: 2000, quality: "auto" });
};

const parseHeadlineLines = (title) => {
  const raw = (title || DEFAULT_HEADLINE).trim();
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length >= 3) return lines.slice(0, 3);
  if (lines.length === 2) return [lines[0], lines[1], ""];
  if (lines.length === 1) {
    const parts = lines[0].split(/\s+/);
    if (parts.length >= 4) {
      return [parts[0], parts.slice(1, -1).join(" "), parts[parts.length - 1]];
    }
    return [lines[0], "", ""];
  }
  return DEFAULT_HEADLINE.split("\n");
};

const ElecmoonHeroLogo = () => (
  <div className="text-right select-none">
    <div className="inline-flex items-center gap-2.5">
      <span
        className="relative flex-shrink-0 w-8 h-8 rounded-full bg-[#ED1C24] flex items-center justify-center shadow-[0_2px_8px_rgba(237,28,36,0.35)]"
        aria-hidden
      >
        <svg
          viewBox="0 0 24 24"
          className="w-4 h-4 text-white"
          fill="currentColor"
        >
          <path d="M12 2a1 1 0 0 1 .894.553l1.618 3.236 3.236.471a1 1 0 0 1 .554 1.706l-2.341 2.283.553 3.223a1 1 0 0 1-1.451 1.054L12 13.347l-2.894 1.52a1 1 0 0 1-1.451-1.054l.553-3.223L5.867 8.966a1 1 0 0 1 .554-1.706l3.236-.471L11.106 2.553A1 1 0 0 1 12 2zm0 4.118L11.382 7.5 9.5 7.764l1.5 1.463-.354 2.06L12 10.618l1.354 1.669-.354-2.06 1.5-1.463-1.882-.264L12 6.118z" />
        </svg>
      </span>
      <span className="text-[1.4rem] sm:text-[1.6rem] font-black tracking-[-0.02em] text-[#111] leading-none">
        ELECMOON
      </span>
    </div>
    <p className="text-[9px] font-bold uppercase tracking-[0.32em] text-[#222] mt-1 pr-0.5">
      Powering Innovation
    </p>
  </div>
);

const ShopNowButton = ({ href, external, label }) => {
  const targetHref = href || DEFAULT_SHOP_HREF;
  const content = (
    <span className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-bold uppercase tracking-wide text-[11px] sm:text-[12px] text-white bg-[#ED1C24] hover:bg-[#d41820] shadow-[0_4px_14px_rgba(237,28,36,0.35)] transition-colors duration-200">
      {label || "Shop Now"}
      <FiArrowRight className="w-4 h-4" />
    </span>
  );

  const scrollToCategoriesIfNeeded = (e) => {
    const isCategoriesHash =
      targetHref === "/#categories" || targetHref === "#categories";
    if (!isCategoriesHash || typeof window === "undefined") return;

    const onHome =
      window.location.pathname === "/" || window.location.pathname === "";
    if (!onHome) return;

    e.preventDefault();
    document
      .getElementById("categories")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (external && href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  return (
    <Link href={targetHref} onClick={scrollToCategoriesIfNeeded}>
      {content}
    </Link>
  );
};

const HomeHeroBanner = () => {
  const { storeCustomizationSetting } = useGetSetting();
  const { showingTranslateValue, showingUrl, showingImage } =
    useUtilsFunction();
  const swiperRef = useRef(null);
  const [active, setActive] = useState(0);

  const sd = storeCustomizationSetting?.slider;

  const slides = useMemo(() => {
    if (!sd) return HARDCODED_SLIDES;

    const withContent = SLIDE_KEYS.map((key, index) => {
      const rawImage = showingImage(sd[`${key}_img`]);
      const image = getAdminImageSrc(rawImage);
      const title = showingTranslateValue(sd[`${key}_title`]);
      const body = showingTranslateValue(sd[`${key}_description`]);

      if (!title && !image && !body) return null;

      const rawLink = showingUrl(sd[`${key}_link`]);
      const adminLink = resolveShopNowHref(
        typeof rawLink === "string" ? rawLink.trim() : "",
        null
      );

      return {
        id: index + 1,
        image: image || HERO_DEFAULT_IMAGE,
        title: title || DEFAULT_HEADLINE,
        body: body || DEFAULT_BODY,
        href: adminLink || DEFAULT_SHOP_HREF,
        cta: showingTranslateValue(sd[`${key}_button`]) || "Shop Now",
      };
    }).filter(Boolean);

    return withContent.length > 0 ? withContent : HARDCODED_SLIDES;
  }, [sd, showingTranslateValue, showingUrl, showingImage]);

  const onSwiper = useCallback((s) => {
    swiperRef.current = s;
  }, []);

  const onChange = useCallback((s) => {
    setActive(s.realIndex);
  }, []);

  const multiSlide = slides.length > 1;

  return (
    <section className="relative w-full font-sans bg-white overflow-x-clip lg:overflow-visible">
      <div className="max-w-screen-2xl mx-auto px-0 sm:px-3 lg:px-8">
        <div className="relative flex items-stretch min-h-[320px] sm:min-h-[340px] lg:h-[385px] xl:h-[395px] lg:min-h-0 overflow-visible">
          <DepartmentsSidebar />

          <div className="relative flex-1 min-w-0 min-h-[320px] sm:min-h-[340px] lg:h-full overflow-hidden border border-gray-200 lg:border-l-0 z-10">
            <Swiper
              modules={[Autoplay, EffectFade]}
              effect="fade"
              fadeEffect={{ crossFade: true }}
              slidesPerView={1}
              loop={multiSlide}
              speed={800}
              autoplay={
                multiSlide
                  ? {
                      delay: 5000,
                      disableOnInteraction: false,
                      pauseOnMouseEnter: true,
                    }
                  : false
              }
              onSwiper={onSwiper}
              onSlideChange={onChange}
              className="hero-enterprise-swiper h-full min-h-[320px] sm:min-h-[340px] w-full"
              allowTouchMove
            >
              {slides.map((slide, idx) => {
                const shopHref = resolveShopNowHref(
                  slide.href,
                  DEFAULT_SHOP_HREF
                );
                const shopExternal = shopHref && isExternalHref(shopHref);
                const headlineLines = parseHeadlineLines(slide.title);

                return (
                  <SwiperSlide key={slide.id} className="h-full">
                    <div className="relative h-full w-full bg-[#f3f5f8] overflow-hidden">
                      <div
                        className="absolute inset-0 hero-circuit-bg pointer-events-none"
                        aria-hidden
                      />

                      <div className="absolute top-3 sm:top-4 right-4 sm:right-6 z-20 scale-90 origin-top-right">
                        <ElecmoonHeroLogo />
                      </div>

                      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 h-full">
                        <div className="flex flex-col justify-center px-5 sm:px-8 lg:px-10 py-5 lg:py-6 order-2 lg:order-1">
                          <div className="flex items-center gap-2 mb-2">
                            <FiZap
                              className="w-3.5 h-3.5 text-[#ED1C24]"
                              strokeWidth={2.5}
                            />
                            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.18em] text-[#0b1d3d]/65">
                              Battery &amp; BMS Solutions
                            </span>
                          </div>

                          <h1 className="font-black uppercase leading-[1.05] tracking-tight mb-2.5">
                            {headlineLines.map((line, i) =>
                              line ? (
                                <span
                                  key={i}
                                  className={`block text-[1.35rem] sm:text-[1.75rem] lg:text-[1.95rem] xl:text-[2.15rem] ${
                                    i === 1 ? "text-[#ED1C24]" : "text-[#0b1d3d]"
                                  }`}
                                >
                                  {line}
                                </span>
                              ) : null,
                            )}
                          </h1>

                          <p className="text-gray-600 text-xs sm:text-sm leading-[1.55] mb-4 max-w-[380px] font-medium line-clamp-2 sm:line-clamp-3">
                            {slide.body}
                          </p>

                          <div className="flex flex-wrap items-center gap-2.5">
                            <ShopNowButton
                              href={shopHref}
                              external={shopExternal}
                              label={slide.cta}
                            />
                            <Link
                              href="/request-a-quote"
                              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-bold uppercase tracking-wide text-[11px] sm:text-[12px] border border-[#0b1d3d]/25 text-[#0b1d3d] hover:bg-[#0b1d3d] hover:text-white transition-colors duration-200"
                            >
                              Get Quote
                              <FiArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>

                        <div className="relative order-1 lg:order-2 min-h-[150px] sm:min-h-[170px] lg:min-h-0 h-[40%] lg:h-full">
                          {slide.image ? (
                            <Image
                              src={slide.image}
                              alt={slide.title || "Elecmoon products"}
                              fill
                              priority={idx === 0}
                              loading={idx === 0 ? "eager" : "lazy"}
                              sizes="(max-width: 1024px) 100vw, 50vw"
                              unoptimized={isCloudinaryUrl(slide.image)}
                              className="object-contain object-center p-3 lg:p-5"
                            />
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-[#0b1d3d]/25">
                              <div className="w-14 h-14 rounded-xl border border-dashed border-[#0b1d3d]/15 flex items-center justify-center mb-2">
                                <FiPackage className="w-6 h-6" aria-hidden />
                              </div>
                              <p className="text-[10px] font-semibold uppercase tracking-widest">
                                Upload hero image
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </SwiperSlide>
                );
              })}
            </Swiper>

            {multiSlide ? (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => swiperRef.current?.slideToLoop(i)}
                    className={`rounded-full transition-all duration-300 ${
                      active === i
                        ? "w-7 h-1.5 bg-[#ED1C24]"
                        : "w-1.5 h-1.5 bg-[#cbd5e1]"
                    }`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <style>{`
        .hero-enterprise-swiper,
        .hero-enterprise-swiper .swiper-wrapper,
        .hero-enterprise-swiper .swiper-slide {
          height: 100%;
        }

        .hero-circuit-bg {
          background-color: #f3f5f8;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Cg fill='none' stroke='%23d1d5db' stroke-width='1.2' opacity='0.55'%3E%3Cpath d='M10 20h30v20H10z'/%3E%3Cpath d='M50 10h25v15H50z'/%3E%3Cpath d='M80 30h30v10H80z'/%3E%3Cpath d='M20 50h40v8H20z'/%3E%3Cpath d='M70 55h35v12H70z'/%3E%3Cpath d='M15 75h20v20H15z'/%3E%3Cpath d='M45 85h50v6H45z'/%3E%3Cpath d='M100 70v35'/%3E%3Cpath d='M30 40v25'/%3E%3Cpath d='M60 25v30'/%3E%3Cpath d='M90 40v15'/%3E%3Ccircle cx='60' cy='60' r='3' fill='%23d1d5db'/%3E%3C/g%3E%3C/svg%3E");
          background-size: 120px 120px;
        }
      `}</style>
    </section>
  );
};

export default HomeHeroBanner;
