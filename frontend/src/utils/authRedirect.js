export const getSafeRedirectUrl = (redirectUrl, fallback = "/") => {
  if (
    typeof redirectUrl === "string" &&
    redirectUrl.startsWith("/") &&
    !redirectUrl.startsWith("//")
  ) {
    return redirectUrl;
  }
  return fallback;
};

export const appendRedirectUrl = (path, redirectUrl) => {
  const safe = getSafeRedirectUrl(redirectUrl, null);
  if (!safe || safe === "/") return path;
  const joiner = path.includes("?") ? "&" : "?";
  return `${path}${joiner}redirectUrl=${encodeURIComponent(safe)}`;
};

export const isCheckoutRedirect = (redirectUrl) =>
  typeof redirectUrl === "string" && redirectUrl.startsWith("/checkout");
