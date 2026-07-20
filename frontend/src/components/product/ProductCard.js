import dynamic from "next/dynamic";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useCart } from "react-use-cart";
import { FiHeart, FiEye, FiShoppingBag, FiShoppingCart, FiMessageSquare, FiZap, FiDownload } from "react-icons/fi";
import { getCategorySearchUrl } from "@utils/categoryUrl";
import { isInStock } from "@utils/inventory";
import Stock from "@components/common/Stock";
import { useContext } from "react";
import { WishlistContext } from "@context/WishlistContext";
import { UserContext } from "@context/UserContext";

// internal import
import useUtilsFunction from "@hooks/useUtilsFunction";
import { handleLogEvent } from "src/lib/analytics";
import { notifySuccess, notifyError } from "@utils/toast";
import {
  buildCartItemFields,
  getEffectiveMinOrder,
  getUnitPriceForQuantity,
  getBulkDiscountInfo,
  stashBuyNowPricing,
} from "@utils/quantityPricing";
import { navigateToBuyNow } from "@utils/buyNowNavigation";
import BulkDiscountBadge from "@components/common/BulkDiscountBadge";
import MainModal from "@components/modal/MainModal";
import { getProductImageSrc } from "@utils/productImage";
import { IMAGE_PLACEHOLDER, isCloudinaryUrl } from "@utils/cloudinaryImage";

