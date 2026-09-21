import Link from "next/link";

/**
 * Slim promo nav under the main header (Home / Information).
 * Categories live in the always-visible DepartmentsSidebar next to the hero.
 */
const DepartmentsNav = () => {
  return (
    <div className="hidden lg:block bg-white border-b border-gray-200 relative z-40">
      <div className="max-w-screen-2xl mx-auto px-4 lg:px-8">
        <div className="flex items-center gap-6 h-11">
          <nav className="flex items-center gap-5 text-[12px] font-bold uppercase tracking-wider text-gray-600">
            <Link href="/" className="hover:text-[#0b1d3d] transition-colors">
              Home
            </Link>
            <Link
              href="/about-us"
              className="hover:text-[#0b1d3d] transition-colors"
            >
              Information
            </Link>
          </nav>

          <div className="ml-auto text-[11px] font-semibold text-gray-500">
            Free shipping on orders of ₹2000 and above
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentsNav;
