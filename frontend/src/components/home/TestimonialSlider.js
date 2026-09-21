import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { FaChevronLeft, FaChevronRight, FaStar, FaCheckCircle } from "react-icons/fa";

const testimonials = [
  {
    id: 1,
    name: "Rahul Sharma",
    date: "2024-11-12",
    avatar: "R",
    avatarBg: "bg-red-800",
    text: "We use Elecmoon for BMS and battery packs. They are very professional, reliable, always on time, and delivery was quick. Very happy with their service.",
    hasImage: false,
  },
  {
    id: 2,
    name: "Priya Patel",
    date: "2024-09-26",
    avatar: "P",
    avatarBg: "bg-purple-700",
    text: "Professional, quick and very easy to deal with. Clear communication on every order. Highly recommend Elecmoon for EV components.",
    hasImage: false,
  },
  {
    id: 3,
    name: "Amit Verma",
    date: "2024-08-01",
    avatar: "A",
    avatarBg: "bg-amber-800",
    text: "Needed BMS urgently for a solar project. Elecmoon arranged dispatch the next day and guided us on the right specs. Will definitely order again.",
  },
  {
    id: 4,
    name: "Sneha Reddy",
    date: "2024-06-18",
    avatar: "S",
    avatarBg: "bg-blue-800",
    text: "Excellent quality, on-time delivery and clear GST invoice. Very professional and polite support team. Price was also fair.",
  },
  {
    id: 5,
    name: "Vikram Singh",
    date: "2024-05-10",
    avatar: "V",
    avatarBg: "bg-green-800",
    text: "Great service, flexible delivery slots and efficient packing. Good pricing too. Trusted partner for our workshop.",
  },
  {
    id: 6,
    name: "Ananya Iyer",
    date: "2024-03-22",
    avatar: "A",
    avatarBg: "bg-indigo-800",
    text: "Proper guidance on cell selection and BMS matching. Took their time and did it right. Recommendable experience overall.",
  },
];

const GAP_PX = 12;

const getCardsPerView = (width) => {
  if (width >= 1024) return 5; // desktop: 5 cards in one row
  if (width >= 768) return 3;
  if (width >= 640) return 2;
  return 1;
};

const TestimonialSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardsPerView, setCardsPerView] = useState(5);
  const [cardWidth, setCardWidth] = useState(0);
  const scrollRef = useRef(null);
  const sectionRef = useRef(null);
  const autoScrollRef = useRef(null);
  const currentIndexRef = useRef(0);
  const isVisibleRef = useRef(false);
  const isPausedRef = useRef(false);

  const totalTestimonials = testimonials.length;
  const maxIndex = Math.max(totalTestimonials - cardsPerView, 0);

  const measure = useCallback(() => {
    const perView = getCardsPerView(window.innerWidth);
    setCardsPerView(perView);
    const container = scrollRef.current;
    if (!container) return;
    const w = container.clientWidth;
    setCardWidth((w - GAP_PX * (perView - 1)) / perView);
  }, []);

  const scrollToIndex = useCallback(
    (index) => {
      const container = scrollRef.current;
      if (!container || !cardWidth) return;

      const safeIndex = Math.min(Math.max(index, 0), maxIndex);
      container.scrollTo({
        left: safeIndex * (cardWidth + GAP_PX),
        behavior: "smooth",
      });
      currentIndexRef.current = safeIndex;
      setCurrentIndex(safeIndex);
    },
    [maxIndex, cardWidth]
  );

  const next = useCallback(() => {
    scrollToIndex(
      currentIndexRef.current >= maxIndex ? 0 : currentIndexRef.current + 1
    );
  }, [maxIndex, scrollToIndex]);

  const prev = useCallback(() => {
    scrollToIndex(
      currentIndexRef.current <= 0 ? maxIndex : currentIndexRef.current - 1
    );
  }, [maxIndex, scrollToIndex]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  useEffect(() => {
    setCurrentIndex((prev) => Math.min(prev, maxIndex));
  }, [maxIndex]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
      },
      { threshold: 0.25 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    autoScrollRef.current = setInterval(() => {
      if (!isVisibleRef.current || isPausedRef.current || document.hidden) return;
      next();
    }, 6000);

    return () => clearInterval(autoScrollRef.current);
  }, [next]);

  const handleScroll = () => {
    const container = scrollRef.current;
    if (!container || !cardWidth) return;
    const index = Math.round(container.scrollLeft / (cardWidth + GAP_PX));
    setCurrentIndex(Math.min(Math.max(index, 0), maxIndex));
  };

  return (
    <section
      ref={sectionRef}
      className="bg-[#f8fafc] py-10 sm:py-16 overflow-hidden"
      onMouseEnter={() => {
        isPausedRef.current = true;
      }}
      onMouseLeave={() => {
        isPausedRef.current = false;
      }}
      onTouchStart={() => {
        isPausedRef.current = true;
      }}
      onTouchEnd={() => {
        isPausedRef.current = false;
      }}
    >
      <div className="mx-auto max-w-screen-2xl px-3 sm:px-4 lg:px-12 relative z-10">
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 mb-4 sm:mb-5 rounded-full bg-amber-50 border border-amber-100">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <FaStar key={i} className="text-amber-400 text-xs" />
              ))}
            </div>
            <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">
              5-Star Reviews
            </span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight px-2">
            What Our{" "}
            <span className="text-[#ED1C24]">Happy Clients</span> Say
          </h2>
          <div className="w-16 h-1 bg-[#ED1C24] mx-auto mt-4 sm:mt-5 rounded-full" />
        </div>

        <div className="relative px-0 sm:px-10">
          <button
            type="button"
            onClick={prev}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white border border-gray-100 rounded-full p-2.5 sm:p-3 shadow-lg hover:shadow-xl transition-all hidden sm:flex items-center justify-center"
            aria-label="Previous testimonials"
          >
            <FaChevronLeft className="text-[#ED1C24] text-sm" />
          </button>

          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex overflow-x-auto scroll-smooth pb-2 testimonial-scroll"
            style={{ gap: GAP_PX }}
          >
            {testimonials.map((testimonial) => (
              <article
                key={testimonial.id}
                style={
                  cardWidth
                    ? { width: cardWidth, minWidth: cardWidth, maxWidth: cardWidth }
                    : undefined
                }
                className="relative flex-shrink-0 bg-white rounded-xl border border-gray-100/80 shadow-[0_4px_16px_rgba(0,0,0,0.04)] p-4 sm:p-5 flex flex-col min-h-[240px] sm:min-h-[260px]"
              >
                <div className="flex items-center gap-0.5 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <FaStar key={i} className="text-amber-400 text-[10px]" />
                  ))}
                  <FaCheckCircle className="text-green-500 ml-1 text-[10px]" />
                </div>

                <p className="text-gray-600 text-[13px] sm:text-[14px] leading-relaxed font-medium flex-grow break-words line-clamp-6">
                  &ldquo;{testimonial.text}&rdquo;
                </p>

                <div className="flex items-center gap-2.5 pt-4 mt-4 border-t border-gray-50">
                  <div
                    className={`relative w-8 h-8 rounded-full ${testimonial.avatarBg} flex items-center justify-center flex-shrink-0 overflow-hidden`}
                  >
                    {testimonial.hasImage ? (
                      <Image
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-bold text-xs">
                        {testimonial.avatar}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-gray-900 text-[13px] tracking-tight leading-snug truncate">
                      {testimonial.name}
                    </h4>
                    <p className="text-[9px] uppercase font-semibold text-gray-400 tracking-wider mt-0.5">
                      {testimonial.date}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <button
            type="button"
            onClick={next}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white border border-gray-100 rounded-full p-2.5 sm:p-3 shadow-lg hover:shadow-xl transition-all hidden sm:flex items-center justify-center"
            aria-label="Next testimonials"
          >
            <FaChevronRight className="text-[#ED1C24] text-sm" />
          </button>
        </div>

        {maxIndex > 0 ? (
          <div className="flex justify-center gap-2 mt-6 sm:mt-8">
            {Array.from({ length: maxIndex + 1 }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => scrollToIndex(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentIndex === i ? "w-6 bg-[#ED1C24]" : "w-1.5 bg-gray-200"
                }`}
                aria-label={`Go to review ${i + 1}`}
              />
            ))}
          </div>
        ) : null}
      </div>

      <style jsx>{`
        .testimonial-scroll {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .testimonial-scroll::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
};

export default TestimonialSlider;
