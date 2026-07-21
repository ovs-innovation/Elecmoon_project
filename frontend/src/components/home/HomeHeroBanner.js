import React, { useRef, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade } from "swiper/modules";
import {
  FiChevronLeft,
  FiChevronRight,
  FiArrowRight,
  FiZap,
  FiShield,
  FiAward,
  FiTruck,
  FiHeadphones,
  FiFileText,
  FiPackage,
} from "react-icons/fi";
import useGetSetting from "@hooks/useGetSetting";
import useUtilsFunction from "@hooks/useUtilsFunction";
import { isExternalHref, resolveShopNowHref } from "@utils/bannerLink";
import { isCloudinaryUrl, optimizeImageUrl } from "@utils/cloudinaryImage";
import "swiper/css";
import "swiper/css/effect-fade";

const SLIDE_KEYS = ["first", "second", "third", "four", "five"];
const HERO_DEFAULT_IMAGE = "/hero/elecmoon-hero-products.png";

const DEFAULT_HEADLINE = "POWERING\nA SMARTER\nTOMORROW";
const DEFAULT_BODY =
  "High performance battery components for EV, Solar, Energy Storage & Industrial applications.";

const LEFT_FEATURES = [
  { icon: FiShield, lines: ["100% Genuine", "Products"] },
  { icon: FiAward, lines: ["Quality", "Tested"] },
  { icon: FiTruck, lines: ["Pan India", "Delivery"] },
  { icon: FiHeadphones, lines: ["Expert", "Support"] },
];

const BOTTOM_TRUST = [
  {
    icon: FiShield,
    title: "Genuine & Reliable",
    sub: "100% Authentic Products",
  },
  { icon: FiFileText, title: "GST Billing", sub: "All India GST Invoices" },
  { icon: FiPackage, title: "Bulk Orders", sub: "Best Prices for Bulk" },
  { icon: FiHeadphones, title: "Technical Support", sub: "Expert Guidance" },
];

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
        className="relative flex-shrink-0 w-9 h-9 rounded-full bg-[#0088FF] flex items-center justify-center shadow-[0_2px_8px_rgba(0,136,255,0.35)]"
        aria-hidden
      >
        <svg
          viewBox="0 0 24 24"
          className="w-5 h-5 text-white"
          fill="currentColor"
        >
          <path d="M12 2a1 1 0 0 1 .894.553l1.618 3.236 3.236.471a1 1 0 0 1 .554 1.706l-2.341 2.283.553 3.223a1 1 0 0 1-1.451 1.054L12 13.347l-2.894 1.52a1 1 0 0 1-1.451-1.054l.553-3.223L5.867 8.966a1 1 0 0 1 .554-1.706l3.236-.471L11.106 2.553A1 1 0 0 1 12 2zm0 4.118L11.382 7.5 9.5 7.764l1.5 1.463-.354 2.06L12 10.618l1.354 1.669-.354-2.06 1.5-1.463-1.882-.264L12 6.118z" />
        </svg>
      </span>
      <span className="text-[1.65rem] sm:text-[1.85rem] font-black tracking-[-0.02em] text-[#111] leading-none">
        ELECMOON
      </span>
    </div>
    <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.32em] text-[#222] mt-1.5 pr-0.5">
      Powering Innovation
    </p>
  </div>
);

const HeroSCurve = () => (
  <svg
    className="hero-s-curve hidden lg:block"
    viewBox="0 0 100 100"
    preserveAspectRatio="none"
    aria-hidden
  >
    <path
      className="hero-s-curve-shadow"
      d="M 38.5 0 C 45.5 24, 32.5 76, 38.5 100 L 43 100 C 36 76, 49 24, 43 0 Z"
    />
    <path
      className="hero-s-curve-white"
      d="M 38 0 C 44.5 24, 33 76, 38 100 L 42 100 C 35.5 76, 47 24, 42 0 Z"
    />
  </svg>
);

