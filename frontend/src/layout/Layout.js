import Head from "next/head";
import { useRouter } from "next/router";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiPhoneCall, FiChevronUp } from "react-icons/fi";

//internal import

import useGetSetting from "@hooks/useGetSetting";
import Navbar from "@layout/navbar/Navbar";
import Footer from "@layout/footer/Footer";
import MobileFooter from "@layout/footer/MobileFooter";
import FeatureCard from "@components/feature-card/FeatureCard";
import CartDrawer from "@components/drawer/CartDrawer";
import StatsBar from "@components/common/StatsBar";
import RouteProgressBar from "@components/common/RouteProgressBar";

const Layout = ({ title, description, children }) => {
  const router = useRouter();
  const { storeCustomizationSetting } = useGetSetting();
  const phone = storeCustomizationSetting?.navbar?.phone;

  const handleScrollTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <>
      <ToastContainer
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        limit={2}
        theme="colored"
        toastClassName="!rounded-xl !shadow-lg !font-medium"
      />
      <RouteProgressBar />

      <div className="font-sans overflow-x-hidden">
        <Head>
          <title>
            {title
              ? `Elecmoon | ${title}`
              : "Elecmoon"}
          </title>
          {description && (
            <meta
              name="description"
              content={
                description ||
                "Discover personalized merchandise, branded giveaways, and advertising essentials. Ideal for businesses, events, and promotions"
              }
            />
          )}
          <link rel="icon" href="/favicon.png" />
        </Head>
        <Navbar />
        <CartDrawer />
        <div className="bg-gray-50">{children}</div>
        {/* Floating action buttons */}
        <div className="fixed right-3 sm:right-4 md:right-6 bottom-20 sm:bottom-24 flex flex-col gap-2 sm:gap-3 z-30 pointer-events-none">
          <a
            href={phone ? `tel:${phone}` : undefined}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg bg-red-600 text-white flex items-center justify-center shadow-lg hover:bg-red-700 transition pointer-events-auto"
            aria-label="Call Elecmoon"
          >
            <FiPhoneCall className="w-5 h-5 sm:w-6 sm:h-6" />
          </a>
          <button
            onClick={handleScrollTop}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg bg-red-600 text-white flex items-center justify-center shadow-lg hover:bg-red-700 transition pointer-events-auto"
            aria-label="Back to top"
            type="button"
          >
            <FiChevronUp className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
        <MobileFooter />
        {router.pathname === "/" && <StatsBar />}
        <div className="w-full">
          <div className="border-t border-gray-100 w-full">
            <Footer />
          </div>
        </div>
      </div>
    </>
  );
};

export default Layout;