const ProductCard = ({ 
  product, 
  onEnquire, 
  overrideCategoryName, 
  hideHoverActions = false, 
  hideAddToCart = false,
  hideBuyNow = false,
  forceEnquiry = false
}) => {
  const router = useRouter();
  const { addItem } = useCart();
  const { addToWishlist } = useContext(WishlistContext);
  const { state: { userInfo } } = useContext(UserContext);
  const { showingTranslateValue, getNumberTwo, currency } = useUtilsFunction();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  const price = product?.price || product?.prices?.price || 0;
  const originalPrice = Number(
    product?.originalPrice ?? product?.prices?.originalPrice ?? 0
  );
  const showOriginalPrice = originalPrice > price;
  const bulkInfo = getBulkDiscountInfo(product);

  useEffect(() => {
    setImgError(false);
  }, [product?._id, product?.image, product?.variants]);

  const productImageSrc = getProductImageSrc(product);
  const showProductImage = productImageSrc !== IMAGE_PLACEHOLDER && !imgError;
  const categoryName = overrideCategoryName || showingTranslateValue(product?.category?.name) || "Electronics";
  const categoryId = product?.category?._id || product?.category;
  const productPath = product?.slug ? `/product/${product.slug}` : null;
  const categoryPath = categoryId
    ? getCategorySearchUrl(categoryId, categoryName, product?.category?.slug)
    : null;

  useEffect(() => {
    if (productPath) {
      router.prefetch(productPath);
    }
  }, [productPath, router]);

  const prefetchProduct = () => {
    if (productPath) router.prefetch(productPath);
  };

  const prefetchCategory = () => {
    if (categoryPath) router.prefetch(categoryPath);
  };

  const prefetchCheckoutRoutes = () => {
    router.prefetch("/checkout");
    router.prefetch("/auth/login");
  };

  const navigateToProduct = () => {
    if (forceEnquiry && onEnquire) {
      onEnquire(product);
      return;
    }
    if (productPath) {
      router.push(productPath);
    }
  };

  const handleAddToCart = () => {
    if (!isInStock(product)) {
      notifyError("This product is currently out of stock.");
      return;
    }
    const pricing = buildCartItemFields(product);
    addItem({
      id: product._id,
      name: showingTranslateValue(product.title),
      price: pricing.price,
      image: getProductImageSrc(product),
      variant: product?.variants?.[0] || {},
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
    notifySuccess(`${showingTranslateValue(product.title)} added to cart!`);
    handleLogEvent("cart", `added ${showingTranslateValue(product?.title)} to cart`);
  };

  const handleBuyNow = () => {
    if (!isInStock(product)) {
      notifyError("This product is currently out of stock.");
      return;
    }
    const pricing = buildCartItemFields(product);
    stashBuyNowPricing(product);
    navigateToBuyNow(router, {
      userInfo,
      checkoutQuery: {
        buyNow: true,
        id: product._id,
        title: showingTranslateValue(product.title),
        price: pricing.price,
        image: getProductImageSrc(product),
        quantity: pricing.quantity,
        sku: product.sku || "",
        barcode: product.barcode || "",
        deliveryCharge: product.deliveryCharge || 0,
        gstPercentage: product.gstPercentage || 0,
        basePrice: product.basePrice || product.price || 0,
      },
    });
    handleLogEvent("checkout", `buy now ${showingTranslateValue(product?.title)}`);
  };

  const handleCategoryClick = (e) => {
    e.stopPropagation();
    if (!categoryId) return;
    if (categoryPath) {
      router.prefetch(categoryPath);
      router.push(categoryPath);
    }
  };

  const outOfStock = !isInStock(product);

  return (
    <>
      <div className="group bg-white rounded-xl sm:rounded-2xl overflow-hidden border border-gray-100/80 flex flex-col h-full min-w-0 w-full transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] sm:hover:-translate-y-1"
        onMouseEnter={prefetchProduct}
        onTouchStart={prefetchProduct}
      >

        {/* Product Image */}
        <div
          onClick={navigateToProduct}
          className="relative w-full flex-shrink-0 cursor-pointer bg-gray-50 overflow-hidden"
        >
          <div className="relative w-full pb-[100%] sm:pb-[75%]">
            <div className="absolute top-2 left-2 right-2 z-10 flex items-start justify-between gap-2 pointer-events-none">
              <div className="flex flex-wrap gap-1 max-w-[calc(100%-2.75rem)]">
                {showOriginalPrice && (
                  <span className="bg-[#ED1C24] text-white text-[8px] sm:text-[9px] font-black px-2 py-0.5 rounded-full shadow-md uppercase tracking-wider shrink-0">
                    Sale
                  </span>
                )}
                <BulkDiscountBadge product={product} variant="pill" />
              </div>

              {!hideAddToCart ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToCart();
                  }}
                  disabled={outOfStock}
                  className="pointer-events-auto flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/95 backdrop-blur-sm shadow-md border border-gray-100 flex items-center justify-center text-[#0b1d3d] hover:bg-[#0b1d3d] hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Add to cart"
                  title="Add to cart"
                >
                  <FiShoppingCart className="w-[18px] h-[18px]" />
                </button>
              ) : null}
            </div>

            {/* Hover Action Buttons */}
            {!hideHoverActions && (
              <div className="absolute inset-0 z-20 hidden sm:flex items-end justify-center pb-3 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto">
                <div className="flex items-center gap-2 bg-white/95 backdrop-blur-sm shadow-xl rounded-full px-3 py-2 border border-gray-100 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addToWishlist(product);
                    }}
                    className="w-8 h-8 rounded-full bg-gray-50 hover:bg-red-50 flex items-center justify-center transition-colors"
                    title="Add to Wishlist"
                  >
                    <FiHeart className="w-4 h-4 text-gray-500" />
                  </button>
                  <div className="w-px h-4 bg-gray-200" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsModalOpen(true);
                    }}
                    className="w-8 h-8 rounded-full bg-gray-50 hover:bg-blue-50 flex items-center justify-center transition-colors"
                    title="Quick View"
                  >
                    <FiEye className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>
            )}

            <div className="absolute inset-0">
              {showProductImage ? (
                <Image
                  src={productImageSrc}
                  alt={showingTranslateValue(product.title)}
                  fill
                  sizes="(max-width: 400px) 100vw, (max-width: 640px) 50vw, (max-width: 1024px) 33vw, 230px"
                  className="object-contain p-2 sm:p-3 group-hover:scale-[1.04] transition-transform duration-500"
                  unoptimized={isCloudinaryUrl(productImageSrc)}
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                  <FiShoppingBag className="w-10 h-10 text-gray-200" aria-hidden />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Product Info */}
        <div className="px-3 pt-3 pb-3 sm:px-4 sm:pt-3 sm:pb-4 flex flex-col flex-grow min-w-0">
          {/* Category */}
          {categoryId ? (
            <button
              type="button"
              onClick={handleCategoryClick}
              onMouseEnter={prefetchCategory}
              onTouchStart={prefetchCategory}
              className="text-[9px] sm:text-[9px] text-[#ED1C24] font-black mb-1.5 uppercase tracking-[0.12em] sm:tracking-[0.15em] text-left hover:underline truncate w-full"
            >
              {categoryName}
            </button>
          ) : (
            <div className="text-[9px] text-[#ED1C24] font-black mb-1.5 uppercase tracking-[0.12em] sm:tracking-[0.15em] truncate w-full">
              {categoryName}
            </div>
          )}

          {/* Title */}
          <h2
            className="text-xs sm:text-sm font-bold text-gray-800 mb-2 line-clamp-2 leading-snug cursor-pointer hover:text-[#0b1d3d] transition-colors"
            onClick={navigateToProduct}
          >
            {showingTranslateValue(product.title)}
          </h2>

          <div className="flex flex-col gap-1.5 mb-2 mt-auto min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              {showOriginalPrice && (
                <span className="text-gray-500 line-through text-xs sm:text-sm font-semibold shrink-0">
                  {currency}{getNumberTwo(originalPrice)}
                </span>
              )}
              <span className="text-[#0b1d3d] font-black text-base sm:text-lg">
                {currency}{getNumberTwo(getUnitPriceForQuantity(product, getEffectiveMinOrder(product)))}
              </span>
              {bulkInfo.hasBulkTiers && (
                <BulkDiscountBadge product={product} variant="inline" />
              )}
            </div>
            <Stock product={product} inline />
          </div>

          {getEffectiveMinOrder(product) > 1 && (
            <div className="text-[10px] text-gray-600 font-semibold mb-3">
              Minimum Order: <span className="font-black text-gray-800">{getEffectiveMinOrder(product)} Units</span>
            </div>
          )}

          {product?.datasheetUrl ? (
            <a
              href={product.datasheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="mb-3 w-full flex items-center justify-center gap-1.5 border border-gray-200 hover:border-[#0b1d3d] text-[#0b1d3d] py-2 px-3 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-wide transition-colors"
            >
              <FiDownload className="w-3.5 h-3.5 shrink-0" />
              Download Datasheet
            </a>
          ) : null}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 w-full min-w-0">
            {!hideBuyNow && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleBuyNow();
                }}
                onMouseEnter={prefetchCheckoutRoutes}
                onTouchStart={prefetchCheckoutRoutes}
                disabled={outOfStock}
                className="flex-1 flex items-center justify-center gap-1.5 bg-[#ED1C24] hover:bg-red-700 text-white py-2.5 px-3 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wide transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiZap className="w-3.5 h-3.5 shrink-0" />
                Buy Now
              </button>
            )}
            {onEnquire && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEnquire(product);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 bg-white border-2 border-gray-200 hover:border-[#0b1d3d] text-[#0b1d3d] py-2.5 px-2 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wide transition-all duration-200 active:scale-95 min-w-0"
              >
                <FiMessageSquare className="w-3.5 h-3.5 shrink-0" />
                Enquire Now
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick View Modal */}
      <MainModal modalOpen={isModalOpen} setModalOpen={setIsModalOpen}>
        <div className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-3xl">
          <div className="flex flex-col md:flex-row">
            {/* Image Side */}
            <div className="w-full md:w-1/2 p-8 bg-gray-50 flex items-center justify-center relative min-h-[380px]">
               {showProductImage ? (
                  <Image
                    src={productImageSrc}
                    alt={showingTranslateValue(product.title)}
                    width={500}
                    height={500}
                    className="object-contain max-h-[380px] drop-shadow-md"
                    unoptimized={isCloudinaryUrl(productImageSrc)}
                  />
                ) : (
                  <FiShoppingBag className="w-16 h-16 text-gray-200" aria-hidden />
                )}
                <div className="absolute top-4 left-4">
                   <span className="bg-[#0b1d3d] text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-sm uppercase tracking-widest">
                    Quick View
                  </span>
                </div>
                {!hideAddToCart ? (
                  <button
                    type="button"
                    onClick={() => handleAddToCart()}
                    disabled={outOfStock}
                    className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center text-[#0b1d3d] hover:bg-[#0b1d3d] hover:text-white transition-colors disabled:opacity-40"
                    aria-label="Add to cart"
                    title="Add to cart"
                  >
                    <FiShoppingCart className="w-5 h-5" />
                  </button>
                ) : null}
            </div>

            {/* Content Side */}
            <div className="w-full md:w-1/2 p-8 flex flex-col">
               <div className="mb-2 uppercase text-[9px] font-black text-[#ED1C24] tracking-[0.2em]">
                 {categoryName}
               </div>
               <h2 className="text-2xl font-black text-gray-900 mb-6 leading-tight">
                 {showingTranslateValue(product.title)}
               </h2>

               <div className="space-y-1 mb-8">
                  <div className="grid grid-cols-1 gap-0 border border-gray-100 rounded-2xl overflow-hidden">
                    <div className="flex justify-between items-center px-5 py-3.5 bg-gray-50 border-b border-gray-100">
                       <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Product SKU</span>
                       <span className="text-sm font-mono font-bold text-gray-700">{product.sku || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-start px-5 py-3.5 border-b border-gray-100">
                       <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pt-1">Price</span>
                       <div className="flex flex-col items-end">
                          <span className="text-2xl font-black text-[#0b1d3d]">{currency}{getNumberTwo(price)}</span>
                          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Inclusive of GST</span>
                          {(product?.price - (product?.basePrice || product?.price)) > 0 && (
                            <span className="text-[9px] text-green-600 font-bold mt-1 uppercase tracking-tighter text-right">
                              Incl. {currency}{getNumberTwo(product.price - product.basePrice)} GST ({product.gstPercentage}%)
                            </span>
                          )}
                       </div>
                    </div>
                    <div className="flex justify-between items-center px-5 py-3.5 bg-gray-50">
                       <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Min. Order Qty</span>
                       <span className="text-sm font-bold text-gray-700">{product.minOrderQuantity || 1} {product.minOrderQuantity > 1 ? 'Units' : 'Unit'}</span>
                    </div>
                  </div>

                  <div className="text-sm text-gray-500 leading-relaxed pt-3 px-1">
                    {product.description ? showingTranslateValue(product.description).slice(0, 150) : "No description available"}...
                  </div>
               </div>

               <div className="mt-auto space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    {!hideBuyNow && (
                      <button
                        onClick={() => {
                          handleBuyNow();
                          setIsModalOpen(false);
                        }}
                        disabled={outOfStock}
                        className="flex-1 bg-[#ED1C24] hover:bg-red-700 text-white py-4 rounded-2xl font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
                      >
                        <FiZap className="w-4 h-4" />
                        Buy Now
                      </button>
                    )}
                    {onEnquire && (
                      <button
                        onClick={() => {
                          onEnquire(product);
                          setIsModalOpen(false);
                        }}
                        className="flex-1 bg-white border-2 border-gray-200 hover:border-[#0b1d3d] text-[#0b1d3d] py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                      >
                        <FiMessageSquare className="w-4 h-4" />
                        Enquire Now
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      navigateToProduct();
                    }}
                    className="w-full text-gray-400 hover:text-[#0b1d3d] py-2 rounded-2xl font-bold text-[10px] transition-all uppercase tracking-widest hover:bg-gray-50"
                  >
                    View Full Details →
                  </button>
               </div>
            </div>
          </div>
        </div>
      </MainModal>
    </>
  );
};


export default dynamic(() => Promise.resolve(ProductCard), { ssr: false });
