import useTranslation from "next-translate/useTranslation";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";
import {
  FiChevronRight,
  FiZap,
  FiArrowDown,
  FiArrowUp,
  FiThermometer,
  FiCheck,
  FiEdit,
  FiTrash2,
  FiTarget,
  FiShoppingBag,
  FiShare2,
  FiDownload,
} from "react-icons/fi";
import { useCart } from "react-use-cart";
import {
  FacebookIcon,
  FacebookShareButton,
  LinkedinIcon,
  LinkedinShareButton,
  TwitterIcon,
  TwitterShareButton,
  WhatsappIcon,
  WhatsappShareButton,
} from "react-share";
import { FaInstagram } from "react-icons/fa";
import { IoClose } from "react-icons/io5";

import Tags from "@components/common/Tags";
import Layout from "@layout/Layout";
import ProductCard from "@components/product/ProductCard";
import VariantList from "@components/variants/VariantList";
import AttributeServices from "@services/AttributeServices";
import ProductServices from "@services/ProductServices";
import useUtilsFunction from "@hooks/useUtilsFunction";
import Discount from "@components/common/Discount";
import ImageCarousel from "@components/carousel/ImageCarousel";
import ProductEnquiryModal from "@components/modal/ProductEnquiryModal";
import { toast } from "react-toastify";
import ReviewServices from "@services/ReviewServices";
import { sanitizeProduct, sanitizeData } from "@utils/dataSanitizer";
import { getCategorySearchUrl } from "@utils/categoryUrl";
import { PRODUCT_GRID_CLASS, PRODUCT_GRID_ITEM_CLASS } from "@utils/productGrid";
import ProductBulkPricing from "@components/product/ProductBulkPricing";
import {
  buildCartItemFields,
  clampQuantity,
  getEffectiveMinOrder,
  getEffectiveMaxOrder,
  getUnitPriceForQuantity,
  getBulkEnquiryThreshold,
  getPricingSummary,
  canUseRetailCheckout,
  getRetailMaxQuantity,
  getBulkDiscountInfo,
  stashBuyNowPricing,
} from "@utils/quantityPricing";
import { navigateToBuyNow } from "@utils/buyNowNavigation";
import BulkDiscountBadge from "@components/common/BulkDiscountBadge";
import Stock from "@components/common/Stock";
import { isInStock } from "@utils/inventory";
import Uploader from "@components/image-uploader/Uploader";
import { UserContext } from "@context/UserContext";

