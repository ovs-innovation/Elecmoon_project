import Cookies from "js-cookie";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useContext, useEffect, useState } from "react";
import { IoLockOpenOutline } from "react-icons/io5";
import {
  FiCheck,
  FiFileText,
  FiGrid,
  FiList,
  FiMail,
  FiRefreshCw,
  FiSettings,
  FiShoppingCart,
  FiTruck,
  FiUser,
  FiHeart,
} from "react-icons/fi";
import { signOut } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "react-use-cart";
import { WishlistContext } from "@context/WishlistContext";
import { UserContext } from "@context/UserContext";

//internal import
import Layout from "@layout/Layout";
import Card from "@components/order-card/Card";
import OrderServices from "@services/OrderServices";
import RecentOrder from "@pages/user/recent-order";
import { SidebarContext } from "@context/SidebarContext";
import Loading from "@components/preloader/Loading";
import useGetSetting from "@hooks/useGetSetting";
import useUtilsFunction from "@hooks/useUtilsFunction";

const Dashboard = ({ title, description, children }) => {
  const router = useRouter();
  const { isLoading, setIsLoading, currentPage } = useContext(SidebarContext);
  const { emptyCart, items } = useCart();
  const { clearWishlist, wishlistItems } = useContext(WishlistContext);
  const { state: { userInfo } } = useContext(UserContext);

  const { storeCustomizationSetting } = useGetSetting();
  const { showingTranslateValue } = useUtilsFunction();

  const {
    data,
    error,
    isLoading: loading,
  } = useQuery({
    queryKey: ["orders", { currentPage }],
    queryFn: async () =>
      await OrderServices.getOrderCustomer({
        page: currentPage,
        limit: 10,
      }),
  });

  const handleLogOut = () => {
    signOut();
    Cookies.remove("couponInfo");
    // Clear cart and wishlist locally
    emptyCart();
    if (typeof clearWishlist === 'function') clearWishlist();
    router.push("/");
  };

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const userSidebar = [
    {
      title: showingTranslateValue(
        storeCustomizationSetting?.dashboard?.dashboard_title
      ),
      href: "/user/dashboard",
      icon: FiGrid,
    },

    {
      title: showingTranslateValue(
        storeCustomizationSetting?.dashboard?.my_order
      ),
      href: "/user/my-orders",
      icon: FiList,
    },
    {
      title: "My Enquiries",
      href: "/user/enquiries",
      icon: FiMail,
    },
    {
      title: "My Account",
      href: "/user/my-account",
      icon: FiUser,
    },
    {
      title: "Wishlist",
      href: "/user/wishlist",
      icon: FiHeart,
    },

    {
      title: showingTranslateValue(
        storeCustomizationSetting?.dashboard?.update_profile
      ),
      href: "/user/update-profile",
      icon: FiSettings,
    },
    {
      title: showingTranslateValue(
        storeCustomizationSetting?.dashboard?.change_password
      ),
      href: "/user/change-password",
      icon: FiFileText,
    },
  ];

  return (
    <>
      {isLoading ? (
        <Loading loading={isLoading} />
      ) : (
        <Layout
          title={title ? title : "Dashboard"}
          description={description ? description : "This is User Dashboard"}
        >
          <div className="mx-auto max-w-screen-2xl px-3 sm:px-10">
            <div className="py-10 lg:py-12 flex flex-col lg:flex-row w-full">
              <div className="flex-shrink-0 w-full lg:w-80 mr-7 lg:mr-10  xl:mr-10 ">
                <div className="bg-white p-4 sm:p-5 lg:p-8 rounded-md sticky top-32">
                  {userSidebar?.map((item) => (
                    <Link
                      key={item.title}
                      href={item.href}
                      className={`p-3 my-1 flex items-center rounded-lg transition-all duration-200 group ${router.asPath === item.href
                        ? "bg-[#0b1d3d] text-white shadow-md"
                        : "text-gray-600 hover:bg-gray-50 hover:text-[#0b1d3d]"
                        }`}
                    >
                      <item.icon
                        className={`flex-shrink-0 h-5 w-5 mr-3 transition-colors ${router.asPath === item.href ? "text-white" : "text-gray-400 group-hover:text-[#0b1d3d]"
                          }`}
                        aria-hidden="true"
                      />
                      <span className="text-sm font-semibold">
                        {item.title}
                      </span>
                    </Link>
                  ))}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <button
                      onClick={handleLogOut}
                      className="p-3 flex items-center rounded-lg text-[#ED1C24] w-full transition-all duration-200 group hover:bg-[#ED1C24] hover:text-white"
                    >
                      <IoLockOpenOutline className="h-5 w-5 mr-3 text-[#ED1C24] group-hover:text-white transition-colors" />
                      <span className="text-sm font-semibold">
                        {showingTranslateValue(
                          storeCustomizationSetting?.navbar?.logout
                        )}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
              <div className="w-full bg-white mt-4 lg:mt-0 p-4 sm:p-5 lg:p-8 rounded-md overflow-hidden">
                {!children && (
                  <div className="overflow-hidden">
                    <h2 className="text-xl font-serif font-semibold mb-5">
                      {showingTranslateValue(
                        storeCustomizationSetting?.dashboard?.dashboard_title
                      )}
                    </h2>
                    <div className="grid gap-6 mb-8 md:grid-cols-2 xl:grid-cols-4">
                      <Card
                        title={showingTranslateValue(
                          storeCustomizationSetting?.dashboard?.total_order
                        )}
                        Icon={FiShoppingCart}
                        quantity={data?.totalDoc}
                        className="bg-slate-50 text-slate-800 border-l-4 border-slate-400"
                      />
                      <Card
                        title={showingTranslateValue(
                          storeCustomizationSetting?.dashboard?.pending_order
                        )}
                        Icon={FiRefreshCw}
                        quantity={data?.pending}
                        className="bg-slate-50 text-slate-800 border-l-4 border-slate-300"
                      />
                      <Card
                        title={showingTranslateValue(
                          storeCustomizationSetting?.dashboard?.processing_order
                        )}
                        Icon={FiTruck}
                        quantity={data?.processing}
                        className="bg-slate-50 text-slate-800 border-l-4 border-[#0b1d3d]"
                      />
                      <Card
                        title={showingTranslateValue(
                          storeCustomizationSetting?.dashboard?.complete_order
                        )}
                        Icon={FiCheck}
                        quantity={data?.delivered}
                        className="bg-[#0b1d3d] text-white"
                      />
                    </div>
                    <RecentOrder data={data} loading={loading} error={error} />
                  </div>
                )}
                {children}
              </div>
            </div>
          </div>
        </Layout>
      )}
    </>
  );
};

export default dynamic(() => Promise.resolve(Dashboard), { ssr: false });
