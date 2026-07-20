import Link from "next/link";
import { ImFacebook, ImGithub, ImGoogle } from "react-icons/im";
import { signIn } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";

import SettingServices from "@services/SettingServices";
import {
  appendRedirectUrl,
  getSafeRedirectUrl,
} from "@utils/authRedirect";

const BottomNavigation = ({ or, route, desc, pageName, loginTitle, redirectUrl }) => {
  const buttonStyles = `
    text-sm inline-flex items-center cursor-pointer transition ease-in-out duration-300 font-semibold text-center justify-center rounded-md focus:outline-none shadow-sm
    px-3 py-4 h-12 w-full mb-6 mr-2
  `;

  const authCallbackUrl = getSafeRedirectUrl(redirectUrl, "/user/dashboard");
  const linkedRoute = appendRedirectUrl(route, redirectUrl);

  const {
    error,
    isLoading,
    data: storeSetting,
  } = useQuery({
    queryKey: ["storeSetting"],
    queryFn: async () => await SettingServices.getStoreSetting(),
    staleTime: 4 * 60 * 1000,
  });

  return (
    <>
      {or && (
        <div className="my-4 text-center font-medium">
          <div className="after:bg-gray-100 before:bg-gray-100">OR</div>
        </div>
      )}

      {!error && !isLoading && (
        <div className="flex flex-col mb-4">
          {storeSetting?.google_login_status && (
            <button
              onClick={() =>
                signIn("google", {
                  callbackUrl: authCallbackUrl,
                  redirect: true,
                })
              }
              className={
                buttonStyles + "bg-gradient-to-r from-[#051124] to-[#0b1d3d] hover:from-[#0b1d3d] hover:to-[#162542] text-white shadow-[0_0_15px_rgba(255,255,255,0.3)]"
              }
            >
              <ImGoogle className="text-2xl" />
              <span className="ml-2">{loginTitle} With Google</span>
            </button>
          )}
          {storeSetting?.facebook_login_status && (
            <button
              onClick={() =>
                signIn("facebook", {
                  callbackUrl: authCallbackUrl,
                  redirect: true,
                })
              }
              className={
                buttonStyles + "bg-blue-500 text-white hover:bg-blue-600"
              }
            >
              <ImFacebook className="text-2xl" />
              <span className="ml-2">{loginTitle} With Facebook</span>
            </button>
          )}
          {storeSetting?.github_login_status && (
            <button
              onClick={() =>
                signIn("github", {
                  callbackUrl: authCallbackUrl,
                  redirect: true,
                })
              }
              className={
                buttonStyles + "bg-gray-700 text-white hover:bg-gray-900"
              }
            >
              <ImGithub className="text-2xl" />
              <span className="ml-2">{loginTitle} With Github</span>
            </button>
          )}
        </div>
      )}

      <div className="text-center text-sm text-gray-900 mt-4">
        <div className="text-gray-500 mt-2.5">
          {desc ? "Already have an account?" : "Don't have an account?"}
          <Link
            href={linkedRoute}
            className="text-gray-800 hover:text-cyan-500 font-bold mx-2"
          >
            <span className="capitalize">{pageName}</span>
          </Link>
        </div>
      </div>
    </>
  );
};

export default BottomNavigation;
