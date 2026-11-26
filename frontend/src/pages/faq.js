import React, { useState } from "react";
import Link from "next/link";
import { FiChevronDown, FiHelpCircle, FiPackage, FiTruck, FiShield, FiDollarSign } from "react-icons/fi";
import Layout from "@layout/Layout";

const faqCategories = [
  {
    category: "General & Ordering",
    icon: FiHelpCircle,
    items: [
      {
        question: "How do I place an order on Elecmoon?",
        answer:
          "Browse our products catalog or search by category and brand. Select your desired product, choose any variants or quantity tiers, and click 'Add to Cart' or 'Buy Now'. Proceed to checkout, fill in your shipping details, and complete payment via PhonePe, UPI, Cards, NetBanking, or COD (where applicable).",
      },
      {
        question: "Do I need an account to place an order?",
        answer:
          "You can browse and start checkout as a guest, but creating an account allows you to track orders in real-time, view order history, save addresses, and access wholesale or bulk discount pricing.",
      },
      {
        question: "Can I get a GST invoice for my business?",
        answer:
          "Yes! We provide complete GST tax invoices for all orders. You can enter your company name and GSTIN number during checkout, and the GST invoice will be generated and available for download in your order dashboard.",
      },
      {
        question: "How do I request a custom quotation for bulk orders?",
        answer:
          "You can visit our 'Request A Quote' page or click 'Add to Quote' on any product page. You can also reach our sales team directly at elecmoonofficial@gmail.com or call us.",
      },
    ],
  },
  {
    category: "Products & Technical Support",
    icon: FiShield,
    items: [
      {
        question: "Are your Lithium-Ion cells and BMS modules genuine and tested?",
        answer:
          "All our cells, BMS boards (including DALY BMS, Smart BMS), and battery materials undergo stringent quality checks. We provide factory specifications, datasheets, and batch testing certificates where applicable.",
      },
      {
        question: "How do I choose the right BMS for my battery pack?",
        answer:
          "Select a BMS matching your battery chemistry (NMC: 3.7V nominal per cell or LFP: 3.2V nominal per cell), the number of series cells (e.g., 3S, 4S, 7S, 13S, 16S), and your continuous/peak discharge current requirements. If you need guidance, our technical team is happy to help.",
      },
      {
        question: "Do you supply nickel strips, spot welders, and battery assembly accessories?",
        answer:
          "Yes, we provide end-to-end battery assembly raw materials including pure nickel strips, nickel-plated steel strips, barley insulation paper, PVC heat shrink tubes, epoxy sheets, cell holders, spot welding needles, and spot welders.",
      },
      {
        question: "Can you provide custom battery pack solutions?",
        answer:
          "Yes, we support OEM partners and businesses with custom battery pack design, assembly, and testing for electric vehicles, solar storage, energy storage systems (ESS), and industrial machinery.",
      },
    ],
  },
  {
    category: "Shipping & Delivery",
    icon: FiTruck,
    items: [
      {
        question: "How long does delivery take?",
        answer:
          "Orders are typically processed within 24 to 48 hours. Delivery usually takes 2 to 5 business days for metro cities and 4 to 7 business days for other locations across India.",
      },
      {
        question: "Which courier partners do you use and how can I track my shipment?",
        answer:
          "We partner with leading logistics providers through Shiprocket, including Bluedart, Delhivery, DTDC, and India Post. Once dispatched, you will receive an SMS and email with live tracking details.",
      },
      {
        question: "Is free shipping available?",
        answer:
          "Yes! We offer free standard shipping on orders of ₹2000 and above across eligible pin codes in India.",
      },
    ],
  },
  {
    category: "Returns & Warranty",
    icon: FiDollarSign,
    items: [
      {
        question: "What is your return or replacement policy?",
        answer:
          "If you receive a damaged, defective, or incorrect item, notify us within 7 days of delivery with photos/video of the item and package. We will promptly arrange a replacement or refund according to our Return Policy.",
      },
      {
        question: "How do I contact customer support?",
        answer:
          "You can reach our customer support team via the Contact Us page, email us at elecmoonofficial@gmail.com, or visit our store in New Delhi during business hours (Monday - Saturday, 9:00 AM - 6:00 PM).",
      },
    ],
  },
];

