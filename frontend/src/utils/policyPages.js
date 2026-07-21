export const POLICY_LINKS = [
  { id: "privacy-policy", href: "/privacy-policy", label: "Privacy Policy" },
  { id: "terms-and-conditions", href: "/terms-and-conditions", label: "Terms & Conditions" },
  { id: "shipping-policy", href: "/shipping-policy", label: "Shipping Policy" },
  { id: "return-and-refund-policy", href: "/return-and-refund-policy", label: "Return & Refund Policy" },
];

export const flattenPolicySections = (sections = []) => {
  const blocks = [];

  sections.forEach((section) => {
    section.paragraphs?.forEach((text) => {
      if (text) blocks.push({ type: "paragraph", text });
    });

    if (section.link) {
      blocks.push({
        type: "link",
        prefix: section.linkPrefix || "",
        href: section.link.href,
        label: section.link.label,
      });
    }

    section.list?.forEach((text) => {
      if (text) blocks.push({ type: "paragraph", text });
    });

    section.paragraphsAfter?.forEach((text) => {
      if (text) blocks.push({ type: "paragraph", text });
    });
  });

  return blocks;
};

export const getPrivacyPolicySections = (t) => [
  { paragraphs: [t("privacy-s1-p1"), t("privacy-s1-p2")] },
  { paragraphs: [t("privacy-s2-p1"), t("privacy-s2-p2")] },
  { paragraphs: [t("privacy-s3-p1")] },
  { paragraphs: [t("privacy-s4-p1")] },
  { paragraphs: [t("privacy-s5-p1")] },
  { paragraphs: [t("privacy-s6-p1")] },
  { paragraphs: [t("privacy-s7-p1")] },
  { paragraphs: [t("privacy-s8-p1")] },
  { paragraphs: [t("privacy-s9-p1")] },
];

export const getTermsPolicySections = (t) => [
  { paragraphs: [t("terms-s1-p1"), t("terms-s1-p2")] },
  { paragraphs: [t("terms-s2-p1")] },
  { paragraphs: [t("terms-s3-p1")] },
  { paragraphs: [t("terms-s4-p1")] },
  { paragraphs: [t("terms-s5-p1")] },
  {
    linkPrefix: t("terms-s6-p1"),
    link: { href: "/privacy-policy", label: t("terms-s6-link") },
  },
  { paragraphs: [t("terms-s7-p1")] },
];

export const getShippingPolicySections = (t) => [
  { paragraphs: [t("shipping-s1-p1")] },
  { paragraphs: [t("shipping-s2-p1")] },
  { paragraphs: [t("shipping-s3-p1"), t("shipping-s3-p2")] },
  { paragraphs: [t("shipping-s4-p1")] },
  { paragraphs: [t("shipping-s5-p1")] },
  { paragraphs: [t("shipping-s6-p1")] },
];

export const getReturnRefundPolicySections = (t) => [
  { paragraphs: [t("return-s1-p1")] },
  {
    paragraphs: [
      t("return-s2-p1"),
      t("return-s2-l1"),
      t("return-s2-l2"),
      t("return-s2-l3"),
    ],
  },
  { paragraphs: [t("return-s3-p1")] },
  { paragraphs: [t("return-s4-p1")] },
  { paragraphs: [t("return-s5-p1")] },
  { paragraphs: [t("return-s6-p1")] },
  { paragraphs: [t("return-s7-p1")] },
];
