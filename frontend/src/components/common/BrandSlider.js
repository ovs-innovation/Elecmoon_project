import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import BrandServices from "@services/BrandServices";

const BrandSlider = () => {
  const { data: brands = [] } = useQuery({
    queryKey: ["brands-show-home"],
    queryFn: () => BrandServices.getShowingBrands(),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const list = brands.length
    ? brands
    : [{ _id: "placeholder", name: "Add brands in Admin", slug: "" }];

  const loop = [...list, ...list, ...list];

  return (
    <div className="max-w-screen-2xl mx-auto px-3 sm:px-4 lg:px-12 my-8 sm:my-10 lg:my-16 overflow-hidden">
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2 className="text-2xl lg:text-3xl font-black text-[#0b1d3d] tracking-tight">
          Popular Brands
        </h2>
      </div>

      <div className="flex h-16 lg:h-24 border-2 border-[#f39c12]/40 rounded-2xl overflow-hidden shadow-[0_10px_30px_rgba(243,156,18,0.08)] bg-white relative">
        <div className="flex-grow relative overflow-hidden flex items-center bg-white">
          <motion.div
            className="flex items-center gap-16 lg:gap-28 whitespace-nowrap px-10"
            animate={{ x: ["0%", "-100%"] }}
            transition={{
              duration: 40,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            {loop.map((brand, idx) => {
              const inner = (
                <>
                  <span className="text-xl lg:text-3xl font-black text-gray-400 group-hover:text-gray-800 transition-colors font-sans uppercase tracking-wide">
                    {brand.name}
                  </span>
                  <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-[#f39c12] to-yellow-300 opacity-20 group-hover:opacity-100 transition-opacity shadow-sm" />
                </>
              );

              const className =
                "flex items-center gap-3 lg:gap-4 group select-none grayscale hover:grayscale-0 transition-all duration-300 transform hover:scale-105";

              if (brand.slug) {
                return (
                  <Link
                    key={`${brand._id}-${idx}`}
                    href={`/brand/${brand.slug}`}
                    className={`${className} cursor-pointer`}
                  >
                    {inner}
                  </Link>
                );
              }

              return (
                <div key={`${brand._id}-${idx}`} className={`${className} cursor-default`}>
                  {inner}
                </div>
              );
            })}
          </motion.div>

          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white via-white/80 to-transparent pointer-events-none z-10" />
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none z-10" />
        </div>
      </div>
    </div>
  );
};

export default BrandSlider;
