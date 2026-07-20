const SKIP_HREFS = new Set(["/pricing", "/pricing/"]);
const SKIP_TITLE = /^pricing$/i;

/** Old grocery template footer/nav links — not used on Elecmoon */
const LEGACY_GROCERY_TITLE =
  /^(fish\s*&\s*meat|soft\s*drink|milk\s*&\s*dairy|beauty\s*&\s*health|baby\s*care|fresh\s*vegetable|breakfast|drinks)$/i;
const LEGACY_GROCERY_HREF =
  /\/search\?(category=|Category=)(fish|meat|milk|dairy|drink|beauty|health|breakfast|vegetable|biscuit)/i;

const isLegacyGroceryLink = (title, href) => {
  const label = (title || "").trim();
  const url = (href || "").trim().toLowerCase();
  if (LEGACY_GROCERY_TITLE.test(label)) return true;
  if (LEGACY_GROCERY_HREF.test(url)) return true;
  const legacySlugs = [
    "fish-meat",
    "fish--meat",
    "milk-dairy",
    "beauty-health",
    "drinks",
    "breakfast",
    "fruits-vegetable",
    "biscuits",
    "fresh-vegetable",
  ];
  return legacySlugs.some((slug) => url.includes(slug));
};

const isValidLink = (title, href, blockNum) => {
  const label = (title || "").trim();
  const url = (href || "").trim();
  if (!label || label === "#") return false;
  if (SKIP_TITLE.test(label)) return false;
  if (SKIP_HREFS.has(url.toLowerCase())) return false;
  if (url === "#" || url === "!#") return false;
  if (isLegacyGroceryLink(label, url)) return false;
  if (blockNum === 2 && /\/search\?/i.test(url)) return false;
  return true;
};

/** Parse admin footer block (1–3) into { title, links[] } */
export const getFooterBlock = (footer, blockNum, showingTranslateValue) => {
  if (!footer || footer[`block${blockNum}_status`] === false) return null;

  const title =
    showingTranslateValue?.(footer[`block${blockNum}_title`]) ||
    footer[`block${blockNum}_title`]?.en ||
    "";

  const links = [1, 2, 3, 4]
    .map((i) => {
      const linkTitle =
        showingTranslateValue?.(footer[`block${blockNum}_sub_title${i}`]) ||
        footer[`block${blockNum}_sub_title${i}`]?.en ||
        "";
      const href = footer[`block${blockNum}_sub_link${i}`] || "";
      return { title: linkTitle, href };
    })
    .filter(({ title, href }) => isValidLink(title, href, blockNum));

  if (!title?.trim() && links.length === 0) return null;

  return {
    title: title?.trim() || (blockNum === 1 ? "General Links" : "Legal & Policies"),
    links,
  };
};

export const FOOTER_FALLBACK = {
  general: {
    title: "General Links",
    links: [
      { title: "Home", href: "/" },
      { title: "About Us", href: "/about-us" },
      { title: "Blog", href: "/blog" },
      { title: "Contact Us", href: "/contact-us" },
    ],
  },
  legal: {
    title: "Legal & Policies",
    links: [
      { title: "Privacy Policy", href: "/privacy-policy" },
      { title: "Terms & Conditions", href: "/terms-and-conditions" },
      { title: "Shipping Policy", href: "/shipping-policy" },
      { title: "Return & Refund Policy", href: "/return-and-refund-policy" },
    ],
  },
};

export const getFooterSocialLinks = (footer) => {
  if (!footer || footer.social_links_status === false) return [];

  const items = [
    { key: "facebook", href: footer.social_facebook, label: "Facebook" },
    { key: "instagram", href: footer.social_instagram, label: "Instagram" },
    { key: "linkedin", href: footer.social_linkedin, label: "LinkedIn" },
    { key: "twitter", href: footer.social_twitter, label: "Twitter" },
    { key: "whatsapp", href: footer.social_whatsapp, label: "WhatsApp" },
  ];

  return items.filter(({ href }) => {
    const url = (href || "").trim();
    return url && url !== "#" && url !== "!#";
  });
};