const FAQ = () => {
  const [activeCategory, setActiveCategory] = useState(0);
  const [openItems, setOpenItems] = useState({ "0-0": true });

  const toggleItem = (catIdx, itemIdx) => {
    const key = `${catIdx}-${itemIdx}`;
    setOpenItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <Layout title="FAQ - Frequently Asked Questions" description="Frequently Asked Questions about Elecmoon products, battery materials, BMS, shipping, and bulk orders">
      {/* Hero Section */}
      <div className="relative bg-[#0b1d3d] text-white py-16 lg:py-24 overflow-hidden border-b border-white/5">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-1/3 h-full bg-red-500/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

        <div className="relative max-w-screen-2xl mx-auto px-4 sm:px-10 text-center">
          <div className="inline-flex items-center gap-2 text-[11px] font-bold text-white/70 uppercase tracking-widest mb-4 bg-white/10 px-4 py-1.5 rounded-full border border-white/15 backdrop-blur-sm">
            <span>Home</span>
            <span>/</span>
            <span className="text-[#ED1C24]">FAQ</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black !text-white mb-4 tracking-tight">
            Frequently Asked <span className="text-[#ED1C24]">Questions</span>
          </h1>
          <div className="w-20 h-1 bg-[#ED1C24] mx-auto mb-4 rounded-full" />
          <p className="text-white/80 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Find answers to commonly asked questions about our electronic components, lithium-ion battery materials, shipping, custom orders, and services.
          </p>
        </div>
      </div>

      {/* Main FAQ Content */}
      <div className="bg-[#f8fafc] py-12 lg:py-16">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-12">
            {faqCategories.map((cat, idx) => {
              const Icon = cat.icon;
              const isActive = activeCategory === idx;
              return (
                <button
                  key={cat.category}
                  type="button"
                  onClick={() => setActiveCategory(idx)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all shadow-sm ${
                    isActive
                      ? "bg-[#0b1d3d] text-white shadow-md scale-105"
                      : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-[#ED1C24]" : "text-gray-500"}`} />
                  {cat.category}
                </button>
              );
            })}
          </div>

          {/* Active Category Accordion */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 space-y-4 max-w-4xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-black text-[#0b1d3d] mb-6 flex items-center gap-3">
              <span className="w-2 h-7 bg-[#ED1C24] rounded-full inline-block" />
              {faqCategories[activeCategory].category}
            </h2>

            <div className="space-y-3">
              {faqCategories[activeCategory].items.map((item, itemIdx) => {
                const key = `${activeCategory}-${itemIdx}`;
                const isOpen = !!openItems[key];
                return (
                  <div
                    key={item.question}
                    className={`rounded-xl border transition-all ${
                      isOpen ? "border-[#ED1C24]/30 bg-red-50/20" : "border-gray-100 bg-gray-50/50 hover:bg-gray-50"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleItem(activeCategory, itemIdx)}
                      className="w-full flex items-center justify-between p-4 sm:p-5 text-left text-sm sm:text-base font-bold text-[#0b1d3d]"
                    >
                      <span className="pr-4">{item.question}</span>
                      <FiChevronDown
                        className={`w-5 h-5 flex-shrink-0 text-gray-400 transition-transform duration-200 ${
                          isOpen ? "rotate-180 text-[#ED1C24]" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-5 sm:px-5 sm:pb-6 text-xs sm:text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                        {item.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Need More Help Banner */}
          <div className="mt-12 bg-white rounded-2xl border border-gray-200 p-8 text-center max-w-4xl mx-auto shadow-sm">
            <h3 className="text-lg sm:text-xl font-bold text-[#0b1d3d] mb-2">
              Still have questions?
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 mb-6 max-w-md mx-auto">
              Our engineering and customer support team is available Monday to Saturday to assist you with any questions.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/contact-us"
                className="px-6 py-3 bg-[#0b1d3d] hover:bg-[#162542] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95"
              >
                Contact Support
              </Link>
              <Link
                href="/request-a-quote"
                className="px-6 py-3 bg-white border-2 border-[#0b1d3d] text-[#0b1d3d] hover:bg-gray-50 rounded-xl text-xs sm:text-sm font-bold transition-all active:scale-95"
              >
                Request A Quote
              </Link>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
};

export default FAQ;
