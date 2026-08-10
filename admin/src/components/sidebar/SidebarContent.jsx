import React, { useContext, useState } from "react";
import { NavLink, Route } from "react-router-dom";
import Cookies from "js-cookie";
import { useTranslation } from "react-i18next";
import { Button, WindmillContext } from "@windmill/react-ui";
import { IoLogOutOutline } from "react-icons/io5";

//internal import
import sidebar from "@/routes/sidebar";
// import SidebarSubMenu from "SidebarSubMenu";
import logoDark from "@/assets/img/logo/logo.png";
import logoLight from "@/assets/img/logo/logo.png";
import { AdminContext } from "@/context/AdminContext";
import SidebarSubMenu from "@/components/sidebar/SidebarSubMenu";
import useGetCData from "@/hooks/useGetCData";

const SidebarContent = () => {
  const { t } = useTranslation();
  const { mode } = useContext(WindmillContext);
  const { dispatch } = useContext(AdminContext);
  const { accessList } = useGetCData();

  const handleLogOut = () => {
    dispatch({ type: "USER_LOGOUT" });
    Cookies.remove("adminInfo");
  };

  console.log("Original Sidebar Data:", sidebar);

  // Filter out undefined values from the Effective Access List
  const effectiveAccessList =
    Array.isArray(accessList) && accessList.length > 0
      ? accessList.filter(Boolean) // Remove undefined or falsy values
      : sidebar
          .map((route) => route.path?.split("?")[0].split("/")[1])
          .filter(Boolean);

  console.log("Effective Access List (Filtered):", effectiveAccessList);

  const updatedSidebar = sidebar
    .map((route) => {
      if (route.routes) {
        // Include all submenus regardless of accessList for now
        const validSubRoutes = route.routes.filter((subRoute) => {
          const routeKey = subRoute.path?.split("?")[0].split("/")[1];
          return (
            effectiveAccessList.includes(routeKey) || subRoute.outside || true // Include all submenus
          );
        });

        if (validSubRoutes.length > 0) {
          return { ...route, routes: validSubRoutes };
        }
        return null; // Exclude the main route if no sub-routes are valid
      }

      // Handle top-level routes
      const routeKey = route.path?.split("?")[0].split("/")[1];
      return routeKey && effectiveAccessList.includes(routeKey) ? route : null;
    })
    .filter(Boolean);

  console.log("Filtered Sidebar Data (Updated Sidebar):", updatedSidebar);

  return (
    <div className="py-4 text-gray-500 dark:text-gray-400">
      <a className=" text-gray-900 dark:text-gray-200" href="/dashboard">
        {mode === "dark" ? (
          <img src={logoLight} alt="Elecmoon" width="135" className="pl-6" />
        ) : (
          <img src={logoDark} alt="Elecmoon" width="135" className="pl-6" />
        )}
      </a>
      <ul className="mt-8">
        {updatedSidebar?.map((route) =>
          route.routes ? (
            <SidebarSubMenu route={route} key={route.name} />
          ) : (
            <li className="relative" key={route.name}>
              <NavLink
                exact
                to={route.path}
                target={`${route?.outside ? "_blank" : "_self"}`}
                className="px-6 py-4 inline-flex items-center w-full text-sm font-semibold transition-colors duration-150 hover:text-red-700 dark:hover:text-gray-200"
                activeStyle={{
                  color: "black",
                }}
                rel="noreferrer"
              >
                <route.icon className="w-5 h-5" aria-hidden="true" />
                <span className="ml-4">{t(`${route.name}`)}</span>
              </NavLink>
            </li>
          )
        )}
      </ul>
      <span className="px-6 py-6 w-full mx-auto mt-4 block">
        <Button onClick={handleLogOut} size="large" className="w-full">
          <span className="flex items-center justify-center">
            <IoLogOutOutline className="mr-3 text-lg" />
            <span className="text-sm">{t("LogOut")}</span>
          </span>
        </Button>
      </span>
    </div>
  );
};

export default SidebarContent;
