import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useState, useEffect, useContext, useRef } from "react";
import Cookies from "js-cookie";
import { signOut } from "next-auth/react";
import {
  FiMenu, FiX, FiChevronDown, FiChevronRight, FiUser,
  FiShoppingBag, FiSearch, FiHeart, FiPhoneCall,
  FiMapPin, FiCheckCircle, FiGrid, FiPackage, FiLogOut
} from "react-icons/fi";
import { useCart } from "react-use-cart";

import useUtilsFunction from "@hooks/useUtilsFunction";
import useGetSetting from "@hooks/useGetSetting";
import { UserContext } from "@context/UserContext";
import { SidebarContext } from "@context/SidebarContext";
import { WishlistContext } from "@context/WishlistContext";
import { getCategorySearchUrl } from "@utils/categoryUrl";
import { isCloudinaryUrl, optimizeImageUrl } from "@utils/cloudinaryImage";
import NavbarSearch from "@components/navbar/NavbarSearch";

const CategoryNavIcon = ({ src, alt }) => {
  const [failed, setFailed] = useState(false);
  const showImage = src && !failed;

  if (!showImage) {
    return (
      <span className="w-9 h-9 rounded-lg bg-gray-100 flex-shrink-0 flex items-center justify-center">
        <FiGrid className="w-4 h-4 text-gray-400" aria-hidden />
      </span>
    );
  }

  const imageSrc = optimizeImageUrl(src, { width: 72 });

  return (
    <span className="relative w-9 h-9 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0">
      <Image
        src={imageSrc}
        alt={alt || "Category"}
        fill
        sizes="36px"
        className="object-contain p-1"
        unoptimized={isCloudinaryUrl(imageSrc)}
        onError={() => setFailed(true)}
      />
    </span>
  );
};

