import React, { useEffect, useState } from "react";
import { motion, useMotionValue, animate } from "framer-motion";

const CountUp = ({ value, duration = 2, suffix = "+" }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const count = useMotionValue(0);

  useEffect(() => {
    const controls = animate(count, value, {
      duration,
      ease: "easeOut",
      onUpdate: (latest) => setDisplayValue(Math.floor(latest)),
    });
    return () => controls.stop();
  }, [count, value, duration]);

  return (
    <span className="tabular-nums">
      {displayValue.toLocaleString()}
      {suffix}
    </span>
  );
};

const StatsBar = () => {
  const stats = [
    { label: "Orders Fulfilled", value: 10000 },
    { label: "Customers", value: 6000 },
    { label: "Total Products", value: 75000 },
    { label: "Industrial Categories", value: 50 },
  ];

  return (
    <section className="w-full bg-white border-t border-slate-100">
      <div className="max-w-screen-2xl mx-auto px-5 sm:px-8 lg:px-12 xl:px-16 py-10 sm:py-12 lg:py-14">
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
              className={[
                "flex flex-col items-center justify-center text-center px-4 sm:px-6 py-6 lg:py-2",
                index % 2 === 1 ? "border-l border-slate-200" : "",
                index >= 2 ? "border-t border-slate-200 lg:border-t-0" : "",
                index > 0 ? "lg:border-l lg:border-slate-200" : "",
              ].join(" ")}
            >
              <p className="text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-[#0b1d3d] leading-none">
                <CountUp value={stat.value} />
              </p>
              <p className="mt-2.5 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsBar;
