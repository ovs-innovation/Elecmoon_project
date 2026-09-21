import React, { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaTwitter,
  FaWhatsapp,
  FaYoutube,
  FaPinterestP,
} from "react-icons/fa";
import { FiHeadphones } from "react-icons/fi";

import useGetSetting from "@hooks/useGetSetting";
import {
  getFooterSocialLinks,
  FOOTER_FALLBACK,
} from "@utils/footerLinks";

const SOCIAL_ICONS = {
  facebook: FaFacebookF,
  twitter: FaTwitter,
  whatsapp: FaWhatsapp,
  pinterest: FaPinterestP,
  linkedin: FaLinkedinIn,
  instagram: FaInstagram,
  youtube: FaYoutube,
};

const DEFAULT_SOCIALS = [
  { key: "facebook", href: "https://facebook.com", label: "Facebook" },
  { key: "twitter", href: "https://twitter.com", label: "Twitter" },
  { key: "whatsapp", href: "https://wa.me/", label: "WhatsApp" },
  { key: "pinterest", href: "https://pinterest.com", label: "Pinterest" },
  { key: "linkedin", href: "https://linkedin.com", label: "LinkedIn" },
  { key: "instagram", href: "https://instagram.com", label: "Instagram" },
  { key: "youtube", href: "https://youtube.com", label: "YouTube" },
];

const headingClass =
  "font-serif text-[13px] font-bold uppercase tracking-wide text-[#111] mb-4 leading-5 min-h-[20px]";

const linkClass =
  "text-[14px] leading-6 text-[#334155] hover:text-[#ED1C24] transition-colors";

const FooterColumn = ({ title, links }) => (
  <div className="min-w-0">
    <h3 className={headingClass}>{title}</h3>
    <ul className="space-y-2.5">
      {links.map(({ title: label, href }) => (
        <li key={`${href}-${label}`}>
          <Link href={href} className={linkClass}>
            {label}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

const Footer = () => {
  const { storeCustomizationSetting } = useGetSetting();
  const footer = storeCustomizationSetting?.footer;
  const navbar = storeCustomizationSetting?.navbar;

  const footerPhone =
    footer?.block4_phone || navbar?.phone || "+91 00000 00000";
  const footerEmail =
    footer?.block4_email ||
    storeCustomizationSetting?.contact_us?.email_box_email?.en ||
    "elecmoonofficial@gmail.com";

  const policies = FOOTER_FALLBACK.policies;
  const information = FOOTER_FALLBACK.information;
  const account = FOOTER_FALLBACK.account;

  const socialLinks = useMemo(() => {
    const fromAdmin = getFooterSocialLinks(footer);
    if (!fromAdmin.length) return DEFAULT_SOCIALS;
    const byKey = Object.fromEntries(fromAdmin.map((s) => [s.key, s]));
    return DEFAULT_SOCIALS.map((s) => byKey[s.key] || s).filter(
      (s) => SOCIAL_ICONS[s.key]
    );
  }, [footer]);

  return (
    <footer className="bg-[#f7f7f7] text-[#222] border-t-[3px] border-[#ED1C24]">
      <div className="max-w-screen-2xl mx-auto px-5 sm:px-8 lg:px-12 xl:px-16 py-10 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-x-10 gap-y-10 xl:gap-x-12 items-start">
          {/* Brand — same top edge as other columns */}
          <div className="sm:col-span-2 xl:col-span-1 min-w-0">
            <Link href="/" className="inline-block mb-4">
              <div className="relative h-[96px] w-[280px] max-w-full">
                <Image
                  src="/logo/elecmoon-transparent.png"
                  alt="Elecmoon"
                  fill
                  sizes="280px"
                  className="object-contain object-left scale-[1.35] origin-left"
                />
              </div>
            </Link>

            <div className="flex items-start gap-2.5 mb-5">
              <FiHeadphones className="w-4 h-4 text-[#666] mt-1 shrink-0" />
              <div className="text-[13px] leading-relaxed text-[#555]">
                <p>
                  Call Us:{" "}
                  <a
                    href={`tel:${String(footerPhone).replace(/\s/g, "")}`}
                    className="font-semibold text-[#ED1C24] hover:underline"
                  >
                    {footerPhone}
                  </a>
                </p>
                <p className="text-[12px] text-[#888] mt-0.5">
                  9am to 6pm (Sun Off)
                </p>
                <p className="mt-2">
                  Email Us:{" "}
                  <a
                    href={`mailto:${footerEmail}`}
                    className="font-semibold text-[#ED1C24] hover:underline"
                  >
                    {footerEmail}
                  </a>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {socialLinks.map(({ key, href, label }) => {
                const Icon = SOCIAL_ICONS[key];
                if (!Icon) return null;
                return (
                  <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="w-8 h-8 rounded-full bg-[#555] text-white flex items-center justify-center hover:bg-[#ED1C24] transition-colors"
                  >
                    <Icon className="w-[13px] h-[13px]" />
                  </a>
                );
              })}
            </div>
          </div>

          <FooterColumn title={policies.title} links={policies.links} />
          <FooterColumn title={information.title} links={information.links} />
          <FooterColumn title={account.title} links={account.links} />
        </div>
      </div>

      <div className="bg-[#ececec] border-t border-[#e0e0e0]">
        <div className="max-w-screen-2xl mx-auto px-5 sm:px-8 lg:px-12 xl:px-16 py-3.5">
          <p className="text-center text-[12px] text-[#777]">
            © {new Date().getFullYear()} Elecmoon — All rights reserved
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