const ProductScreen = ({ product, attributes, relatedProducts }) => {
  const router = useRouter();

  const { lang, showingTranslateValue, getNumberTwo, currency } = useUtilsFunction();
  const { state: { userInfo } } = useContext(UserContext);
  const { addItem } = useCart();

  const [orderQuantity, setOrderQuantity] = useState(1);

  useEffect(() => {
    setOrderQuantity(getEffectiveMinOrder(product));
  }, [product?._id, product?.minOrderQuantity, product?.quantityTiers]);

  const [value, setValue] = useState("");
  const [img, setImg] = useState("");
  const [discount, setDiscount] = useState(0);
  const [selectVariant, setSelectVariant] = useState({});
  const [isReadMore, setIsReadMore] = useState(true);
  const [selectVa, setSelectVa] = useState({});
  const [variantTitle, setVariantTitle] = useState([]);
  const [variants, setVariants] = useState([]);
  const [welcomeModalOpen, setWelcomeModalOpen] = useState(false);
  const bulkThreshold = product ? getBulkEnquiryThreshold(product) : 10;
  const bulkInfo = product ? getBulkDiscountInfo(product) : null;
  const outOfStock = product ? !isInStock(product) : false;
  const moq = product ? getEffectiveMinOrder(product) : 1;
  const isBulkQty = !canUseRetailCheckout(product, orderQuantity);
  const orderPricing = product ? getPricingSummary(product, orderQuantity) : null;
  const [reviews, setReviews] = useState([]);
  const [reviewText, setReviewText] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [rating, setRating] = useState(5);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [reviewImg, setReviewImg] = useState([]);
  const [isReviewImageUploading, setIsReviewImageUploading] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  // Helper to convert YT URL to embed URL
  const getYoutubeEmbedUrl = (url) => {
    if (!url) return "";
    let videoId = "";
    if (url.includes("v=")) {
      videoId = url.split("v=")[1]?.split("&")[0];
    } else if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1]?.split("?")[0];
    } else if (url.includes("embed/")) {
      videoId = url.split("embed/")[1]?.split("?")[0];
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  };

  useEffect(() => {
    if (product?._id) {
      ReviewServices.getReviewsByProduct(product._id).then(res => setReviews(res)).catch(console.log);
    }
    if (userInfo?.name) {
      setReviewerName(userInfo.name);
    }
  }, [product, userInfo]);

  const submitReview = async (e) => {
    e.preventDefault();
    if (!reviewerName || !reviewText) return toast.error("Please fill Name and Review");
    if (isReviewImageUploading) {
      return toast.error("Please wait for image uploads to finish.");
    }
    try {
      if (isEditing) {
        const res = await ReviewServices.updateReview(editId, {
          name: reviewerName,
          rating: rating,
          comment: reviewText,
          images: Array.isArray(reviewImg) ? reviewImg : (reviewImg ? [reviewImg] : []),
          user: userInfo?._id, // Pass user ID to backend for ownership check
        });
        toast.success("Review updated!");
        setReviews(reviews.map(r => r._id === editId ? res.review : r));
        setIsEditing(false);
        setEditId(null);
        setReviewImg("");
      } else {
        const res = await ReviewServices.addReview({
          product: product._id,
          name: reviewerName,
          rating: rating,
          comment: reviewText,
          images: Array.isArray(reviewImg) ? reviewImg : (reviewImg ? [reviewImg] : []),
          user: userInfo?._id, // Store owner ID
        });
        toast.success("Review submitted!");
        setReviews([res.review, ...reviews]);
      }
      setReviewText("");
      setReviewerName("");
      setRating(5);
      setReviewImg([]);
    } catch (err) {
      toast.error(isEditing ? "Failed to update review" : "Failed to submit review");
    }
  };
  const handleEdit = (rev) => {
    setIsEditing(true);
    setEditId(rev._id);
    setReviewerName(rev.name);
    setReviewText(rev.comment);
    setRating(rev.rating);
    setReviewImg(rev.images || []);
    setTimeout(() => {
      const form = document.querySelector('#review-form');
      if (form) {
        form.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    try {
      await ReviewServices.deleteReview(id, { userId: userInfo?._id }); // Pass userId for ownership check
      toast.success("Review deleted");
      setReviews(reviews.filter(r => r._id !== id));
    } catch (err) {
      toast.error("Failed to delete review");
    }
  };

  useEffect(() => {
    // Initialize selected variant based on URL slug
    if (product?.variants?.length > 0) {
      // Check if current URL slug matches any variant slug
      const currentSlug = router.query.slug;
      let initialVariant = product.variants[0];

      // Find variant that matches the current URL slug
      const foundVariant = product.variants.find((v) => v.slug === currentSlug);
      if (foundVariant) {
        initialVariant = foundVariant;
      }

      setSelectVariant(initialVariant);
      setSelectVa(initialVariant);
      setVariants(product.variants);

      // Set initial image to variant's first image
      if (initialVariant?.image && initialVariant.image.length > 0) {
        setImg(initialVariant.image[0]);
      } else {
        setImg(product?.image?.[0]);
      }
    } else {
      // No variants, use main product image
      setImg(product?.image?.[0]);
    }
  }, [product, router.query.slug]);

  useEffect(() => {
    if (product?.variants && product.variants.length > 0) {
      const res = Object.keys(Object.assign({}, ...product.variants));

      const varTitle = attributes?.filter((att) => res.includes(att?._id));
      setVariantTitle(varTitle?.sort());
    } else {
      setVariantTitle([]);
    }
  }, [variants, attributes, product?.variants]);

  // Show welcome popup modal when user visits the page
  // useEffect(() => {
  //   if (product && !isLoading) {
  //     // Delay showing the modal by 1 second for better UX
  //     const timer = setTimeout(() => {
  //       setWelcomeModalOpen(true);
  //     }, 1000);
  //     return () => clearTimeout(timer);
  //   }
  // }, [product, isLoading]);

  const handleChangeImage = (img) => {
    setImg(img);
    setShowVideo(false);
  };

  const handleSelectVideo = () => {
    setShowVideo(true);
  };

  // Handle variant selection - update slug and product data
  const handleVariantSelect = (variant) => {
    setSelectVariant(variant);
    setSelectVa(variant);
    setShowVideo(false);

    if (variant?.image && variant.image.length > 0) {
      setImg(variant.image[0]);
    } else {
      setImg(product?.image?.[0] || "");
    }

    if (variant?.slug) {
      router.push(`/product/${variant.slug}`, undefined, { shallow: true });
    }
  };

  // Get current images based on selected variant
  const getCurrentImages = () => {
    if (selectVariant?.image && selectVariant.image.length > 0) {
      return selectVariant.image;
    }
    return product?.image || [];
  };
  const handleSocialShare = () => {
    const shareData = {
      title: showingTranslateValue(selectVariant?.title) || showingTranslateValue(product?.title),
      text: showingTranslateValue(selectVariant?.description) || showingTranslateValue(product?.description),
      url: `https://elecmoon.com/product/${selectVariant?.slug || router.query.slug}`,
    };

    if (navigator.share) {
      navigator.share(shareData)
        .then(() => console.log('Successful share'))
        .catch((error) => console.log('Error sharing', error));
    } else {
      // Fallback: copy to clipboard or show a message
      if (typeof window !== "undefined" && navigator.clipboard) {
        navigator.clipboard.writeText(shareData.url);
        toast.success("Link copied to clipboard!");
      }
    }
  };

  const { t } = useTranslation();

  // category name for display
  const category_name = product?.category?.name
    ? showingTranslateValue(product.category.name)
    : "";

  // category listing URL
  const categoryUrl = product?.category?._id
    ? getCategorySearchUrl(
        product.category._id,
        category_name,
        product?.category?.slug
      )
    : "/search";

  return (
    <>
      {!product ? (
        <Layout
          title="Product Not Found"
          description="The requested product could not be found"
        >
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-800 mb-4">
                Product Not Found
              </h1>
              <p className="text-gray-600 mb-8">
                The product you're looking for doesn't exist or has been
                removed.
              </p>
              <Link
                href="/"
                className="inline-flex items-center px-6 py-3 bg-[#EF4036] text-white font-semibold rounded-lg hover:bg-[#C53030] transition-colors"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back to Home
              </Link>
            </div>
          </div>
        </Layout>
      ) : (
        <Layout
          title={
            showingTranslateValue(selectVariant?.title) ||
            showingTranslateValue(product?.title)
          }
          description={
            showingTranslateValue(selectVariant?.description) ||
            showingTranslateValue(product?.description)
          }
        >
          {/* Product Enquiry Modal - Reusable */}
          <ProductEnquiryModal
            modalOpen={welcomeModalOpen}
            setModalOpen={setWelcomeModalOpen}
            product={product}
            selectedVariant={selectVariant}
            initialQuantity={orderQuantity}
          />
          <div className="px-0 py-6 sm:py-10 lg:py-10">
            <div className="mx-auto px-3 sm:px-6 lg:px-10 max-w-screen-2xl min-w-0">
              <div className="flex items-center pb-4">
                <ol className="flex items-center w-full overflow-hidden font-serif">
                  <li className="text-sm pr-1 transition duration-200 ease-in cursor-pointer hover:text-[#EF4036] font-semibold">
                    <Link href="/">Home</Link>
                  </li>
                  <li className="text-sm mt-[1px]">

                    <FiChevronRight />
                  </li>
                  <li className="text-sm pl-1 transition duration-200 ease-in cursor-pointer hover:text-[#EF4036] font-semibold ">
                    <Link href={categoryUrl}>
                      <button type="button">
                        {category_name}
                      </button>
                    </Link>
                  </li>
                  <li className="text-sm mt-[1px]">

                    <FiChevronRight />
                  </li>
                  <li className="text-sm px-1 transition duration-200 ease-in truncate max-w-[40vw] sm:max-w-none">
                    {showingTranslateValue(selectVariant?.title) ||
                      showingTranslateValue(product?.title)}
                  </li>
                </ol>
              </div>
              <div className="w-full rounded-lg p-3 sm:p-6 lg:p-10 bg-white min-w-0">
                <div className="flex flex-col xl:flex-row gap-6 lg:gap-10 min-w-0">
                  <div className="flex-shrink-0 xl:pr-10 w-full min-w-0 mx-auto md:w-6/12 lg:w-[45%] xl:w-[45%]">
                    <Discount slug product={product} discount={discount} />

                    {showVideo && product.videoUrl ? (
                      <div className="relative w-full pb-[100%] h-0">
                        <iframe
                          className="absolute top-0 left-0 w-full h-full rounded-lg"
                          src={getYoutubeEmbedUrl(product.videoUrl)}
                          title="Product Video"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      </div>
                    ) : getCurrentImages()[0] ? (
                      <Image
                        src={img || getCurrentImages()[0]}
                        alt="product"
                        width={650}
                        height={650}
                        priority
                        className="w-full h-auto max-w-full"
                      />
                    ) : (
                      <Image
                        src="https://res.cloudinary.com/ahossain/image/upload/v1655097002/placeholder_kvepfp.png"
                        width={650}
                        height={650}
                        alt="product Image"
                      />
                    )}

                    {(getCurrentImages().length > 1 || product.videoUrl) && (
                      <div className="flex flex-row flex-wrap mt-4 border-t">
                        <ImageCarousel
                          images={getCurrentImages()}
                          videoUrl={product.videoUrl}
                          handleChangeImage={handleChangeImage}
                          handleSelectVideo={handleSelectVideo}
                        />
                      </div>
                    )}

                    {/* Description moved here */}
                    <div className="mt-8 pt-8 border-t border-gray-100">
                      <div className="text-sm leading-6 text-gray-500 md:leading-7">
                        <h3 className="text-lg font-gray-800 mb-2 text-slate-700">Description : </h3>
                        {isReadMore
                          ? showingTranslateValue(
                            selectVariant?.description ||
                            product?.description
                          )?.slice(0, 230)
                          : showingTranslateValue(
                            selectVariant?.description ||
                            product?.description
                          )}
                        <br />

                        {Object?.keys(
                          selectVariant?.description || product?.description
                        )?.includes(lang)
                          ? (selectVariant?.description ||
                            product?.description)[lang]?.length > 230 && (
                            <span
                              onClick={() => setIsReadMore(!isReadMore)}
                              className="read-or-hide text-[#EF4036] cursor-pointer font-bold"
                            >
                              {isReadMore
                                ? t("common:moreInfo")
                                : t("common:showLess")}
                            </span>
                          )
                          : (
                            selectVariant?.description ||
                            product?.description
                          )?.en?.length > 230 && (
                            <span
                              onClick={() => setIsReadMore(!isReadMore)}
                              className="read-or-hide text-[#EF4036] cursor-pointer font-bold"
                            >
                              {isReadMore
                                ? t("common:moreInfo")
                                : t("common:showLess")}
                            </span>
                          )}
                      </div>
                    </div>


                  </div>

                  <div className="w-full min-w-0 flex-1">
                    <div className="flex flex-col w-full min-w-0">
                      <div className="w-full min-w-0">
                        <div className="mb-4 sm:mb-6">
                          <h1 className="leading-snug text-base sm:text-lg md:text-xl mb-2 font-semibold font-serif text-slate-700 break-words">
                            {showingTranslateValue(selectVariant?.title) ||
                              showingTranslateValue(product?.title)}
                          </h1>
                          {bulkInfo?.hasBulkTiers && (
                            <div className="mb-3 flex flex-wrap gap-2 items-center">
                              <BulkDiscountBadge product={product} variant="banner" className="!w-auto flex-1 min-w-0" />
                            </div>
                          )}

                          <div className="flex flex-col mb-4 sm:mb-6 w-full min-w-0">
                            {/* Contextual Info - Total for MOQ and Tax status */}
                            <div className="flex items-center gap-2 mb-1.5 font-bold uppercase tracking-[0.1em] text-[10px]">
                              <span className="text-gray-500">Total for {orderQuantity} Units</span>
                              <span className="w-1 h-1 rounded-full bg-gray-300 mx-1"></span> 
                              <span className="text-green-700 font-black">Incl. {product?.gstPercentage || 0}% Tax</span>
                            </div>

                            <div className="flex items-baseline mb-3">
                              <span className="text-2xl sm:text-3xl font-black text-pink-800 leading-none tracking-tighter break-words">
                                {currency}{getNumberTwo(getUnitPriceForQuantity(product, orderQuantity) * orderQuantity)}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-x-3 gap-y-2 text-[10px] font-bold uppercase text-gray-400 border-t border-gray-100 pt-3 tracking-tight w-full">
                              <div className="flex items-center gap-1.5 sm:border-r sm:border-gray-100 sm:pr-4 min-w-0">
                                <span className="text-gray-600 text-[10px] sm:text-[11px] shrink-0">Rate:</span>
                                <span className="text-[#0b1d3d] font-semibold text-[10px] sm:text-[11px] truncate">
                                  {currency}{getNumberTwo(getUnitPriceForQuantity(product, orderQuantity))}/pc
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 sm:border-r sm:border-gray-100 sm:pr-4 min-w-0">
                                <span className="text-gray-600 text-[10px] sm:text-[11px] shrink-0">SKU:</span>
                                <span className="text-gray-700 font-semibold text-[10px] sm:text-[11px] truncate">{selectVariant?.sku || product.sku || 'N/A'}</span>
                              </div>
                              <div className="flex items-center gap-1.5 col-span-2 sm:col-span-1">
                                <span className="text-gray-600 text-[10px] sm:text-[11px]">Minimum Order:</span>
                                <span className="text-[#0b1d3d] font-semibold text-[10px] sm:text-[11px]">{moq}</span>
                              </div>
                              {product?.hsnCode ? (
                                <div className="flex items-center gap-1.5 col-span-2 sm:col-span-1">
                                  <span className="text-gray-600 text-[10px] sm:text-[11px] shrink-0">HSN:</span>
                                  <span className="text-gray-700 font-semibold text-[10px] sm:text-[11px] truncate">{product.hsnCode}</span>
                                </div>
                              ) : null}
                            </div>

                            <Stock product={product} />

                            {product?.datasheetUrl ? (
                              <a
                                href={product.datasheetUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 mt-3 text-[11px] font-black uppercase tracking-wide text-[#0b1d3d] border border-gray-200 hover:border-[#0b1d3d] rounded-xl px-4 py-2.5 transition-colors"
                              >
                                <FiDownload className="w-4 h-4" />
                                Download Datasheet
                              </a>
                            ) : null}

                            <div className="flex items-center gap-3 mt-4">
                              <span className="text-[10px] font-bold uppercase text-gray-500">Quantity</span>
                              <div className="flex items-center border-2 border-[#0b1d3d]/15 rounded-xl bg-white">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setOrderQuantity((q) =>
                                      clampQuantity(product, q - 1)
                                    )
                                  }
                                  disabled={orderQuantity <= moq || outOfStock}
                                  className="w-10 h-10 font-bold text-[#0b1d3d] disabled:opacity-30"
                                >
                                  −
                                </button>
                                <span className="w-12 text-center font-black text-[#0b1d3d]">{orderQuantity}</span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setOrderQuantity((q) =>
                                      clampQuantity(product, q + 1)
                                    )
                                  }
                                  disabled={
                                    outOfStock ||
                                    (getEffectiveMaxOrder(product) > 0 &&
                                    orderQuantity >= getEffectiveMaxOrder(product))
                                  }
                                  className="w-10 h-10 font-bold text-[#0b1d3d] disabled:opacity-30"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                            {moq > 1 && (
                              <p className="text-[11px] text-gray-500 mt-2">
                                Minimum order quantity is {moq} units. Increase quantity to update total at MOQ rate.
                              </p>
                            )}
                            {outOfStock && (
                              <p className="text-[11px] text-red-600 font-semibold mt-2">
                                This product is currently out of stock.
                              </p>
                            )}

                            <ProductBulkPricing
                              product={product}
                              currency={currency}
                              selectedQty={orderQuantity}
                            />
                          </div>

                          {selectVariant?.barcode && (
                            <p className="uppercase font-serif font-medium text-gray-500 text-sm">
                              Barcode :{" "}
                              <span className="font-bold text-gray-600">
                                {selectVariant.barcode}
                              </span>
                            </p>
                          )}
                        </div>

                        <div className="mb-4">
                          {variantTitle?.map((a, i) => (
                            <span key={i + 1}>
                              <h4 className="text-sm py-1">
                                {showingTranslateValue(a?.name)}:
                              </h4>
                              <div className="flex flex-row mb-3">
                                <VariantList
                                  att={a._id}
                                  lang={lang}
                                  option={a.option}
                                  setValue={setValue}
                                  varTitle={variantTitle}
                                  setSelectVa={setSelectVa}
                                  variants={product?.variants}
                                  handleVariantSelect={handleVariantSelect}
                                  selectVariant={selectVariant}
                                  setSelectVariant={setSelectVariant}
                                />
                              </div>
                            </span>
                          ))}
                        </div>

                        <div>
                        
                          {/* Product Highlights moved here */}
                          <div className="mt-6 pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-2 mb-3">
                              <FiTarget className="w-4 h-4 text-gray-500" />
                              <h3 className="  uppercase font-semibold text-slate-700">Product Highlights : </h3>
                            </div>
                            <ul className="space-y-2">
                              {showingTranslateValue(selectVariant?.highlights || product?.highlights)
                                ?.split("\n")
                                ?.filter((point) => point.trim())
                                ?.slice(0, 6)
                                ?.map((point, index) => (
                                  <li key={index} className="flex items-start gap-4 text-xs text-gray-600">
                                    <FiCheck className="text-green-600 mt-1 flex-shrink-0 w-3 h-3" />
                                    <span>{point.trim()}</span>
                                  </li>
                                ))}
                            </ul>
                          </div>

                          <div className="flex flex-col gap-3 mt-6 w-full min-w-0">
                            {/* Retail / instant checkout */}
                            <div
                              className={`rounded-xl border-2 p-4 w-full min-w-0 transition-all ${
                                !isBulkQty
                                  ? "border-[#0b1d3d] bg-[#0b1d3d]/5 shadow-sm"
                                  : "border-gray-200 bg-gray-50/50 opacity-90"
                              }`}
                            >
                              <p className="text-[10px] font-black uppercase tracking-widest text-[#0b1d3d] mb-1">
                                Buy online (retail)
                              </p>
                              <p className="text-[11px] text-gray-500 mb-3">
                                {getRetailMaxQuantity(product) > 0
                                  ? `Instant checkout for ${getEffectiveMinOrder(product)}–${getRetailMaxQuantity(product)} units.`
                                  : `Pay online for ${getEffectiveMinOrder(product)}+ units (same slab pricing applies).`}
                              </p>
                              <div className="flex flex-col sm:flex-row gap-2 w-full">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (outOfStock) {
                                      toast.error("This product is out of stock.");
                                      return;
                                    }
                                    if (orderQuantity < moq) {
                                      toast.error(`Minimum order quantity is ${moq} units.`);
                                      return;
                                    }
                                    if (!canUseRetailCheckout(product, orderQuantity)) {
                                      toast.info(`For ${orderQuantity} units, please use Request bulk quote.`);
                                      setWelcomeModalOpen(true);
                                      return;
                                    }
                                    const pricing = buildCartItemFields(product, orderQuantity);
                                    stashBuyNowPricing(product);
                                    navigateToBuyNow(router, {
                                      userInfo,
                                      checkoutQuery: {
                                        buyNow: true,
                                        id: product._id,
                                        title: showingTranslateValue(product.title),
                                        price: pricing.price,
                                        image: product.image?.[0],
                                        quantity: pricing.quantity,
                                        sku: selectVariant?.sku || product.sku || "",
                                        barcode: selectVariant?.barcode || product.barcode || "",
                                        deliveryCharge: product.deliveryCharge || 0,
                                        gstPercentage: product.gstPercentage || 0,
                                        basePrice: product.basePrice || product.price || 0,
                                      },
                                    });
                                  }}
                                  disabled={outOfStock}
                                  className={`flex-1 min-w-0 bg-[#ED1C24] hover:bg-red-700 text-white text-xs sm:text-sm font-bold py-3 px-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed ${
                                    isBulkQty ? "opacity-60" : ""
                                  }`}
                                >
                                  Buy Now
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (outOfStock) {
                                      toast.error("This product is out of stock.");
                                      return;
                                    }
                                    if (orderQuantity < moq) {
                                      toast.error(`Minimum order quantity is ${moq} units.`);
                                      return;
                                    }
                                    if (!canUseRetailCheckout(product, orderQuantity)) {
                                      toast.info(`For ${orderQuantity} units, please use Request bulk quote.`);
                                      setWelcomeModalOpen(true);
                                      return;
                                    }
                                    const pricing = buildCartItemFields(product, orderQuantity);
                                    addItem(
                                      {
                                        id: product._id,
                                        name: showingTranslateValue(product.title),
                                        price: pricing.price,
                                        image: product.image?.[0],
                                        variant: selectVariant || {},
                                        minQty: pricing.minQty,
                                        maxQty: pricing.maxQty,
                                        quantityTiers: pricing.quantityTiers,
                                        listPrice: pricing.listPrice,
                                        stock: pricing.stock,
                                        hsnCode: pricing.hsnCode,
                                        sku: selectVariant?.sku || product.sku || "",
                                        barcode: selectVariant?.barcode || product.barcode || "",
                                        deliveryCharge: product.deliveryCharge || 0,
                                        gstPercentage: product.gstPercentage || 0,
                                        basePrice: product.basePrice || product.price || 0,
                                      },
                                      pricing.quantity
                                    );
                                    toast.success("Added to cart!");
                                  }}
                                  disabled={outOfStock}
                                  className={`flex-1 min-w-0 bg-[#0b1d3d] hover:bg-[#162542] text-white text-xs sm:text-sm font-bold py-3 px-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed ${
                                    isBulkQty ? "opacity-60" : ""
                                  }`}
                                >
                                  Add to Cart
                                </button>
                              </div>
                            </div>

                            {/* Bulk enquiry */}
                            <div
                              className={`rounded-xl border-2 p-4 w-full min-w-0 transition-all ${
                                isBulkQty
                                  ? "border-[#ED1C24] bg-red-50/80 shadow-sm"
                                  : "border-gray-200 bg-white"
                              }`}
                            >
                              <p className="text-[10px] font-black uppercase tracking-widest text-[#ED1C24] mb-1">
                                Bulk / wholesale quote
                              </p>
                              <p className="text-[11px] text-gray-600 mb-2">
                                {bulkThreshold}+ units — custom slab pricing, GST invoice &amp; delivery terms.
                              </p>
                              {orderPricing && (
                                <p className="text-sm font-bold text-[#0b1d3d] mb-3 break-words">
                                  Est. {currency}
                                  {getNumberTwo(orderPricing.estimatedTotal)} for {orderQuantity} pcs
                                  {orderPricing.discountPercent > 0 && (
                                    <span className="text-green-700 text-xs ml-1">
                                      ({orderPricing.discountPercent}% off list)
                                    </span>
                                  )}
                                </p>
                              )}
                              <button
                                type="button"
                                onClick={() => setWelcomeModalOpen(true)}
                                className="w-full bg-gradient-to-r from-[#051124] to-[#0b1d3d] hover:from-[#0b1d3d] hover:to-[#162542] text-white text-xs sm:text-sm font-black py-3.5 px-4 rounded-xl uppercase tracking-wide"
                              >
                                Request bulk quote
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-col mt-4">
                            <span className="font-serif font-semibold py-1 text-sm d-block">
                              <span className="text-gray-800">
                                {t("common:category")}:
                              </span>{" "}
                              <Link href={categoryUrl}>
                                <button
                                  type="button"
                                  className="text-gray-600 font-serif font-medium underline ml-2 hover:text-[#EF4036]"
                                >
                                  {category_name}
                                </button>
                              </Link>
                            </span>
                            <Tags product={product} />
                          </div>


                          {/* NEW: Replacement for Highlights on the Right - Value Prop */}
                          <div className="mt-8 pt-8 border-t border-gray-100">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                                <FiZap className="w-6 h-6 text-[#0b1d3d] mb-3" />
                                <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-1">Industrial Grade</h4>
                                <p className="text-[10px] text-gray-500 font-bold leading-relaxed">Built for heavy-duty environments and long-term reliability.</p>
                              </div>
                              <div className="p-4 bg-green-50/50 rounded-2xl border border-green-100/50">
                                <FiCheck className="w-6 h-6 text-green-600 mb-3" />
                                <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-1">Certified Quality</h4>
                                <p className="text-[10px] text-gray-500 font-bold leading-relaxed">Compliance with ISO and industry standards for safety.</p>
                              </div>
                            </div>
                          </div>


                          {/* Divider Line */}
                          <div className="border-t border-gray-200 mb-4 mt-6"></div>

                          {/* social share */}
                          <div className="mt-2">
                            <h3 className="text-base font-semibold mb-1 font-serif text-slate-700">
                              {t("common:shareYourSocial")}
                            </h3>
                            <p className="font-sans text-sm text-slate-500">
                              {t("common:shareYourSocialText")}
                            </p>
                            <ul className="flex mt-4">
                              <li className="flex items-center text-center border border-gray-100 rounded-full hover:bg-red-500  mr-2 transition ease-in-out duration-500">
                                <FacebookShareButton
                                  url={`https://elecmoon.com/product/${selectVariant?.slug || router.query.slug
                                    }`}
                                  quote=""
                                >
                                  <FacebookIcon size={32} round />
                                </FacebookShareButton>
                              </li>
                              <li className="flex items-center text-center border border-gray-100 rounded-full hover:bg-red-500  mr-2 transition ease-in-out duration-500">
                                <TwitterShareButton
                                  url={`https://elecmoon.com/product/${selectVariant?.slug || router.query.slug
                                    }`}
                                  quote=""
                                >
                                  <TwitterIcon size={32} round />
                                </TwitterShareButton>
                              </li>
                              <li className="flex items-center text-center border border-gray-100 rounded-full   mr-2 transition ease-in-out duration-500">
                                <a
                                  href={`https://www.instagram.com/?url=https://elecmoon.com/product/${selectVariant?.slug || router.query.slug
                                    }`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-center w-full h-full"
                                  aria-label="Share on Instagram"
                                >
                                  <FaInstagram
                                    size={32}
                                    style={{ color: "#E4405F" }}
                                  />
                                </a>
                              </li>
                              <li className="flex items-center text-center border border-gray-100 rounded-full hover:bg-red-500  mr-2 transition ease-in-out duration-500">
                                <WhatsappShareButton
                                  url={`https://elecmoon.com/product/${selectVariant?.slug || router.query.slug
                                    }`}
                                  quote=""
                                >
                                  <WhatsappIcon size={32} round />
                                </WhatsappShareButton>
                              </li>
                              <li className="flex items-center text-center border border-gray-100 rounded-full hover:bg-red-500  mr-2 transition ease-in-out duration-500">
                                <LinkedinShareButton
                                  url={`https://elecmoon.com/product/${selectVariant?.slug || router.query.slug
                                    }`}
                                  quote=""
                                >
                                  <LinkedinIcon size={32} round />
                                </LinkedinShareButton>
                              </li>
                              <li className="flex items-center text-center border border-gray-100 rounded-full hover:bg-gray-100 px-3 cursor-pointer transition ease-in-out duration-500" onClick={handleSocialShare}>
                                <div className="flex items-center gap-2 py-1.5 h-[32px]">
                                  <FiShare2 className="text-[#0b1d3d] w-5 h-5" />
                                  <span className="text-[10px] font-bold text-[#0b1d3d] uppercase tracking-wider hidden sm:block">Share</span>
                                </div>
                              </li>
                            </ul>
                          </div>
                        </div>


                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Reviews - INDUSTRY LEVEL COMPACT DESIGN */}
              <div className="mt-12 w-full max-w-screen-2xl mx-auto px-4 lg:px-12 mb-12 border-t border-gray-100 pt-12">
                <div className="flex flex-col md:flex-row items-baseline justify-between mb-6 gap-2">
                  <div>
                    <h3 className="text-xl font-black text-slate-700 ">Customer Reviews</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex text-yellow-400 text-sm">★★★★★</div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Verified Ratings</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 items-start">
                  {/* Reviews List */}
                  <div className="w-full">
                    {reviews.length === 0 ? (
                      <div className="flex flex-col items-center justify-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200 p-12 text-center">
                        <FiShoppingBag className="w-8 h-8 text-gray-300 mb-4" />
                        <h5 className="text-lg font-black text-gray-900 mb-1">No reviews yet</h5>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Be the first to rate this product</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-6">
                        {reviews.slice(0, 10).map((rev, i) => (
                          <div key={i} className="bg-white p-2 rounded-lg border-b border-gray-100 last:border-0 pb-8">
                            {/* Stars & Summary Line */}
                            <div className="flex items-center gap-3 mb-2">
                              <div className="bg-green-600 px-1.5 py-0.5 rounded flex items-center gap-1">
                                <span className="text-[10px] font-black text-white">{rev.rating}.0</span>
                                <span className="text-white text-[8px]">★</span>
                              </div>
                              <span className="font-black text-gray-900 text-sm tracking-tight">Highly Recommended</span>
                            </div>

                            {/* Variant / Detail Info */}
                            <div className="text-[10px] text-gray-400 font-bold mb-3 uppercase tracking-wider">
                              Order for: Standard Design • Industrial Build
                            </div>

                            {/* Comment */}
                            <p className="text-gray-700 text-sm leading-relaxed mb-4 font-medium">
                              {rev.comment}
                            </p>

                            {/* Multiple Images Grid */}
                            {rev.images?.length > 0 && (
                              <div className="flex flex-wrap gap-3 mb-6">
                                {rev.images.map((img, idx) => (
                                  <div key={idx} className="w-24 h-24 md:w-32 md:h-32 relative rounded-lg overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-zoom-in">
                                    <img
                                      src={img}
                                      alt={`Review ${idx + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Author & Footer */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-black text-gray-800">{rev.name}</span>
                                  <span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest bg-gray-100 px-1 rounded">Mumbai, IN</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <div className="w-4 h-4 bg-gray-900 rounded-full flex items-center justify-center">
                                    <FiCheck className="text-white w-2.5 h-2.5" />
                                  </div>
                                  <span className="text-[10px] text-gray-500 font-bold">Verified Purchase • Oct, 2024</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                  <button className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-[10px] font-black text-gray-600 hover:bg-gray-50 transition-colors uppercase tracking-widest">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 10h4.708c.937 0 1.708.771 1.708 1.708v.117a3 3 0 01-.4 1.5l-2 3.333a3 3 0 01-2.5 1.5H10V8l2-4 1 1v5h1z" /></svg>
                                    Helpful ({12 + i})
                                  </button>
                                  <button className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-[10px] font-black text-gray-400 hover:bg-gray-50 transition-colors uppercase tracking-widest">
                                    <svg className="w-3 h-3 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 10h4.708c.937 0 1.708.771 1.708 1.708v.117a3 3 0 01-.4 1.5l-2 3.333a3 3 0 01-2.5 1.5H10V8l2-4 1 1v5h1z" /></svg>
                                    {3 + i}
                                  </button>
                                </div>

                                {userInfo && rev?.user === userInfo?._id && (
                                  <div className="flex gap-3 border-l border-gray-200 pl-4 ml-1">
                                    <button onClick={() => handleEdit(rev)} className="text-[10px] text-blue-500 font-black uppercase hover:text-blue-700">Edit</button>
                                    <button onClick={() => handleDelete(rev._id)} className="text-[10px] text-red-500 font-black uppercase hover:text-red-700">Delete</button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Form - Shifted to Bottom & Restricted to Logged-in Users */}
                {userInfo && (
                  <div id="review-form" className="bg-[#0b1d3d] p-4 rounded-xl shadow-lg relative overflow-hidden mt-12">
                    <form onSubmit={submitReview} className="space-y-3 relative z-10">
                      <div className="flex flex-col md:flex-row gap-3 items-center">
                        <div className="flex-1 w-full">
                          <input
                            type="text"
                            value={reviewerName || userInfo?.name}
                            onChange={(e) => setReviewerName(e.target.value)}
                            placeholder="Name"
                            className="w-full h-[38px] px-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/50 transition-all text-xs font-bold"
                            required
                          />
                        </div>
                        <div className="w-full md:w-[180px]">
                          <select
                            value={rating}
                            onChange={(e) => setRating(e.target.value)}
                            className="w-full h-[38px] px-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/50 transition-all text-xs font-black appearance-none cursor-pointer"
                          >
                            <option value="5" className="text-gray-900">5 ★ (Excellent)</option>
                            <option value="4" className="text-gray-900">4 ★ (Good)</option>
                            <option value="3" className="text-gray-900">3 ★ (Average)</option>
                            <option value="2" className="text-gray-900">2 ★ (Poor)</option>
                            <option value="1" className="text-gray-900">1 ★ (Terrible)</option>
                          </select>
                        </div>
                        <div className="shrink-0">
                          <Uploader
                            setImageUrl={setReviewImg}
                            imageUrl={reviewImg}
                            isCompact={true}
                            multiple={true}
                            onUploadingChange={setIsReviewImageUploading}
                          />
                        </div>
                        <div className="shrink-0 flex gap-2">
                          <button
                            type="submit"
                            disabled={isReviewImageUploading}
                            className="h-[38px] px-6 bg-white text-[#0b1d3d] rounded-lg hover:bg-gray-100 transition-all font-black text-xs uppercase tracking-widest shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <FiCheck className="w-4 h-4" />
                            {isEditing ? "Update" : "Post"}
                          </button>
                          {isEditing && (
                            <button onClick={() => { setIsEditing(false); setEditId(null); setReviewerName(userInfo?.name || ""); setReviewText(""); setRating(5); setReviewImg([]); }} className="h-[38px] px-3 text-red-400 bg-red-400/10 rounded-lg border border-red-400/20 hover:bg-red-400/10 transition-all text-[10px] font-black uppercase">
                              ×
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <textarea
                          value={reviewText}
                          onChange={(e) => setReviewText(e.target.value)}
                          placeholder="Write your feedback here..."
                          className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/50 transition-all text-xs font-medium min-h-[44px] max-h-[80px] resize-none shadow-inner"
                          required
                        ></textarea>
                      </div>
                    </form>
                  </div>
                )}
              </div>

              {/* related products */}
              {relatedProducts?.length >= 1 && (
                <div className="pt-10 lg:pt-16 pb-10">
                  <h3 className="leading-7 text-xl lg:text-2xl mb-6 font-extrabold font-serif text-slate-700">
                    {t("common:relatedProducts")}
                  </h3>
                  <div className="flex">
                    <div className="w-full">
                      <div className={PRODUCT_GRID_CLASS}>
                        {relatedProducts?.slice(0, 13).map((product, i) => (
                          <div key={product._id} className={PRODUCT_GRID_ITEM_CLASS}>
                          <ProductCard
                            product={product}
                            attributes={attributes}
                          />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Layout >
      )}
    </>
  );
};

export const getServerSideProps = async (context) => {
  const { slug } = context.params;

  try {
    // Optimization: Fetch only the specific product first by slug
    // This is much faster than fetching multiple products
    const [productData, attributes] = await Promise.all([
      ProductServices.getProductBySlug(slug),
      AttributeServices.getShowingAttributes({}),
    ]);

    if (!productData) {
      return {
        redirect: {
          destination: "/products",
          permanent: false,
        },
      };
    }


    let product = sanitizeProduct(productData);

    // Fetch related products separately or keep it empty if not needed immediately
    // For speed, we can fetch related products based on category of the main product
    let relatedProducts = [];
    if (product?.category?._id) {
      const categoryData = await ProductServices.getShowingStoreProducts({
        category: product.category._id,
      });
      const products = Array.isArray(categoryData) ? categoryData : (categoryData?.products || []);
      relatedProducts = sanitizeData(
        products.filter((p) => p._id !== product._id).slice(0, 8)
      );
    }

    return {
      props: {
        product,
        attributes: sanitizeData(attributes) || [],
        relatedProducts,
      },
    };
  } catch (error) {
    console.error("Error in getServerSideProps:", error);
    return {
      props: { product: null, attributes: [], relatedProducts: [] },
    };
  }
};

export default ProductScreen;
