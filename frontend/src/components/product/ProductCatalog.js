import React, { useState, useEffect, useRef, useContext } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCart } from "react-use-cart";
import ProductServices from "@services/ProductServices";
import CategoryServices from "@services/CategoryServices";
import useUtilsFunction from "@hooks/useUtilsFunction";
import { FiShoppingBag, FiChevronLeft, FiChevronRight, FiFilter, FiZap } from "react-icons/fi";
import { notifySuccess } from "@utils/toast";
import { getCategorySearchUrl } from "@utils/categoryUrl";
import {
  buildCartItemFields,
  getEffectiveMinOrder,
  getUnitPriceForQuantity,
  getBulkDiscountInfo,
  syncCartQuantity,
  stashBuyNowPricing,
} from "@utils/quantityPricing";
import BulkDiscountBadge from "@components/common/BulkDiscountBadge";
import { UserContext } from "@context/UserContext";
import { navigateToBuyNow } from "@utils/buyNowNavigation";

const ProductCatalog = () => {
  const router = useRouter();
  const { state: { userInfo } } = useContext(UserContext);
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000000 });
  const [showPriceFilter, setShowPriceFilter] = useState(false);
  const [activeTags, setActiveTags] = useState([]);

  const { showingTranslateValue, currency, getNumber } = useUtilsFunction();
  const { addItem, items, updateItem, removeItem, emptyCart, cartTotal } = useCart();

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [productData, categoryData] = await Promise.all([
          ProductServices.getShowingProducts(),
          CategoryServices.getShowingCategory(),
        ]);
        setProducts(productData || []);

        let catList = categoryData || [];

        // Recursive function to find the first level that has multiple categories or isn't "Home"
        const findMainCategories = (list) => {
          if (list?.length === 1) {
            const name = getTitle(list[0].name)?.toLowerCase()?.trim();
            if (name === "home" || name === "all categories" || name === "all departments" || !list[0].parentId) {
              if (list[0].children && list[0].children.length > 0) {
                return findMainCategories(list[0].children);
              }
            }
          }
          return list || [];
        };

        const finalCategories = findMainCategories(catList);

        // Filter out any specific "Home" label items strictly
        const filtered = finalCategories.filter((cat) => {
          const name = getTitle(cat.name)?.toLowerCase()?.trim();
          return name !== "home" && name !== "all categories" && name !== "all departments" && name !== "";
        });

        setCategories(filtered);
        // Initial scroll check
        setTimeout(checkScroll, 100);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - 300 : scrollLeft + 300;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const getTitle = (titleObj) => {
    if (typeof titleObj === "string") return titleObj;
    if (typeof titleObj === "object" && titleObj !== null) {
      return showingTranslateValue(titleObj) || titleObj.en || titleObj[Object.keys(titleObj)[0]] || "";
    }
    return "";
  };

  const filteredProducts = products.filter((p) => {
    const pCatId = (p.category?._id || p.category)?.toString();
    const selectedCatStr = selectedCategory ? selectedCategory.toString() : "";
    const matchesCategory =
      !selectedCategory ||
      pCatId === selectedCatStr ||
      (Array.isArray(p.categories) &&
        p.categories.some(
          (cat) => (cat?._id || cat)?.toString() === selectedCatStr
        ));

    // Convert price to number safely
    const price = parseFloat(p.price) || 0;
    const matchesPrice = price >= priceRange.min && price <= priceRange.max;

    return matchesCategory && matchesPrice;
  });

  const handleAddToQuote = (product) => {
    const itemInCart = items.find((item) => item.id === product._id);

    if (itemInCart) {
      syncCartQuantity(updateItem, itemInCart, itemInCart.quantity + 1);
      notifySuccess(`${getTitle(product.title)} updated in quote!`);
    } else {
      const pricing = buildCartItemFields(product);
      const catName = categories.find(c => c._id === (product.category?._id || product.category))?.name;
      addItem({
        id: product._id,
        name: getTitle(product.title),
        price: pricing.price,
        image: product.image?.[0],
        category: showingTranslateValue(catName),
        minQty: pricing.minQty,
        maxQty: pricing.maxQty,
        quantityTiers: pricing.quantityTiers,
        listPrice: pricing.listPrice,
        stock: pricing.stock,
        hsnCode: pricing.hsnCode,
        sku: product.sku || "",
        barcode: product.barcode || "",
        deliveryCharge: product.deliveryCharge || 0,
      }, pricing.quantity);
      notifySuccess(`${getTitle(product.title)} added to quote!`);
    }
  };

  const handleBuyNow = (product) => {
    const pricing = buildCartItemFields(product);
    stashBuyNowPricing(product);
    navigateToBuyNow(router, {
      userInfo,
      checkoutQuery: {
        buyNow: true,
        id: product._id,
        title: getTitle(product.title),
        price: pricing.price,
        image: product.image?.[0],
        quantity: pricing.quantity,
        stock: pricing.stock,
        hsnCode: pricing.hsnCode,
        sku: product.sku || "",
        barcode: product.barcode || "",
        deliveryCharge: product.deliveryCharge || 0,
        gstPercentage: product.gstPercentage || 0,
        basePrice: product.basePrice || product.price || 0,
      },
    });
  };

  const handleAddToCart = (product) => {
    const itemInCart = items.find((item) => item.id === product._id);

    if (itemInCart) {
      syncCartQuantity(updateItem, itemInCart, itemInCart.quantity + 1);
      notifySuccess(`${getTitle(product.title)} updated in cart!`);
    } else {
      const pricing = buildCartItemFields(product);
      addItem({
        id: product._id,
        name: getTitle(product.title),
        price: pricing.price,
        image: product.image?.[0],
        minQty: pricing.minQty,
        maxQty: pricing.maxQty,
        quantityTiers: pricing.quantityTiers,
        listPrice: pricing.listPrice,
        stock: pricing.stock,
        hsnCode: pricing.hsnCode,
        sku: product.sku || "",
        barcode: product.barcode || "",
        deliveryCharge: product.deliveryCharge || 0,
        gstPercentage: product.gstPercentage || 0,
        basePrice: product.basePrice || product.price || 0,
      }, pricing.quantity);
      notifySuccess(`${getTitle(product.title)} added to cart!`);
    }
  };

  const handleClearAll = () => {
    setPriceRange({ min: 0, max: 1000000 });
    setSelectedCategory(null);
    setActiveTags([]);
    setShowPriceFilter(false);
  };

  return (
    <div className="bg-[#fcfdfe] py-4">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* Sticky Header Section for Categories and Filters */}
        <div className="sticky top-[72px] z-40 bg-[#fcfdfe] -mx-4 px-4 pt-2">

          {/* Filters Bar */}
          <div className="bg-white rounded-xl border border-gray-100 p-3 mb-6 flex flex-wrap items-center gap-2 sm:gap-4 shadow-sm">
            <div className="flex items-center gap-2 text-gray-400 font-bold text-xs uppercase tracking-wider mr-4">
              <FiFilter className="w-3.5 h-3.5" />
              Filters
            </div>

            {/* Price Filter Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowPriceFilter(!showPriceFilter)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all no-green-button"
                style={{ background: 'white' }}
              >
                Price
                {(priceRange.min > 0 || priceRange.max < 1000000) && (
                  <span className="bg-white border border-[#0b1d3d] text-[#0b1d3d] font-black text-[10px] px-2 py-0.5 rounded ml-1" style={{ background: 'white' }}>1</span>
                )}
                <FiChevronRight className={`w-3.5 h-3.5 text-[#0b1d3d] stroke-[3] transition-transform ${showPriceFilter ? "rotate-90" : ""}`} />
              </button>

              {showPriceFilter && (
                <div className="absolute left-0 right-0 sm:right-auto sm:left-0 top-full mt-2 w-full sm:w-72 max-w-[min(100vw-2rem,18rem)] bg-white rounded-xl shadow-2xl border border-gray-100 p-4 sm:p-6 z-[60] animate-fadeIn">
                  <p className="text-sm font-bold text-[#0b1d3d] mb-4">Price Range</p>
                  <div className="space-y-8 px-2">
                    <div className="relative h-2 bg-gray-100 rounded-lg">
                      {/* Active Track */}
                      <div
                        className="absolute h-full bg-[#0b1d3d] rounded-lg"
                        style={{
                          left: `${(priceRange.min / 1000000) * 100}%`,
                          right: `${100 - (priceRange.max / 1000000) * 100}%`
                        }}
                      />

                      {/* Min Slider */}
                      <input
                        type="range"
                        min="0"
                        max="1000000"
                        value={priceRange.min}
                        onChange={(e) => {
                          const val = Math.min(parseInt(e.target.value), priceRange.max - 1000);
                          setPriceRange({ ...priceRange, min: val });
                        }}
                        className="absolute w-full -top-1 h-4 bg-transparent appearance-none cursor-pointer pointer-events-none custom-range-slider"
                      />

                      {/* Max Slider */}
                      <input
                        type="range"
                        min="0"
                        max="1000000"
                        value={priceRange.max}
                        onChange={(e) => {
                          const val = Math.max(parseInt(e.target.value), priceRange.min + 1000);
                          setPriceRange({ ...priceRange, max: val });
                        }}
                        className="absolute w-full -top-1 h-4 bg-transparent appearance-none cursor-pointer pointer-events-none custom-range-slider"
                      />

                      <style dangerouslySetInnerHTML={{
                        __html: `
                        .custom-range-slider::-webkit-slider-thumb {
                          appearance: none;
                          width: 20px;
                          height: 20px;
                          background: white;
                          border: 3px solid #0b1d3d;
                          border-radius: 50%;
                          cursor: pointer;
                          pointer-events: auto;
                          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                          z-index: 10;
                        }
                        .custom-range-slider::-moz-range-thumb {
                          width: 20px;
                          height: 20px;
                          background: white;
                          border: 3px solid #0b1d3d;
                          border-radius: 50%;
                          cursor: pointer;
                          pointer-events: auto;
                          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                        }
                      ` }} />
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-grow">
                        <label className="text-[10px] uppercase text-gray-400 font-bold mb-1 block">Min Price</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{currency}</span>
                          <input
                            type="number"
                            value={priceRange.min}
                            onChange={(e) => setPriceRange({ ...priceRange, min: parseInt(e.target.value) })}
                            className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:outline-none focus:border-[#0b1d3d]"
                          />
                        </div>
                      </div>
                      <div className="flex-grow">
                        <label className="text-[10px] uppercase text-gray-400 font-bold mb-1 block">Max Price</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{currency}</span>
                          <input
                            type="number"
                            value={priceRange.max}
                            onChange={(e) => setPriceRange({ ...priceRange, max: parseInt(e.target.value) })}
                            className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:outline-none focus:border-[#0b1d3d]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleClearAll}
              className="ml-auto px-4 py-2 bg-white text-gray-700 font-bold text-xs rounded-lg shadow-md border border-gray-100 hover:bg-gray-50 transition-all no-green-button relative z-10"
              style={{ background: 'white' }}
            >
              Clear all
            </button>
          </div>

          {/* Category chips */}
          {categories.length > 0 && (
            <div className="mb-6">
              <div
                ref={scrollRef}
                onScroll={checkScroll}
                className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory"
              >
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`flex-shrink-0 snap-start px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${
                    !selectedCategory
                      ? "bg-[#0b1d3d] text-white border-[#0b1d3d]"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  All Products
                </button>
                {categories.map((cat) => {
                  const catTitle = getTitle(cat.name);
                  const isActive = selectedCategory === cat._id;
                  return (
                    <button
                      key={cat._id}
                      onClick={() => {
                        setSelectedCategory(cat._id);
                        router.push(getCategorySearchUrl(cat._id, catTitle, cat.slug));
                      }}
                      className={`flex-shrink-0 snap-start px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all border whitespace-nowrap ${
                        isActive
                          ? "bg-[#0b1d3d] text-white border-[#0b1d3d]"
                          : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {catTitle}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">


          {/* Center Area - Products List */}
          <div className="flex-grow">
            <div className="space-y-4">
              {loading ? (
                [1, 2, 3].map(i => <div key={i} className="h-48 bg-gray-100 animate-pulse rounded-xl" />)
              ) : filteredProducts.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center border border-gray-100 flex flex-col items-center">
                  <FiShoppingBag className="w-12 h-12 text-gray-200 mb-4" />
                  <h3 className="text-gray-900 font-bold">No products found</h3>
                  <p className="text-gray-500 text-sm mt-1">Try adjusting your filters or category selection.</p>
                </div>
              ) : (
                filteredProducts.map((product) => {
                  const itemInCart = items.find(i => i.id === product._id);
                  return (
                    <div key={product._id} className="bg-white rounded-xl border border-gray-100 p-3 sm:p-5 flex flex-col sm:flex-row gap-3 sm:gap-6 hover:shadow-lg transition-all duration-300 relative group min-w-0">
                      <div className="w-full sm:w-36 md:w-40 h-36 sm:h-40 relative flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden border border-gray-50 mx-auto sm:mx-0">
                        {product.image?.[0] ? (
                          <Image src={product.image[0]} alt={getTitle(product.title)} fill className="object-contain p-2 group-hover:scale-105 transition-transform" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300"><FiShoppingBag className="w-8 h-8" /></div>
                        )}
                      </div>

                      <div className="flex-grow min-w-0">
                        <h3 className="text-base sm:text-xl font-bold text-gray-900 mb-2 sm:mb-4 group-hover:text-[#0b1d3d] transition-colors leading-snug line-clamp-2 break-words">
                          {getTitle(product.title)}
                        </h3>

                        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3 sm:gap-4">
                          <div className="space-y-2 min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-gray-500">
                              Minimum quantity: <span className="font-bold text-gray-700">{getEffectiveMinOrder(product)}</span>
                            </p>
                            <p className="text-xl sm:text-2xl font-black text-[#0b1d3d] break-words">
                              {currency}{getNumberTwo(getUnitPriceForQuantity(product, getEffectiveMinOrder(product)))}{" "}
                              <span className="text-xs font-normal text-gray-400">/ PCS</span>
                            </p>
                            {getBulkDiscountInfo(product).hasBulkTiers && (
                              <BulkDiscountBadge product={product} variant="inline" />
                            )}
                          </div>

                          <div className="flex flex-col sm:flex-row items-stretch gap-2 sm:gap-3 w-full lg:w-auto min-w-0">
                            <button
                              onClick={() => handleBuyNow(product)}
                              className="px-5 py-3 bg-[#ED1C24] text-white rounded-xl font-bold text-sm shadow-md hover:bg-red-700 transition-all no-green-button active:scale-95 flex items-center justify-center gap-2"
                            >
                              <FiZap className="w-4 h-4" />
                              Buy Now
                            </button>
                            {itemInCart ? (
                              <div className="flex items-center border-2 border-[#0b1d3d]/20 rounded-xl bg-white p-1 justify-center">
                                <button
                                  onClick={() => syncCartQuantity(updateItem, itemInCart, itemInCart.quantity - 1)}
                                  disabled={itemInCart.quantity <= (itemInCart.minQty || 1)}
                                  className="w-10 h-10 flex items-center justify-center text-[#0b1d3d] hover:bg-gray-50 rounded-lg no-green-button disabled:opacity-40"
                                  style={{ background: "transparent" }}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                                </button>
                                <span className="w-12 text-center font-bold text-[#0b1d3d] text-lg">{itemInCart.quantity}</span>
                                <button
                                  onClick={() => syncCartQuantity(updateItem, itemInCart, itemInCart.quantity + 1)}
                                  disabled={itemInCart.maxQty > 0 && itemInCart.quantity >= itemInCart.maxQty}
                                  className="w-10 h-10 flex items-center justify-center text-[#0b1d3d] hover:bg-gray-50 rounded-lg no-green-button"
                                  style={{ background: "transparent" }}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                </button>
                              </div>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleAddToCart(product)}
                                  className="px-5 py-3 bg-[#0b1d3d] text-white rounded-xl font-bold text-sm shadow-md hover:bg-[#162542] transition-all no-green-button active:scale-95"
                                >
                                  Add to Cart
                                </button>
                                <button
                                  onClick={() => handleAddToQuote(product)}
                                  className="px-5 py-3 bg-white border-2 border-[#0b1d3d] text-[#0b1d3d] rounded-xl font-bold text-sm hover:bg-gray-50 transition-all no-green-button active:scale-95"
                                >
                                  Add to Quote +
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="w-full lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden lg:sticky lg:top-[190px] flex flex-col">
              <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">Cart</h2>
                <button onClick={() => emptyCart()} className="text-[10px] font-bold text-gray-400 hover:text-red-500 uppercase tracking-widest no-green-button" style={{ background: "transparent" }}>Clear Cart</button>
              </div>

              <div className="flex-grow overflow-y-auto max-h-[calc(100vh-400px)] p-6 space-y-4 simple-scrollbar scroll-smooth">
                {items.length === 0 ? (
                  <div className="text-center py-10 opacity-30">
                    <FiShoppingBag className="w-10 h-10 mx-auto mb-2" />
                    <p className="text-sm font-medium tracking-tight">Your cart is empty</p>
                  </div>
                ) : (
                  items.map((item) => (
                    <div key={item.id} className="flex gap-4 items-center">
                      <div className="w-12 h-12 rounded-lg bg-gray-50 flex-shrink-0 flex items-center justify-center border border-gray-100 relative">
                        {item.image ? <Image src={item.image} alt="" fill className="object-cover rounded-lg" /> : <FiShoppingBag className="w-5 h-5 text-gray-300" />}
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate uppercase tracking-tight">{item.name}</p>
                        <p className="text-[10px] text-gray-500 font-bold">{item.quantity} × {currency}{item.price}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-6 bg-gray-50 border-t border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Subtotal ({items.length} items)</span>
                    <span className="text-2xl font-black text-[#0b1d3d]">{currency}{getNumber(cartTotal)}</span>
                  </div>
                </div>

                <Link href="/checkout">
                  <button
                    disabled={items.length === 0}
                    className="w-full py-4 bg-[#0b1d3d] text-white rounded-xl font-bold text-sm shadow-lg hover:bg-[#162542] transition-all active:scale-95 disabled:opacity-50 no-green-button mb-2"
                  >
                    Proceed to Checkout
                  </button>
                </Link>
                <Link href="/request-a-quote">
                  <button
                    disabled={items.length === 0}
                    className="w-full py-3 bg-white border-2 border-[#0b1d3d] text-[#0b1d3d] rounded-xl font-bold text-sm hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50 no-green-button"
                  >
                    Request a Quote
                  </button>
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProductCatalog;