const HeroImagePanel = ({ slide, priority }) => (
  <div className="relative w-full h-full flex items-end justify-center px-4 sm:px-6 lg:px-8 xl:px-10 pb-14 lg:pb-16 pt-24 lg:pt-28">
    <div className="relative w-full h-full max-h-[88%] hero-animate-in">
      {slide.image ? (
        <Image
          src={slide.image}
          alt={slide.title || "Elecmoon battery and BMS products"}
          fill
          priority={priority}
          loading={priority ? "eager" : "lazy"}
          sizes="(max-width: 1024px) 100vw, 60vw"
          unoptimized={isCloudinaryUrl(slide.image)}
          className="object-contain object-bottom"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-[#0b1d3d]/25">
          <div className="w-20 h-20 rounded-xl border border-dashed border-[#0b1d3d]/15 flex items-center justify-center mb-3">
            <FiPackage className="w-9 h-9" aria-hidden />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#0b1d3d]/35">
            Upload hero image from Admin
          </p>
        </div>
      )}
    </div>
  </div>
);

const ShopNowButton = ({ href, external, label }) => {
  const targetHref = href || DEFAULT_SHOP_HREF;
  const content = (
    <span className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-lg font-bold uppercase tracking-wide text-[12px] sm:text-[13px] text-white bg-[#ED1C24] hover:bg-[#d41820] shadow-[0_4px_14px_rgba(237,28,36,0.35)] transition-colors duration-200">
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
    <section className="relative w-full overflow-x-hidden font-sans">
      <div className="relative w-full">
        <div className="relative min-h-[620px] sm:min-h-[680px] lg:h-[700px] lg:min-h-0 max-w-[1920px] mx-auto">
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
            className="hero-enterprise-swiper min-h-[620px] sm:min-h-[680px] lg:h-full w-full"
            allowTouchMove
          >
            {slides.map((slide, idx) => {
              const shopHref = resolveShopNowHref(slide.href, DEFAULT_SHOP_HREF);
              const shopExternal = shopHref && isExternalHref(shopHref);
              const headlineLines = parseHeadlineLines(slide.title);

              return (
                <SwiperSlide key={slide.id} className="h-full">
                  <div className="relative flex flex-col lg:flex-row h-full">
                    {/* Left panel — ~40% */}
                    <div className="relative order-2 lg:order-1 w-full lg:w-[40%] flex-shrink-0 lg:h-full bg-[#021533] hero-left-panel z-10">
                      <div
                        className="absolute inset-0 hero-left-gradient pointer-events-none"
                        aria-hidden
                      />
                      <div
                        className="absolute inset-0 hero-left-dots pointer-events-none"
                        aria-hidden
                      />

                      <div className="relative z-10 flex flex-col h-full px-5 sm:px-9 lg:px-10 xl:px-12 py-7 sm:py-10 lg:py-11">
                        <div className="flex-1 flex flex-col justify-center">
                          <div className="hero-animate-up hero-delay-1 flex items-center gap-2 mb-5 lg:mb-6">
                            <FiZap
                              className="w-4 h-4 text-[#ED1C24]"
                              strokeWidth={2.5}
                            />
                            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-white/90">
                              Battery &amp; BMS Solutions
                            </span>
                          </div>

                          <h1 className="hero-animate-up hero-delay-2 font-black uppercase leading-[1.02] tracking-tight mb-4 sm:mb-5 lg:mb-6">
                            {headlineLines.map((line, i) =>
                              line ? (
                                <span
                                  key={i}
                                  className={`block text-[1.65rem] sm:text-[2.4rem] lg:text-[2.55rem] xl:text-[2.9rem] ${
                                    i === 1 ? "text-[#0088FF]" : "text-white"
                                  }`}
                                >
                                  {line}
                                </span>
                              ) : null,
                            )}
                          </h1>

                          <p className="hero-animate-up hero-delay-3 text-white/80 text-sm sm:text-[15px] leading-[1.65] mb-5 sm:mb-8 max-w-[400px] font-medium">
                            {slide.body}
                          </p>

                          <div className="hero-animate-up hero-delay-4 flex flex-wrap items-center gap-3">
                            <ShopNowButton
                              href={shopHref}
                              external={shopExternal}
                              label={slide.cta}
                            />
                            <Link
                              href="/request-a-quote"
                              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold uppercase tracking-wide text-[12px] sm:text-[13px] border border-white/70 text-white hover:bg-white/10 transition-colors duration-200"
                            >
                              Get Quote
                              <FiArrowRight className="w-4 h-4" />
                            </Link>
                          </div>
                        </div>

                        <ul className="hero-animate-up hero-delay-5 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 pt-5 sm:pt-7 lg:pt-8 mt-4 sm:mt-6 lg:mt-auto">
                          {LEFT_FEATURES.map(({ icon: Icon, lines }) => (
                            <li
                              key={lines.join("-")}
                              className="flex flex-col items-center text-center"
                            >
                              <span className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-[#0088FF]/40 text-[#5eb8ff] mb-1.5 sm:mb-2">
                                <Icon
                                  className="w-[16px] h-[16px] sm:w-[17px] sm:h-[17px]"
                                  strokeWidth={1.6}
                                  aria-hidden
                                />
                              </span>
                              <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.06em] text-white/80 leading-snug">
                                {lines.map((line) => (
                                  <span key={line} className="block">
                                    {line}
                                  </span>
                                ))}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Right panel — ~60% */}
                    <div className="relative order-1 lg:order-2 w-full lg:w-[60%] flex-shrink-0 h-[38%] min-h-[220px] sm:h-[42%] sm:min-h-[240px] lg:h-full hero-right-panel z-0">
                      <div
                        className="absolute inset-0 hero-circuit-bg pointer-events-none"
                        aria-hidden
                      />

                      <div className="absolute top-6 sm:top-8 lg:top-10 right-6 sm:right-8 lg:right-10 xl:right-12 z-20">
                        <ElecmoonHeroLogo />
                      </div>

                      <HeroImagePanel slide={slide} priority={idx === 0} />
                    </div>

                    <HeroSCurve />
                  </div>
                </SwiperSlide>
              );
            })}
          </Swiper>

          {multiSlide ? (
            <>
              <button
                type="button"
                onClick={() => swiperRef.current?.slidePrev()}
                className="hero-nav-btn hidden sm:flex absolute left-3 sm:left-4 lg:left-5 top-1/2 -translate-y-1/2 z-40"
                aria-label="Previous slide"
              >
                <FiChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => swiperRef.current?.slideNext()}
                className="hero-nav-btn hidden sm:flex absolute right-3 sm:right-4 lg:right-5 top-1/2 -translate-y-1/2 z-40"
                aria-label="Next slide"
              >
                <FiChevronRight className="w-5 h-5" />
              </button>

              <div className="absolute bottom-5 lg:bottom-7 left-1/2 lg:left-[70%] -translate-x-1/2 z-40 flex items-center gap-2">
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
            </>
          ) : null}
        </div>

        {/* Bottom trust bar */}
        <div className="bg-white border-t border-gray-100">
          <div className="max-w-[1920px] mx-auto">
            <ul className="grid grid-cols-2 lg:grid-cols-4">
              {BOTTOM_TRUST.map(({ icon: Icon, title, sub }) => (
                <li
                  key={title}
                  className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 lg:px-8 py-4 sm:py-5 border-r border-gray-100 last:border-r-0"
                >
                  <span className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-[#0b1d3d]/5 text-[#0b1d3d]">
                    <Icon className="w-[18px] h-[18px]" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[11px] sm:text-xs font-bold text-[#0b1d3d] leading-tight">
                      {title}
                    </span>
                    <span className="block text-[10px] sm:text-[11px] text-gray-500 mt-0.5 leading-tight">
                      {sub}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <style>{`
        .hero-enterprise-swiper,
        .hero-enterprise-swiper .swiper-wrapper,
        .hero-enterprise-swiper .swiper-slide {
          height: 100%;
        }

        .hero-left-gradient {
          background: linear-gradient(165deg, #0b2a66 0%, #06204a 45%, #021533 100%);
        }

        .hero-left-dots {
          background-image: radial-gradient(rgba(0, 136, 255, 0.35) 1.2px, transparent 1.2px);
          background-size: 18px 18px;
          mask-image: radial-gradient(ellipse 55% 45% at 8% 8%, black 0%, transparent 100%);
          opacity: 0.55;
        }

        .hero-right-panel {
          background: #eef1f5;
        }

        .hero-circuit-bg {
          background-color: #eef1f5;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='1.2' opacity='0.85'%3E%3Cpath d='M10 20h30v20H10z'/%3E%3Cpath d='M50 10h25v15H50z'/%3E%3Cpath d='M80 30h30v10H80z'/%3E%3Cpath d='M20 50h40v8H20z'/%3E%3Cpath d='M70 55h35v12H70z'/%3E%3Cpath d='M15 75h20v20H15z'/%3E%3Cpath d='M45 85h50v6H45z'/%3E%3Cpath d='M100 70v35'/%3E%3Cpath d='M30 40v25'/%3E%3Cpath d='M60 25v30'/%3E%3Cpath d='M90 40v15'/%3E%3Ccircle cx='60' cy='60' r='3' fill='%23ffffff'/%3E%3C/g%3E%3C/svg%3E");
          background-size: 120px 120px;
        }

        .hero-s-curve {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 25;
        }

        .hero-s-curve-shadow {
          fill: rgba(0, 136, 255, 0.14);
        }

        .hero-s-curve-white {
          fill: #ffffff;
          filter: drop-shadow(2px 0 6px rgba(0, 136, 255, 0.08));
        }

        .hero-enterprise-swiper .swiper-slide-active .hero-animate-up {
          animation: heroFadeUp 0.55s ease forwards;
          opacity: 0;
        }

        .hero-enterprise-swiper .swiper-slide-active .hero-animate-in {
          animation: heroFadeIn 0.65s ease forwards;
          opacity: 0;
        }

        .hero-delay-1 { animation-delay: 0.04s; }
        .hero-delay-2 { animation-delay: 0.1s; }
        .hero-delay-3 { animation-delay: 0.16s; }
        .hero-delay-4 { animation-delay: 0.22s; }
        .hero-delay-5 { animation-delay: 0.28s; }

        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes heroFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .hero-nav-btn {
          width: 2.75rem;
          height: 2.75rem;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(55, 65, 81, 0.82);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #fff;
          backdrop-filter: blur(4px);
          transition: background 0.2s ease;
        }

        .hero-nav-btn:hover {
          background: rgba(31, 41, 55, 0.95);
        }

        @media (max-width: 1023px) {
          .hero-left-panel {
            border-top: 1px solid rgba(255, 255, 255, 0.08);
          }
        }
      `}</style>
    </section>
  );
};

export default HomeHeroBanner;
