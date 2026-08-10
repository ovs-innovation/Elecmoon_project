import { toast } from "react-toastify";
import { signOut } from "next-auth/react";
import Cookies from "js-cookie";
import { setToken } from "@services/httpServices";

export const SESSION_EXPIRED_TOAST_ID = "session-expired";

let sessionExpiredHandling = false;

export function isSessionExpiredError(error) {
  const status = error?.response?.status;
  if (status !== 401) return false;

  const msg = String(
    error?.response?.data?.message || error?.message || ""
  ).toLowerCase();

  return (
    msg.includes("jwt expired") ||
    msg.includes("token expired") ||
    msg.includes("invalid token") ||
    msg.includes("authorization token") ||
    msg.includes("session has expired") ||
    msg.includes("please sign in")
  );
}

export function getFriendlyErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  if (isSessionExpiredError(error)) {
    return "Your session has expired. Please sign in again to continue.";
  }
  const raw = error?.response?.data?.message || error?.message || "";
  if (!raw || /^jwt/i.test(raw) || /token expired/i.test(raw)) {
    return fallback;
  }
  return raw;
}

export function markAuthErrorHandled(error) {
  if (error) {
    error.authHandled = true;
  }
}

export function wasAuthErrorHandled(error) {
  return Boolean(error?.authHandled);
}

/**
 * Single deduplicated session-expired UX: one toast, clear token, redirect to login.
 */
export async function handleSessionExpired({ redirect = true } = {}) {
  if (sessionExpiredHandling) return true;
  sessionExpiredHandling = true;

  toast.dismiss();

  toast.error(
    "Your session has expired. Please sign in again to complete your order.",
    {
      toastId: SESSION_EXPIRED_TOAST_ID,
      autoClose: 6000,
      position: "top-center",
      hideProgressBar: false,
      closeOnClick: true,
    }
  );

  setToken(null);
  Cookies.remove("userInfo");
  Cookies.remove("couponInfo");

  try {
    await signOut({ redirect: false });
  } catch (_) {
    /* ignore */
  }

  if (redirect && typeof window !== "undefined") {
    const returnPath =
      window.location.pathname + window.location.search || "/checkout";
    const loginUrl = `/auth/login?redirectUrl=${encodeURIComponent(returnPath)}`;
    window.setTimeout(() => {
      window.location.href = loginUrl;
    }, 1200);
  }

  window.setTimeout(() => {
    sessionExpiredHandling = false;
  }, 5000);

  return true;
}

export function isJwtExpired(token) {
  if (!token) return true;
  try {
    const payload = JSON.parse(
      atob(String(token).split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
    );
    if (!payload?.exp) return false;
    return payload.exp * 1000 <= Date.now();
  } catch (_) {
    return true;
  }
}
