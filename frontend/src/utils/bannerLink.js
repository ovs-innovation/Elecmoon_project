/** Normalize admin slider / banner links for Next.js routing */
export const resolveBannerHref = (href) => {
  if (!href || typeof href !== "string") return null;
  const trimmed = href.trim();
  if (!trimmed || trimmed === "#" || trimmed === "!#") return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/")) return trimmed;
  if (/^(product|category|categories|search|blog|service)\//i.test(trimmed)) {
    return `/${trimmed.replace(/^\/+/, "")}`;
  }
  return `/${trimmed.replace(/^\/+/, "")}`;
};

export const isExternalHref = (href) =>
  typeof href === "string" && /^https?:\/\//i.test(href);

/** Old grocery template category slugs still present in some admin slider links */
const LEGACY_GROCERY_SLUGS = [
  "milk-dairy",
  "fish-meat",
  "fish--meat",
  "fruits-vegetable",
  "fresh-vegetable",
  "beauty-health",
  "breakfast",
  "drinks",
  "biscuits",
  "soft-drink",
  "baby-care",
];

const isLegacyGroceryHref = (href) => {
  const lower = String(href || "").toLowerCase();
  return LEGACY_GROCERY_SLUGS.some((slug) => lower.includes(slug));
};

/**
 * Shop Now / slider CTA destination.
 * - Uses admin link when valid
 * - Maps /categories/:slug → /category/:slug
 * - Rejects empty + legacy grocery links
 * - Falls back to homepage categories section
 */
export const resolveShopNowHref = (href, fallback = "/#categories") => {
  let resolved = resolveBannerHref(href);
  if (!resolved) return fallback;

  // Admin sometimes stores "categories/milk-dairy" (plural) — site uses /category/
  resolved = resolved.replace(/^\/categories(\/|$)/i, "/category$1");

  if (isLegacyGroceryHref(resolved)) return fallback;

  // Block unknown /categories root without slug
  if (/^\/categories\/?$/i.test(resolved)) return fallback;

  return resolved;
};
