import React from "react";
import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";
import {
  IconBrowseCatalog,
  IconQuoteOrder,
  IconDeliverSupport,
} from "@components/home/WhyChooseIcons";

const STEPS = [
  {
    num: "01",
    Icon: IconBrowseCatalog,
    title: "Browse & Choose",
    desc: "Explore BMS boards, lithium cells, battery packs and accessories for EV, solar and industrial projects.",
    href: "/search",
    linkLabel: "View Products",
  },
  {
    num: "02",
    Icon: IconQuoteOrder,
    title: "Order or Get Quote",
    desc: "Buy online instantly, place bulk orders, or request a custom quote for tailored battery pack solutions.",
    href: "/request-a-quote",
    linkLabel: "Request Quote",
  },
  {
    num: "03",
    Icon: IconDeliverSupport,
    title: "Delivery & Support",
    desc: "Get pan-India delivery with GST invoice plus expert technical guidance and after-sales support.",
    href: "/contact-us",
    linkLabel: "Contact Us",
  },
];

const ProcessSection = () => {
  return (
    <section className="relative bg-white border-y border-slate-100 py-14 sm:py-16 lg:py-20">
      <div className="max-w-screen-2xl mx-auto px-5 sm:px-8 lg:px-12 xl:px-16">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-14">
          <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-[#ED1C24] mb-3">
            How It Works
          </p>
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-[2.25rem] font-bold text-[#0b1d3d] leading-tight tracking-tight mb-3">
            Three Simple Steps to{" "}
            <span className="text-[#ED1C24]">Power Your Project</span>
          </h2>
          <p className="text-[15px] sm:text-base text-slate-500 leading-relaxed">
            From selecting the right BMS to receiving pan-India delivery — Elecmoon
            makes battery sourcing fast, reliable and hassle-free.
          </p>
        </div>

        {/* Steps */}
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 lg:gap-12 mb-12 sm:mb-14">
          {/* Connector line (desktop) */}
          <div
            className="hidden md:block absolute top-10 left-[16%] right-[16%] h-px bg-slate-200"
            aria-hidden
          />

          {STEPS.map((step, index) => {
            const Icon = step.Icon;
            return (
              <div
                key={step.num}
                className="relative flex flex-col items-center text-center"
              >
                <div className="relative z-10 mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#0b1d3d] text-white shadow-sm ring-4 ring-white">
                  <Icon className="w-7 h-7" />
                  <span className="absolute -top-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#ED1C24] text-[11px] font-bold text-white">
                    {step.num}
                  </span>
                </div>

                <h3 className="font-serif text-lg sm:text-xl font-bold text-[#0b1d3d] mb-2.5">
                  {step.title}
                </h3>
                <p className="text-[14px] sm:text-[15px] text-slate-500 leading-relaxed mb-4 max-w-[280px] mx-auto">
                  {step.desc}
                </p>
                <Link
                  href={step.href}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0b1d3d] hover:text-[#ED1C24] transition-colors group"
                >
                  {step.linkLabel}
                  <FiArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>

                {/* Mobile connector */}
                {index < STEPS.length - 1 ? (
                  <div
                    className="md:hidden mt-8 h-8 w-px bg-slate-200"
                    aria-hidden
                  />
                ) : null}
              </div>
            );
          })}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <Link
            href="/search"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-lg bg-[#ED1C24] hover:bg-[#d41820] text-white font-semibold text-[15px] transition-colors w-full sm:w-auto"
          >
            Browse Products
            <FiArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/request-a-quote"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-lg border border-slate-300 bg-white hover:border-[#0b1d3d] hover:text-[#0b1d3d] text-slate-700 font-semibold text-[15px] transition-colors w-full sm:w-auto"
          >
            Get Custom Quote
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ProcessSection;