const Navbar = () => {
  const router = useRouter();
  const [openDropdown, setOpenDropdown] = useState(null);
  const [pinnedDropdown, setPinnedDropdown] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const { state: { userInfo } } = useContext(UserContext);
  const { storeCustomizationSetting } = useGetSetting();
  const { toggleCartDrawer, categories, services, isCategoriesLoading } = useContext(SidebarContext);
  const { items, emptyCart, cartTotal } = useCart();
  const { totalWishlistItems, clearWishlist } = useContext(WishlistContext);
  const { showingTranslateValue, getNumberTwo, currency } = useUtilsFunction();

  const handleLogOut = () => {
    signOut();
    Cookies.remove("userInfo");
    Cookies.remove("couponInfo");
    Cookies.remove("shippingAddress");
    emptyCart();
    if (typeof clearWishlist === 'function') clearWishlist();
    router.push("/");
  };

  useEffect(() => {
    setOpenDropdown(null);
    setPinnedDropdown(null);
    setMobileMenuOpen(false);
    setMobileServicesOpen(false);
    setMobileCategoriesOpen(false);
  }, [router.asPath]);

  // Close desktop dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest("[data-nav-dropdown]")) {
        setOpenDropdown(null);
        setPinnedDropdown(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const dropdownLeaveTimer = useRef(null);

  const isDropdownOpen = (key) => openDropdown === key;

  const handleDropdownEnter = (key) => {
    if (dropdownLeaveTimer.current) {
      clearTimeout(dropdownLeaveTimer.current);
      dropdownLeaveTimer.current = null;
    }
    setOpenDropdown(key);
  };

  const handleDropdownLeave = (key) => {
    dropdownLeaveTimer.current = setTimeout(() => {
      if (pinnedDropdown !== key) setOpenDropdown(null);
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (dropdownLeaveTimer.current) {
        clearTimeout(dropdownLeaveTimer.current);
      }
    };
  }, []);

  const handleDropdownToggle = (key) => {
    if (openDropdown === key && pinnedDropdown === key) {
      setOpenDropdown(null);
      setPinnedDropdown(null);
      return;
    }
    setOpenDropdown(key);
    setPinnedDropdown(key);
  };

  const closeDropdown = () => {
    setOpenDropdown(null);
    setPinnedDropdown(null);
  };

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => { if (window.innerWidth >= 1024) setMobileMenuOpen(false); };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const phone = storeCustomizationSetting?.navbar?.phone;
  const email = storeCustomizationSetting?.contact_us?.email_box_email?.en || "elecmoonofficial@gmail.com";
  const address = showingTranslateValue(storeCustomizationSetting?.contact_us?.address_box_address_one);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about-us" },
    { name: "Blog", href: "/blog" },
    { name: "FAQ", href: "/faq" },
    { name: "Contact", href: "/contact-us" },
  ];

  const handleSearch = (term) => {
    const query = (term ?? searchQuery).trim();
    if (query) {
      setSearchQuery("");
    }
  };

  const cartCount = items?.length || 0;
  const wishlistCount = totalWishlistItems || 0;

  const displayName = userInfo?.name?.trim() || "My Account";
  const userEmail = userInfo?.email?.trim() || "";

  const navActionBtn =
    "inline-flex items-center justify-center gap-1.5 h-9 px-2 md:px-2.5 rounded-xl flex-shrink-0 transition-all duration-200";

  const accountMenuItems = userInfo
    ? [
        { label: "My Account", href: "/user/dashboard", icon: FiUser },
        { label: "Orders", href: "/user/my-orders", icon: FiPackage },
        { label: "Wishlist", href: "/user/wishlist", icon: FiHeart },
      ]
    : [{ label: "Login / Register", href: "/auth/login", icon: FiUser }];

  return (
    <>
      <div className={`sticky top-0 z-50 transition-shadow duration-300 ${isScrolled ? "shadow-[0_4px_24px_rgba(0,0,0,0.12)]" : "shadow-[0_2px_16px_rgba(0,0,0,0.08)]"}`}>

        {/* ── Top bar ── */}
        <div className="bg-[#0b1d3d] border-b border-white/5">
          <div className="max-w-screen-2xl mx-auto px-3 sm:px-4 lg:px-8 min-h-8 py-1 sm:py-0 sm:h-8 flex flex-wrap sm:flex-nowrap items-center justify-between gap-1 sm:gap-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-5 text-[9px] sm:text-[10px] font-semibold text-white/50 uppercase tracking-wider overflow-hidden min-w-0 flex-1">
              <a href={phone ? `tel:${phone}` : undefined} className="flex items-center gap-1.5 hover:text-white transition-colors whitespace-nowrap flex-shrink-0 min-w-0">
                <FiPhoneCall className="w-3 h-3 text-[#ED1C24] flex-shrink-0" />
                <span className="text-white/40 flex-shrink-0">Contact:</span>
                <span className="truncate normal-case tracking-normal font-medium text-white/70 max-w-[140px] sm:max-w-none">{phone}</span>
              </a>
              <span className="hidden md:flex items-center gap-1.5 min-w-0 max-w-[55vw] lg:max-w-[50%]">
                <FiMapPin className="w-3 h-3 text-[#ED1C24] flex-shrink-0" />
                <span className="text-white/40 flex-shrink-0">Store Address:</span>
                <span className="truncate normal-case tracking-normal font-medium text-white/70">{address}</span>
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 text-[9px] sm:text-[10px] font-semibold text-white/50 uppercase tracking-wider flex-shrink-0">
              <a href="https://www.shiprocket.in/shipment-tracking/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors whitespace-nowrap">Track Order</a>
              <span className="hidden md:flex items-center gap-1.5 whitespace-nowrap">
                <FiCheckCircle className="w-3 h-3 text-[#ED1C24]" />
                <span className="text-white/30">Authorized Partner</span>
              </span>
            </div>
          </div>
        </div>

        {/* ── Main header ── */}
        <div className="bg-white py-2">
          <div className="max-w-screen-2xl mx-auto px-4 lg:px-8">
            <div className="flex items-center gap-2 lg:gap-4 min-w-0">

              {/* Logo */}
              <Link href="/" className="flex-shrink-0">
                <div className="relative overflow-hidden flex items-center h-[48px] sm:h-[58px] lg:h-[68px] xl:h-[78px] w-[150px] sm:w-[190px] lg:w-[230px] xl:w-[260px]">
                  <img
                    src="/logo/elecmoon-transparent.png"
                    alt="ELECMOON"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-auto object-contain object-left origin-left h-[160%] scale-[1.55] sm:scale-[1.6] lg:scale-[1.65]"
                  />
                </div>
              </Link>

              {/* Nav links — desktop only, left of center */}
              <nav className="hidden lg:flex items-center gap-3 xl:gap-5 flex-shrink-0">
                {navLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`text-[12px] xl:text-[13px] font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${router.pathname === item.href ? 'text-[#ED1C24]' : 'text-gray-500 hover:text-[#0b1d3d]'}`}
                  >
                    {item.name}
                  </Link>
                ))}
                {/* Services Dropdown */}
                <div
                  data-nav-dropdown
                  className="relative"
                  onMouseEnter={() => handleDropdownEnter("services")}
                  onMouseLeave={() => handleDropdownLeave("services")}
                >
                  <button
                    type="button"
                    onClick={() => handleDropdownToggle("services")}
                    className={`flex items-center gap-1 text-[12px] xl:text-[13px] font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${isDropdownOpen("services") ? "text-[#0b1d3d]" : "text-gray-500 hover:text-[#0b1d3d]"}`}
                  >
                    Services <FiChevronDown className={`w-3.5 h-3.5 transition-transform ${isDropdownOpen("services") ? "rotate-180" : ""}`} />
                  </button>
                  <div className={`absolute top-full pt-2 left-0 w-56 bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.12)] border border-gray-100 transition-all duration-200 origin-top z-[70] overflow-hidden ${isDropdownOpen("services") ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-2 pointer-events-none"}`}>
                    <div className="py-2">
                      {services.length > 0 ? services.map((service) => {
                        const name = showingTranslateValue(service.name);
                        if (!name) return null;
                        const href = service.slug ? `/service/${service.slug}` : `/services`;
                        return (
                          <Link key={service._id} href={href} onClick={closeDropdown} className="block px-5 py-2.5 text-[12px] font-bold text-gray-600 hover:text-[#0b1d3d] hover:bg-gray-50 transition-colors">
                            {name}
                          </Link>
                        );
                      }) : <div className="px-5 py-4 text-gray-400 text-xs">No services.</div>}
                      <Link href="/services" onClick={closeDropdown} className="block px-5 py-2.5 text-[11px] font-black text-[#ED1C24] uppercase tracking-wider hover:bg-gray-50 transition-colors border-t border-gray-50 mt-1">
                        View All Services →
                      </Link>
                    </div>
                  </div>
                </div>
              </nav>

              {/* ── Right side: Categories + Search ── */}
              <div className="hidden lg:flex items-center gap-2 ml-auto flex-shrink-0">

                {/* Categories dropdown */}
                <div
                  data-nav-dropdown
                  className="relative"
                  onMouseEnter={() => handleDropdownEnter("categories")}
                  onMouseLeave={() => handleDropdownLeave("categories")}
                >
                  <button
                    type="button"
                    onClick={() => handleDropdownToggle("categories")}
                    className={`h-10 px-5 flex items-center gap-2.5 rounded-full text-[12px] font-black uppercase tracking-wider transition-all border ${isDropdownOpen("categories") ? "bg-[#0b1d3d] text-white border-[#0b1d3d]" : "bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300"}`}
                  >
                    <FiGrid className="w-4 h-4" />
                    <span className="hidden xl:inline">Categories</span>
                    <FiChevronDown className={`w-3.5 h-3.5 transition-transform ${isDropdownOpen("categories") ? "rotate-180" : ""}`} />
                  </button>
                  <div className={`absolute top-full pt-2 right-0 w-64 bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.12)] border border-gray-100 transition-all duration-200 origin-top z-[60] overflow-hidden ${isDropdownOpen("categories") ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-2 pointer-events-none"}`}>
                    <div className="py-2 max-h-[55vh] overflow-y-auto">
                      {isCategoriesLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="px-5 py-3 animate-pulse"><div className="h-3 bg-gray-100 rounded w-3/4" /></div>
                        ))
                      ) : categories.length > 0 ? (
                        categories.map((cat) => {
                          const catName = showingTranslateValue(cat.name);
                          return (
                          <Link key={cat._id} href={getCategorySearchUrl(cat._id, catName, cat.slug)} onClick={closeDropdown} className="flex items-center gap-3 px-4 py-2.5 text-[13px] font-bold text-gray-600 hover:text-[#0b1d3d] hover:bg-gray-50 transition-all group/ci min-w-0">
                            <CategoryNavIcon src={cat.icon} alt={catName} />
                            <span className="flex-1 min-w-0 truncate">{catName}</span>
                            <FiChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover/ci:text-[#ED1C24] flex-shrink-0" />
                          </Link>
                        );})
                      ) : (
                        <div className="px-5 py-4 text-gray-400 text-xs">No categories found.</div>
                      )}
                    </div>
                    <div className="p-3 border-t border-gray-50">
                      <Link href="/search" onClick={closeDropdown} className="block w-full py-2 text-center bg-[#0b1d3d] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#1a2e4d] transition-colors">
                        Browse All →
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Search */}
                <NavbarSearch
                  value={searchQuery}
                  onChange={setSearchQuery}
                  onSubmit={handleSearch}
                  className="w-40 xl:w-64 2xl:w-80"
                />
              </div>

              {/* Action Icons */}
              <div className="ml-auto lg:ml-0 flex items-center gap-0.5 sm:gap-1 flex-shrink-0 min-w-0">
                <Link
                  href="/user/wishlist"
                  title={`Wishlist${wishlistCount ? ` (${wishlistCount})` : ""}`}
                  aria-label={`Wishlist${wishlistCount ? `, ${wishlistCount} items` : ""}`}
                  className={`${navActionBtn} hover:bg-gray-100 relative text-gray-500 hover:text-[#ED1C24] group/wishlist`}
                >
                  <FiHeart className="w-[18px] h-[18px] flex-shrink-0" />
                  <span className="hidden md:inline text-[11px] font-bold text-gray-600 group-hover/wishlist:text-[#ED1C24] whitespace-nowrap">
                    Wishlist{wishlistCount > 0 ? ` (${wishlistCount})` : ""}
                  </span>
                  {wishlistCount > 0 && (
                    <span className="absolute top-0 right-0 md:hidden bg-[#ED1C24] text-white text-[8px] font-black min-w-[14px] h-3.5 px-0.5 rounded-full flex items-center justify-center ring-1 ring-white">
                      {wishlistCount}
                    </span>
                  )}
                </Link>

                <button
                  type="button"
                  onClick={toggleCartDrawer}
                  title={`Cart${cartCount ? ` (${cartCount})` : ""}`}
                  aria-label={`Cart, ${cartCount} items, ${currency}${getNumberTwo(cartTotal)}`}
                  className={`${navActionBtn} hover:bg-gray-100 text-gray-600 hover:text-[#0b1d3d] group/cart`}
                >
                  <div className="relative flex-shrink-0">
                    <FiShoppingBag className="w-[18px] h-[18px]" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-[#ED1C24] text-white text-[8px] font-black min-w-[14px] h-3.5 px-0.5 rounded-full flex items-center justify-center ring-1 ring-white">
                        {cartCount}
                      </span>
                    )}
                  </div>
                  <div className="hidden md:flex flex-col items-start leading-tight min-w-0">
                    <span className="text-[10px] text-gray-500 font-bold tracking-wide">
                      Cart{cartCount > 0 ? ` (${cartCount})` : ""}
                    </span>
                    <span className="text-[12px] font-black text-[#0b1d3d] tabular-nums">
                      {currency}{getNumberTwo(cartTotal)}
                    </span>
                  </div>
                </button>

                <div
                  data-nav-dropdown
                  className="relative inline-flex flex-shrink-0"
                  onMouseEnter={() => userInfo && handleDropdownEnter("account")}
                  onMouseLeave={() => userInfo && handleDropdownLeave("account")}
                >
                  {userInfo ? (
                    <>
                      <button
                        type="button"
                        title={displayName}
                        aria-label="Account menu"
                        aria-expanded={isDropdownOpen("account")}
                        onClick={() => handleDropdownToggle("account")}
                        className={`${navActionBtn} w-9 px-0 text-gray-600 hover:bg-gray-100 hover:text-[#0b1d3d] ${
                          isDropdownOpen("account")
                            ? "bg-gray-100 text-[#0b1d3d] ring-1 ring-gray-200/80"
                            : ""
                        }`}
                      >
                        {userInfo?.image ? (
                          <img
                            src={userInfo.image}
                            alt={displayName}
                            className="w-7 h-7 rounded-full object-cover ring-2 ring-gray-200 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <FiUser className="w-4 h-4 text-gray-500" />
                          </div>
                        )}
                      </button>

                      <div
                        className={`absolute top-full left-auto right-0 pt-2 w-64 max-w-[calc(100vw-2rem)] transition-all duration-200 origin-top-right z-[70] ${
                          isDropdownOpen("account")
                            ? "opacity-100 visible translate-y-0"
                            : "opacity-0 invisible -translate-y-1 pointer-events-none"
                        }`}
                      >
                        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_20px_50px_rgba(11,29,61,0.14)] ring-1 ring-black/[0.04]">
                          <div className="px-4 py-3.5 bg-gradient-to-br from-gray-50 via-white to-white border-b border-gray-100">
                            <div className="flex items-center gap-3 min-w-0">
                              {userInfo?.image ? (
                                <img
                                  src={userInfo.image}
                                  alt={displayName}
                                  className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm flex-shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-[#0b1d3d]/10 flex items-center justify-center flex-shrink-0">
                                  <FiUser className="w-5 h-5 text-[#0b1d3d]" />
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p
                                  className="text-sm font-black text-gray-900 leading-tight truncate"
                                  title={displayName}
                                >
                                  {displayName}
                                </p>
                                {userEmail ? (
                                  <p
                                    className="text-[11px] text-gray-500 mt-0.5 truncate"
                                    title={userEmail}
                                  >
                                    {userEmail}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </div>

                          <div className="py-2 px-1.5">
                            {accountMenuItems.map((item) => {
                              const Icon = item.icon;
                              return (
                                <Link
                                  key={item.href}
                                  href={item.href}
                                  onClick={closeDropdown}
                                  className="flex items-center gap-3 mx-0.5 px-3 py-2.5 rounded-xl text-[13px] font-bold text-gray-600 hover:text-[#0b1d3d] hover:bg-gray-50 active:bg-gray-100 transition-colors duration-150"
                                >
                                  <span className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                                    <Icon className="w-4 h-4 text-gray-500" />
                                  </span>
                                  {item.label}
                                </Link>
                              );
                            })}
                            <div className="my-1.5 mx-2 border-t border-gray-100" />
                            <button
                              type="button"
                              onClick={() => {
                                closeDropdown();
                                handleLogOut();
                              }}
                              className="w-full flex items-center gap-3 mx-0.5 px-3 py-2.5 rounded-xl text-[13px] font-bold text-[#ED1C24] hover:bg-[#ED1C24] hover:text-white active:opacity-90 transition-colors duration-150 group"
                            >
                              <span className="w-8 h-8 rounded-lg bg-[#ED1C24]/10 group-hover:bg-white/20 flex items-center justify-center flex-shrink-0 transition-colors">
                                <FiLogOut className="w-4 h-4 text-[#ED1C24] group-hover:text-white transition-colors" />
                              </span>
                              Logout
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <Link
                      href="/auth/login"
                      title="Login / Register"
                      aria-label="Login or Register"
                      className={`${navActionBtn} w-9 px-0 hover:bg-gray-100 text-gray-600 hover:text-[#0b1d3d]`}
                    >
                      <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <FiUser className="w-4 h-4 text-gray-500" />
                      </div>
                    </Link>
                  )}
                </div>

                {/* Mobile hamburger */}
                <button className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-600 transition-colors" onClick={() => setMobileMenuOpen(true)}>
                  <FiMenu className="w-5 h-5" />
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile Menu ── */}
      <div className={`lg:hidden fixed inset-0 z-[100] ${mobileMenuOpen ? "visible" : "invisible"}`}>
        <div
          className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${mobileMenuOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => setMobileMenuOpen(false)}
        />
        <div className={`absolute top-0 right-0 w-[85vw] max-w-[340px] h-full bg-white shadow-2xl flex flex-col transition-transform duration-300 ${mobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}>
          {/* Mobile header */}
          <div className="px-5 py-4 bg-[#0b1d3d] flex items-center justify-between flex-shrink-0">
            <div>
              <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Welcome to</p>
              <p className="text-base font-black text-white tracking-wide">Elecmoon</p>
            </div>
            <button onClick={() => setMobileMenuOpen(false)} className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
              <FiX className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Mobile search */}
          <div className="px-4 py-3 border-b border-gray-50 flex-shrink-0">
            <NavbarSearch
              value={searchQuery}
              onChange={setSearchQuery}
              onSubmit={(term) => {
                handleSearch(term);
                setMobileMenuOpen(false);
              }}
              showButton={false}
              autoFocus={false}
            />
          </div>

          {/* Mobile links */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
            <p className="text-[9px] font-black text-[#ED1C24] uppercase tracking-[0.2em] mb-2">Navigation</p>
            {[...navLinks].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-4 py-3.5 rounded-xl text-[13px] font-bold transition-all group ${router.pathname === item.href ? 'bg-[#0b1d3d] text-white' : 'text-gray-700 hover:bg-gray-50 hover:text-[#0b1d3d]'}`}
              >
                {item.name}
                <FiChevronRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-all" />
              </Link>
            ))}

            {/* Mobile Services — tap to expand */}
            <button
              type="button"
              onClick={() => setMobileServicesOpen(!mobileServicesOpen)}
              className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-[13px] font-bold text-gray-700 hover:bg-gray-50 hover:text-[#0b1d3d] transition-all"
            >
              Services
              <FiChevronDown className={`w-4 h-4 transition-transform ${mobileServicesOpen ? "rotate-180" : ""}`} />
            </button>
            {mobileServicesOpen && (
              <div className="ml-2 pl-2 border-l-2 border-gray-100 space-y-1">
                {services.length > 0 ? services.map((service) => {
                  const name = showingTranslateValue(service.name);
                  if (!name) return null;
                  const href = service.slug ? `/service/${service.slug}` : `/services`;
                  return (
                    <Link
                      key={service._id}
                      href={href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between px-4 py-2.5 rounded-lg text-[12px] font-bold text-gray-600 hover:bg-gray-50 hover:text-[#0b1d3d] transition-all"
                    >
                      {name}
                      <FiChevronRight className="w-3 h-3 text-gray-300" />
                    </Link>
                  );
                }) : (
                  <p className="px-4 py-2 text-xs text-gray-400">No services.</p>
                )}
                <Link
                  href="/services"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2.5 text-[11px] font-black text-[#ED1C24] uppercase tracking-wider"
                >
                  View All Services →
                </Link>
              </div>
            )}

            {/* Mobile Categories — tap to expand */}
            {categories.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => setMobileCategoriesOpen(!mobileCategoriesOpen)}
                  className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-[13px] font-bold text-gray-700 hover:bg-gray-50 hover:text-[#0b1d3d] transition-all mt-2"
                >
                  Categories
                  <FiChevronDown className={`w-4 h-4 transition-transform ${mobileCategoriesOpen ? "rotate-180" : ""}`} />
                </button>
                {mobileCategoriesOpen && (
                  <div className="ml-2 pl-2 border-l-2 border-gray-100 space-y-1">
                    {categories.map((cat) => {
                      const catName = showingTranslateValue(cat.name);
                      return (
                        <Link
                          key={cat._id}
                          href={getCategorySearchUrl(cat._id, catName, cat.slug)}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center justify-between px-4 py-2.5 rounded-lg text-[12px] font-bold text-gray-600 hover:bg-gray-50 hover:text-[#0b1d3d] transition-all group"
                        >
                          {catName}
                          <FiChevronRight className="w-3 h-3 text-gray-200 group-hover:text-[#ED1C24]" />
                        </Link>
                      );
                    })}
                    <Link
                      href="/search"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-2.5 text-[11px] font-black text-[#0b1d3d] uppercase tracking-wider"
                    >
                      Browse All →
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Mobile footer */}
          <div className="px-4 py-4 border-t border-gray-50 flex-shrink-0 space-y-2">
            {userInfo ? (
              <>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">My Account</p>
                {accountMenuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-4 py-3 rounded-xl text-[13px] font-bold text-gray-700 hover:bg-gray-50 hover:text-[#0b1d3d] transition-all"
                  >
                    {item.label}
                    <FiChevronRight className="w-3.5 h-3.5 text-gray-300" />
                  </Link>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogOut();
                  }}
                  className="w-full py-3 rounded-xl text-[11px] font-bold text-[#ED1C24] hover:bg-[#ED1C24] hover:text-white uppercase tracking-widest transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/auth/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 p-4 bg-[#0b1d3d] rounded-2xl shadow-md text-white w-full"
              >
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                  <FiUser className="w-4 h-4" />
                </div>
                <div className="flex flex-col leading-none min-w-0">
                  <span className="text-[9px] text-white/40 uppercase font-bold tracking-wider">My Account</span>
                  <span className="text-[13px] font-black mt-0.5 truncate">Login / Register</span>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 99px; }
      `}</style>
    </>
  );
};

export default dynamic(() => Promise.resolve(Navbar), { ssr: false });
