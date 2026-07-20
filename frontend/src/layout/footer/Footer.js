import React, { useContext, useMemo } from "react";
import Link from "next/link";
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaTwitter, FaWhatsapp } from "react-icons/fa";
import { FiPhoneCall, FiMail, FiMapPin } from "react-icons/fi";

import useGetSetting from "@hooks/useGetSetting";
import useUtilsFunction from "@hooks/useUtilsFunction";
import { SidebarContext } from "@context/SidebarContext";
import {
  getFooterBlock,
  getFooterSocialLinks,
  FOOTER_FALLBACK,
} from "@utils/footerLinks";

const SOCIAL_ICONS = {
  facebook: FaFacebookF,
  instagram: FaInstagram,
  linkedin: FaLinkedinIn,
  twitter: FaTwitter,
  whatsapp: FaWhatsapp,
};

const FooterLinkColumn = ({ title, links }) => {
  if (!links?.length) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-black">{title}</h3>
      <ul className="space-y-2 text-sm text-gray-700">
        {links.map(({ title: linkTitle, href }) => (
          <li key={`${href}-${linkTitle}`}>
            <Link href={href} className="hover:text-[#ED1C24] transition">
              {linkTitle}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

const Footer = () => {
  const { storeCustomizationSetting } = useGetSetting();
  const { showingTranslateValue } = useUtilsFunction();
  const { services } = useContext(SidebarContext);

  const footer = storeCustomizationSetting?.footer;
  const footerPhone = footer?.block4_phone;
  const footerAddress = showingTranslateValue(footer?.block4_address);
  const footerEmail =
    footer?.block4_email ||
    storeCustomizationSetting?.contact_us?.email_box_email?.en ||
    "elecmoonofficial@gmail.com";

  const generalBlock = useMemo(() => {
    const fromAdmin = getFooterBlock(footer, 1, showingTranslateValue);
    if (fromAdmin?.links?.length) return fromAdmin;
    return FOOTER_FALLBACK.general;
  }, [footer, showingTranslateValue]);

  const legalBlock = useMemo(() => {
    const fromAdmin = getFooterBlock(footer, 2, showingTranslateValue);
    if (fromAdmin?.links?.length) return fromAdmin;
    return FOOTER_FALLBACK.legal;
  }, [footer, showingTranslateValue]);

  const socialLinks = useMemo(() => getFooterSocialLinks(footer), [footer]);

  const aboutText =
    showingTranslateValue(footer?.shipping_card) ||
    "At Elecmoon, we specialize in high-quality BMS, battery cells, and energy storage solutions for EV, solar, and industrial applications.";

  return (
    <div className="bg-gray-100 text-gray-900 pt-10 pb-16 relative">
      <div className="absolute right-0 top-0 bottom-0 w-1 bg-[#ED1C24]" aria-hidden />

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-12">
          {/* About */}
          <div className="space-y-4">
            <Link href="/" className="inline-block">
              <div className="relative overflow-hidden flex items-center h-[48px] sm:h-[58px] lg:h-[68px] xl:h-[78px] w-[150px] sm:w-[190px] lg:w-[230px] xl:w-[260px]">
                <img
                  src="/logo/elecmoon-transparent.png"
                  alt="ELECMOON"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-auto object-contain object-left origin-left h-[160%] scale-[1.55] sm:scale-[1.6] lg:scale-[1.65]"
                />
              </div>
            </Link>
            <p className="text-sm leading-7 text-gray-700">{aboutText}</p>

            {socialLinks.length > 0 ? (
              <div className="flex flex-wrap gap-3 pt-2">
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
                      className="w-10 h-10 rounded-full bg-[#000435] text-white flex items-center justify-center hover:bg-[#ED1C24] transition"
                    >
                      <Icon />
                    </a>
                  );
                })}
              </div>
            ) : null}
          </div>

          {/* Contact — from admin footer block 4 */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-black">Contact Info</h3>
            <div className="text-sm space-y-3 text-gray-700">
              {footerPhone ? (
                <div className="flex items-start gap-2">
                  <FiPhoneCall className="text-[#ED1C24] mt-1 flex-shrink-0" />
                  <a
                    href={`tel:${footerPhone.replace(/\s/g, "")}`}
                    className="font-medium hover:text-[#ED1C24] transition"
                  >
                    {footerPhone}
                  </a>
                </div>
              ) : null}
              <div className="flex items-start gap-2">
                <FiMail className="text-[#ED1C24] mt-1 flex-shrink-0" />
                <a
                  href={`mailto:${footerEmail}`}
                  className="font-medium hover:text-[#ED1C24] transition break-all"
                >
                  {footerEmail}
                </a>
              </div>
              {footerAddress ? (
                <div className="flex items-start gap-2">
                  <FiMapPin className="text-[#ED1C24] mt-1 flex-shrink-0" />
                  <p>{footerAddress}</p>
                </div>
              ) : null}
            </div>
          </div>

          {/* Services — database */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-black">Services</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              {services?.length > 0 ? (
                <>
                  {services.map((service) => {
                    const name = showingTranslateValue(service.name);
                    if (!name) return null;
                    const href = service.slug ? `/service/${service.slug}` : "/services";
                    return (
                      <li key={service._id}>
                        <Link href={href} className="hover:text-[#ED1C24] transition">
                          {name}
                        </Link>
                      </li>
                    );
                  })}
                  <li>
                    <Link
                      href="/services"
                      className="font-semibold text-[#ED1C24] hover:underline transition"
                    >
                      View All Services →
                    </Link>
                  </li>
                </>
              ) : (
                <li className="text-gray-400 text-xs">No services available.</li>
              )}
            </ul>
          </div>

          {/* General Links — admin footer block 1 */}
          <FooterLinkColumn title={generalBlock.title} links={generalBlock.links} />

          {/* Legal — admin footer block 2 */}
          <FooterLinkColumn title={legalBlock.title} links={legalBlock.links} />
        </div>

        <div className="mt-10 pt-6 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} Elecmoon. All rights reserved.</p>
          {legalBlock.links.length > 0 ? (
            <div className="flex flex-wrap items-center justify-center gap-4">
              {legalBlock.links.slice(0, 4).map(({ title, href }) => (
                <Link key={href} href={href} className="hover:text-[#ED1C24] transition">
                  {title.replace(/ Policy| & Conditions/g, "")}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default Footer;
