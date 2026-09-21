/** Normalize category slug (match backend slugify) */
export const getCategorySlug = (name) => {
  if (!name || typeof name !== "string") return "";
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "");
};

export const resolveCategorySlug = (categoryOrId, name, slug) => {
  const raw =
    (slug && typeof slug === "string" && slug.trim()) ||
    (categoryOrId &&
      typeof categoryOrId === "object" &&
      categoryOrId.slug &&
      String(categoryOrId.slug).trim()) ||
    "";

  if (raw) {
    return raw
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "");
  }

  if (categoryOrId && typeof categoryOrId === "object") {
    return getCategorySlug(
      typeof categoryOrId.name === "string"
        ? categoryOrId.name
        : categoryOrId.name?.en || ""
    );
  }

  return getCategorySlug(name);
};

/** SEO-friendly category listing URL — always keep _id as fallback */
export const getCategorySearchUrl = (id, name, slug) => {
  const resolvedSlug = resolveCategorySlug(null, name, slug);
  if (resolvedSlug && id) {
    return `/category/${resolvedSlug}?_id=${id}`;
  }
  if (resolvedSlug) return `/category/${resolvedSlug}`;
  return id ? `/search?_id=${id}` : "/search";
};

/** Legacy search URL — kept for redirects */
export const getLegacyCategorySearchUrl = (id, name) => {
  const s = getCategorySlug(name);
  return s ? `/search?category=${s}&_id=${id}` : `/search?_id=${id}`;
};
