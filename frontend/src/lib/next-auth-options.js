// dynamicSettings.js
import { QueryClient } from "@tanstack/react-query";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Facebook from "next-auth/providers/facebook";
import Credentials from "next-auth/providers/credentials";

import SettingServices from "@services/SettingServices";
import CustomerServices from "@services/CustomerServices";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const getDynamicAuthOptions = async () => {
  // Fetch store settings from the cache or trigger a fetch if not cached
  const storeSetting = await queryClient.fetchQuery({
    queryKey: ["storeSetting"],
    queryFn: async () => {
      try {
        return await SettingServices.getStoreSetting();
      } catch (error) {
        console.error("Error fetching store settings:", error);
        return {}; // Return an empty object as a fallback
      }
    },
    staleTime: 4 * 60 * 1000, // Api request after 4 minutes
  });

  // console.log("storeSetting", storeSetting);

  const providers = [
    Google({
      clientId: storeSetting?.google_id || "",
      clientSecret: storeSetting?.google_secret || "",
    }),
    GitHub({
      clientId: storeSetting?.github_id || "",
      clientSecret: storeSetting?.github_secret || "",
    }),
    Facebook({
      clientId: storeSetting?.facebook_id || "",
      clientSecret: storeSetting?.facebook_secret || "",
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        otp: { label: "OTP", type: "text" },
        loginType: { label: "Login Type", type: "text" },
        name: { label: "Name", type: "text" },
      },
      authorize: async (credentials) => {
        try {
          if (credentials?.loginType === "signup-otp" && credentials?.otp) {
            const userInfo = await CustomerServices.verifySignupOtp({
              name: credentials.name,
              email: credentials.email,
              otp: credentials.otp,
            });
            return userInfo;
          }

          if (credentials?.loginType === "otp" && credentials?.otp) {
            const userInfo = await CustomerServices.verifyLoginOtp({
              email: credentials.email,
              otp: credentials.otp,
            });
            return userInfo;
          }

          const userInfo = await CustomerServices.loginCustomer(credentials);
          return userInfo;
        } catch (error) {
          // Handle custom error from backend
          const message =
            error.response?.data?.message || "Login failed! Please try again.";
          throw new Error(message); // Propagate error to client
        }
      },
    }),
  ];

  const authOptions = {
    providers,
    callbacks: {
      async signIn({ user, account }) {
        if (account.provider !== "credentials") {
          try {
            const res = await CustomerServices.signUpWithOauthProvider(user);

            // if (error) {
            //   console.error("OAuth sign-in error:", error);
            //   return false;
            // }

            if (res.token) {
              user.token = res.token;
              user._id = res._id;
              user.address = res.address;
              user.phone = res.phone;
              user.image = res.image;
              user.cart = res.cart || [];
              user.wishlist = res.wishlist || [];
            } else {
              console.error("OAuth sign-in: No token received");
              return false;
            }
          } catch (error) {
            console.error("OAuth sign-in exception:", error);
            return false;
          }
        }
        return true;
      },
      async jwt({ token, user, trigger, session }) {
        if (user) {
          token.id = user._id;
          token.name = user.name;
          token.email = user.email;
          token.address = user.address;
          token.phone = user.phone;
          token.image = user.image;
          token.token = user.token;
          token.cart = user.cart || [];
          token.wishlist = user.wishlist || [];
        }

        if (trigger === "update" && session) {
          return {
            ...token,
            ...session.user,
          };
        }

        return token;
      },
      async session({ session, token }) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.address = token.address;
        session.user.phone = token.phone;
        session.user.image = token.image;
        session.user.token = token.token;
        session.user.cart = token.cart || [];
        session.user.wishlist = token.wishlist || [];

        return session;
      },
      async redirect({ url, baseUrl }) {
        // console.log("url", url, "baseUrl", baseUrl);
        return url.startsWith(baseUrl) ? url : `${baseUrl}/user/dashboard`;
      },
    },
    secret: process.env.NEXTAUTH_SECRET,
  };

  return authOptions;
};
