import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { useCart } from "react-use-cart";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  FiCreditCard,
  FiMinus,
  FiPlus,
  FiTruck,
  FiShoppingBag,
  FiLock,
  FiArrowLeft,
  FiAlertCircle,
} from "react-icons/fi";

// internal import
import Layout from "@layout/Layout";
import OrderServices from "@services/OrderServices";
import SettingServices from "@services/SettingServices";
import { UserContext } from "@context/UserContext";
import useUtilsFunction from "@hooks/useUtilsFunction";
import {
  resolveCartLinePrice,
  syncCartQuantity,
  loadBuyNowPricing,
} from "@utils/quantityPricing";
import { appendRedirectUrl } from "@utils/authRedirect";
import {
  getFriendlyErrorMessage,
  handleSessionExpired,
  isJwtExpired,
  wasAuthErrorHandled,
} from "@lib/authSession";

const Checkout = () => {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const { items, emptyCart, updateItem } = useCart();
  const { state: { userInfo } } = useContext(UserContext);
  const { currency, getNumber } = useUtilsFunction();
  const placingRef = useRef(false);

  const { data: storeSetting } = useQuery({
    queryKey: ["storeSetting"],
    queryFn: async () => await SettingServices.getStoreSetting(),
    staleTime: 30 * 1000,
    refetchOnMount: "always",
  });

  const isCodEnabled = storeSetting?.cod_status !== false;

  const sessionIssue = useMemo(() => {
    if (sessionStatus === "loading") return null;
    if (sessionStatus !== "authenticated" || !session?.user?.token) {
      return "login";
    }
    if (isJwtExpired(session.user.token)) {
      return "expired";
    }
    return null;
  }, [session, sessionStatus]);

  const loginHref = appendRedirectUrl(
    "/auth/login",
    router.asPath || "/checkout"
  );

  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("PhonePe");
  const [checkoutStep, setCheckoutStep] = useState(1); // 1 = Details, 2 = Review & Payment
  const [shippingData, setShippingData] = useState(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();

  const [buyNowItem, setBuyNowItem] = useState(null);

  useEffect(() => {
    if (router.query.error) {
      const code = router.query.error;
      const errorMsg =
        router.query.msg ||
        (code === "payment_cancelled"
          ? "Payment was cancelled. You can retry checkout."
          : code === "payment_pending"
            ? "Payment is still processing. Check My Orders in a minute."
            : code === "payment_failed"
              ? "Payment failed. No order was confirmed — you can retry."
              : "Payment could not be completed. Please try again.");
      toast.error(errorMsg);
    }
  }, [router.query.error, router.query.msg]);

  useEffect(() => {
    if (!isCodEnabled && paymentMethod === "Cash") {
      setPaymentMethod("PhonePe");
    }
  }, [isCodEnabled, paymentMethod]);

  const isBuyNowFlow = Boolean(
    buyNowItem ||
    (router.query?.buyNow && router.query?.id) ||
    (typeof window !== "undefined" && window.location.search.includes("buyNow=true"))
  );

  const getQueryString = (value) => {
    if (Array.isArray(value)) return value[0];
    return value;
  };

  // Parse Buy Now item if it exists in query
  useEffect(() => {
    const qId = getQueryString(router.query.id) || (typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("id") : null);
    const qBuyNow = router.query.buyNow || (typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("buyNow") === "true" : false);

    if (qBuyNow && qId) {
      const qTitle = getQueryString(router.query.title) || (typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("title") : null);
      const qPrice = getQueryString(router.query.price) || (typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("price") : null);
      const qImage = getQueryString(router.query.image) || (typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("image") : null);
      const qQty = getQueryString(router.query.quantity) || (typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("quantity") : null);
      const qDeliveryCharge = getQueryString(router.query.deliveryCharge) || (typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("deliveryCharge") : null);

      const qty = parseInt(qQty, 10) || 1;
      const stored = loadBuyNowPricing(qId) || {};
      const parsedPrice = parseFloat(qPrice) || parseFloat(stored.price) || parseFloat(stored.listPrice) || 0;

      const line = {
        _id: qId,
        id: qId,
        name: qTitle || stored.name || stored.title || "Product",
        title: qTitle || stored.title || stored.name || "Product",
        price: parsedPrice,
        image: qImage || stored.image || "",
        quantity: qty,
        minQty: stored.minQty || qty,
        maxQty: stored.maxQty || 0,
        quantityTiers: stored.quantityTiers || [],
        listPrice: stored.listPrice || parsedPrice,
        deliveryCharge: parseFloat(qDeliveryCharge) || stored.deliveryCharge || 0,
        gstPercentage: parseFloat(getQueryString(router.query.gstPercentage)) || stored.gstPercentage || 0,
        basePrice: parseFloat(getQueryString(router.query.basePrice)) || stored.basePrice || parsedPrice,
        sku: getQueryString(router.query.sku) || stored.sku || "",
        barcode: getQueryString(router.query.barcode) || stored.barcode || "",
        variant: stored.variant || {},
      };
      const resolved = resolveCartLinePrice(line, qty);
      const finalPrice = resolved.price || parsedPrice || 0;
      setBuyNowItem({
        ...line,
        quantity: resolved.quantity || qty,
        price: finalPrice,
        itemTotal: finalPrice * (resolved.quantity || qty),
      });
    }
  }, [
    router.isReady,
    router.query.buyNow,
    router.query.id,
    router.query.title,
    router.query.price,
    router.query.image,
    router.query.quantity,
    router.query.deliveryCharge,
    router.query.gstPercentage,
    router.query.basePrice,
    router.query.sku,
    router.query.barcode,
  ]);

  const incrementBuyNow = () => {
    setBuyNowItem((prev) => {
      if (!prev) return prev;
      const resolved = resolveCartLinePrice(prev, prev.quantity + 1);
      return {
        ...prev,
        quantity: resolved.quantity,
        price: resolved.price,
        itemTotal: resolved.price * resolved.quantity,
      };
    });
  };

  const decrementBuyNow = () => {
    setBuyNowItem((prev) => {
      if (!prev) return prev;
      const resolved = resolveCartLinePrice(prev, prev.quantity - 1);
      return {
        ...prev,
        quantity: resolved.quantity,
        price: resolved.price,
        itemTotal: resolved.price * resolved.quantity,
      };
    });
  };

  // Determine current items to display/order
  const orderItems = useMemo(() => {
    const currentItems = (buyNowItem || isBuyNowFlow) ? (buyNowItem ? [buyNowItem] : []) : items;
    return (currentItems || []).map((item) => {
      const unitPrice = parseFloat(item?.price) || 0;
      const quantity = parseInt(item?.quantity, 10) || 1;
      const itemTotal =
        typeof item?.itemTotal === "number" && !isNaN(item.itemTotal)
          ? item.itemTotal
          : unitPrice * quantity;

      return {
        ...item,
        _id: item._id || item.id,
        id: item.id || item._id,
        quantity,
        price: unitPrice,
        itemTotal,
        variant: item.variant || {},
      };
    });
  }, [isBuyNowFlow, buyNowItem, items]);

  const currentTotal = useMemo(() => {
    return orderItems.reduce(
      (sum, item) => sum + (parseFloat(item.itemTotal) || 0),
      0
    );
  }, [orderItems]);

  const deliveryCharges = useMemo(() => {
    return orderItems.reduce(
      (sum, item) =>
        sum +
        (parseFloat(item?.deliveryCharge) || 0) *
        (parseInt(item?.quantity) || 0),
      0
    );
  }, [orderItems]);

  const grandTotal = currentTotal + deliveryCharges;

  // Populate form if user info exists
  useEffect(() => {
    if (userInfo) {
      setValue("firstName", userInfo.name?.split(" ")[0] || "");
      setValue("lastName", userInfo.name?.split(" ").slice(1).join(" ") || "");
      setValue("email", userInfo.email || "");
      setValue("phoneNumber", userInfo.phone || "");
    }
  }, [userInfo, setValue]);

  const placeOrder = async () => {
    if (loading || placingRef.current) return;
    if (!shippingData) return;

    if (sessionIssue) {
      await handleSessionExpired();
      return;
    }

    if (!orderItems || orderItems.length === 0) {
      toast.error("Cart is empty. Please select a product to checkout.");
      return;
    }

    placingRef.current = true;
    try {
      setLoading(true);

      const orderPayloadBase = {
        user_info: {
          name: `${shippingData.firstName} ${shippingData.lastName}`.trim(),
          email: shippingData.email,
          contact: shippingData.phoneNumber,
          address: shippingData.address,
          city: shippingData.city,
          country: shippingData.country,
          zipCode: shippingData.zipCode,
        },
        cart: orderItems.map((item) => ({
          _id: item._id || item.id,
          id: item.id || item._id,
          title: item.title || item.name || "Product",
          image: item.image,
          price: item.price,
          quantity: item.quantity,
          itemTotal: item.itemTotal,
          variant: item.variant || {},
          gstPercentage: item.gstPercentage || 0,
          basePrice: item.basePrice || item.price,
          sku: item.sku || "",
          barcode: item.barcode || "",
        })),
        subTotal: currentTotal,
        shippingOption: "Product Delivery",
        shippingCost: deliveryCharges,
        discount: 0,
        total: grandTotal,
      };

      if (paymentMethod === "PhonePe") {
        const phonepeRes = await OrderServices.createPhonePePayment(
          orderPayloadBase
        );
        if (phonepeRes?.success && phonepeRes?.redirectUrl) {
          toast.loading("Redirecting to PhonePe… Please do not refresh.");
          // Keep loading=true; page will navigate away
          window.location.href = phonepeRes.redirectUrl;
          return;
        }
        throw new Error(
          phonepeRes?.message || "Failed to initialize PhonePe payment"
        );
      }

      if (paymentMethod === "Cash") {
        if (!isCodEnabled) {
          throw new Error(
            "Cash on Delivery is currently unavailable. Please pay with PhonePe."
          );
        }
        const res = await OrderServices.addOrder({
          ...orderPayloadBase,
          paymentMethod: "Cash",
        });
        toast.success("Order placed successfully!");
        if (!buyNowItem) emptyCart();
        router.push(`/user/thank-you?orderId=${res._id}`);
        return;
      }

      throw new Error("Unsupported payment method selected.");
    } catch (err) {
      if (wasAuthErrorHandled(err)) {
        setLoading(false);
        placingRef.current = false;
        return;
      }
      toast.error(
        getFriendlyErrorMessage(
          err,
          "Could not place your order. Please try again."
        )
      );
      setLoading(false);
      placingRef.current = false;
    }
  };

  // Step 1 submit: only store shipping details, then go to payment step
  const onShippingSubmit = async (data) => {
    setShippingData(data);
    setCheckoutStep(2);
  };

  if (
    orderItems.length === 0 &&
    !loading &&
    !isBuyNowFlow
  ) {
    return (
      <Layout title="Checkout" description="Complete your order at Elecmoon">
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
            <FiShoppingBag className="w-12 h-12 text-gray-300" />
          </div>
          <h2 className="text-2xl font-black text-[#0b1d3d] mb-2 uppercase">Your cart is empty</h2>
          <p className="text-gray-500 mb-8 max-w-md">
            Looks like you haven't added anything to your cart yet. Browse our professional products to get started.
          </p>
          <Link
            href="/products"
            className="bg-[#0b1d3d] text-white px-10 py-4 rounded-xl font-bold hover:bg-[#162542] transition-all shadow-xl active:scale-95"
          >
            Start Shopping
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Checkout" description="Complete your order at Elecmoon">
      <div className="bg-gray-50 min-h-screen py-10 lg:py-20">
        <div className="max-w-screen-2xl mx-auto px-3 sm:px-6 lg:px-10 min-w-0">
          {/* Go Back Button */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-[#0b1d3d] hover:opacity-70 transition-all font-black uppercase tracking-widest text-xs group"
            >
              <div className="w-8 h-8 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center group-hover:bg-gray-50 transition-colors">
                <FiArrowLeft className="w-4 h-4" />
              </div>
              Go Back
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-10">
            {/* Left Column: Shipping + Payment */}
            <div className="lg:w-2/3">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 text-white flex items-center justify-between bg-[#0b1d3d]">
                  <div className="flex items-center gap-3">
                    <FiTruck className="w-6 h-6 text-red-500" />
                    <h2 className="text-lg font-bold uppercase tracking-widest">
                      {checkoutStep === 1
                        ? "Delivery Details"
                        : "Payment"}
                    </h2>
                  </div>
                  <div className="text-xs font-medium text-white/70">
                    Step {checkoutStep} of 2
                  </div>
                </div>

                <div className="p-8">
                  {/* Stepper */}
                  <div className="flex items-center gap-3 mb-8">
                    <div className={`flex-1 h-1 rounded-full ${checkoutStep >= 1 ? "bg-[#0b1d3d]" : "bg-gray-200"}`} />
                    <div className={`flex-1 h-1 rounded-full ${checkoutStep >= 2 ? "bg-[#0b1d3d]" : "bg-gray-200"}`} />
                  </div>

                  {checkoutStep === 1 && (
                    <form onSubmit={handleSubmit(onShippingSubmit)} className="space-y-8">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase text-gray-400 tracking-widest">
                            First Name
                          </label>
                          <input
                            {...register("firstName", { required: "First name is required" })}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-4 text-sm font-medium focus:ring-2 focus:ring-[#0b1d3d] outline-none transition-all"
                            placeholder="John"
                          />
                          {errors.firstName && (
                            <p className="text-red-500 text-[10px] font-bold uppercase">
                              {errors.firstName.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase text-gray-400 tracking-widest">
                            Last Name
                          </label>
                          <input
                            {...register("lastName", { required: "Last name is required" })}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-4 text-sm font-medium focus:ring-2 focus:ring-[#0b1d3d] outline-none transition-all"
                            placeholder="Doe"
                          />
                          {errors.lastName && (
                            <p className="text-red-500 text-[10px] font-bold uppercase">
                              {errors.lastName.message}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase text-gray-400 tracking-widest">
                            Email Address
                          </label>
                          <input
                            {...register("email", { required: "Email is required" })}
                            type="email"
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-4 text-sm font-medium focus:ring-2 focus:ring-[#0b1d3d] outline-none transition-all"
                            placeholder="john@example.com"
                          />
                          {errors.email && (
                            <p className="text-red-500 text-[10px] font-bold uppercase">
                              {errors.email.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase text-gray-400 tracking-widest">
                            Phone Number
                          </label>
                          <input
                            {...register("phoneNumber", { required: "Phone number is required" })}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-4 text-sm font-medium focus:ring-2 focus:ring-[#0b1d3d] outline-none transition-all"
                            placeholder="+91 9717372217"
                          />
                          {errors.phoneNumber && (
                            <p className="text-red-500 text-[10px] font-bold uppercase">
                              {errors.phoneNumber.message}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase text-gray-400 tracking-widest">
                          Street Address
                        </label>
                        <input
                          {...register("address", { required: "Address is required" })}
                          className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-4 text-sm font-medium focus:ring-2 focus:ring-[#0b1d3d] outline-none transition-all"
                          placeholder="123 Street Name"
                        />
                        {errors.address && (
                          <p className="text-red-500 text-[10px] font-bold uppercase">
                            {errors.address.message}
                          </p>
                        )}
                      </div>

                      <div className="grid md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase text-gray-400 tracking-widest">
                            City
                          </label>
                          <input
                            {...register("city", { required: "City is required" })}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-4 text-sm font-medium focus:ring-2 focus:ring-[#0b1d3d] outline-none transition-all"
                            placeholder="Melbourne"
                          />
                          {errors.city && (
                            <p className="text-red-500 text-[10px] font-bold uppercase">
                              {errors.city.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase text-gray-400 tracking-widest">
                            Country
                          </label>
                          <input
                            {...register("country", { required: "Country is required" })}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-4 text-sm font-medium focus:ring-2 focus:ring-[#0b1d3d] outline-none transition-all"
                            placeholder="Australia"
                          />
                          {errors.country && (
                            <p className="text-red-500 text-[10px] font-bold uppercase">
                              {errors.country.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase text-gray-400 tracking-widest">
                            Zip Code
                          </label>
                          <input
                            {...register("zipCode", { required: "Zip code is required" })}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-4 text-sm font-medium focus:ring-2 focus:ring-[#0b1d3d] outline-none transition-all"
                            placeholder="3000"
                          />
                          {errors.zipCode && (
                            <p className="text-red-500 text-[10px] font-bold uppercase">
                              {errors.zipCode.message}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#0b1d3d] hover:bg-[#162542] text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-sm transition-all shadow-2xl active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
                      >
                        {loading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <FiLock className="w-4 h-4" />
                            Continue to Review {currency}
                            {getNumber(grandTotal)}
                          </>

                        )}
                      </button>
                    </form>
                  )}

                  {checkoutStep === 2 && (
                    <div className="space-y-8">
                      {!shippingData ? (
                        <div className="bg-yellow-50 border border-yellow-200 text-yellow-900 rounded-xl p-5">
                          Delivery details missing. Please go back and fill your information.
                          <div className="mt-4">
                            <button
                              type="button"
                              onClick={() => {
                                setCheckoutStep(1);
                              }}
                              className="w-full bg-[#0b1d3d] hover:bg-[#162542] text-white py-3 rounded-xl font-bold"
                            >
                              Back to Details
                            </button>
                          </div>
                        </div>
                      ) : false ? (
                        <div className="space-y-8">
                          <div className="bg-white border border-gray-100 rounded-2xl p-5">
                            <h4 className="text-sm font-black uppercase tracking-widest text-[#0b1d3d]">
                              Delivery Details Preview
                            </h4>
                            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                  Name
                                </p>
                                <p className="text-sm font-bold text-gray-900 mt-1">
                                  {shippingData.firstName} {shippingData.lastName}
                                </p>
                              </div>
                              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                  Contact
                                </p>
                                <p className="text-sm font-bold text-gray-900 mt-1">
                                  {shippingData.phoneNumber}
                                </p>
                                <p className="text-[12px] text-gray-600 mt-1">
                                  {shippingData.email}
                                </p>
                              </div>
                              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 md:col-span-2">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                  Address
                                </p>
                                <p className="text-sm font-bold text-gray-900 mt-1">
                                  {shippingData.address}
                                </p>
                                <p className="text-[12px] text-gray-600 mt-1">
                                  {shippingData.city}, {shippingData.country} - {shippingData.zipCode}
                                </p>
                              </div>
                            </div>
                            <div className="mt-4">
                              <button
                                type="button"
                                disabled={loading}
                                onClick={() => {
                                  setCheckoutStep(1);
                                }}
                                className="w-full bg-white border border-gray-200 text-gray-900 py-3 rounded-xl font-bold hover:bg-gray-50 disabled:opacity-50"
                              >
                                Edit Details
                              </button>
                            </div>
                          </div>

                          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 space-y-4">
                            <div className="flex items-center gap-3">
                              <FiLock className="w-5 h-5 text-[#0b1d3d]" />
                              <h3 className="text-sm font-black uppercase tracking-widest text-[#0b1d3d]">
                                Lock Quantity (One Time)
                              </h3>
                            </div>
                            <p className="text-sm text-gray-600">
                              Order Summary ke andar aap quantity ko increase/decrease kar sakte ho. Confirm karne ke baad quantity lock ho jayegi.
                            </p>
                            <button
                              type="button"
                              disabled={loading || orderItems.length === 0}
                              onClick={() => setCheckoutStep(2)}
                              className="w-full bg-[#0b1d3d] hover:bg-[#162542] text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-sm transition-all shadow-2xl active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                              <FiLock className="w-4 h-4" />
                              Confirm Quantity
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-8">
                          <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-white border border-gray-100 rounded-2xl p-5">
                              <h4 className="text-sm font-black uppercase tracking-widest text-[#0b1d3d]">
                                Product
                              </h4>

                              <div className="mt-4 w-full aspect-[4/3] bg-gray-50 rounded-xl border border-gray-100 overflow-hidden relative">
                                {orderItems?.[0]?.image ? (
                                  <Image
                                    src={orderItems?.[0]?.image}
                                    alt={orderItems?.[0]?.name || "Product"}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                                    <FiShoppingBag className="w-8 h-8" />
                                  </div>
                                )}
                              </div>

                              <div className="mt-3">
                                <p className="text-sm font-bold text-gray-900 line-clamp-1 truncate">
                                  {orderItems?.[0]?.name}
                                </p>
                                <p className="text-[12px] text-gray-500 font-medium mt-1">
                                  Qty: {orderItems?.[0]?.quantity}
                                </p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-1">(Incl. GST)</p>
                              </div>

                            </div>

                            <div className="bg-white border border-gray-100 rounded-2xl p-5">
                              <h4 className="text-sm font-black uppercase tracking-widest text-[#0b1d3d]">
                                User Details
                              </h4>
                              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                    Name
                                  </p>
                                  <p className="text-sm font-bold text-gray-900 mt-1">
                                    {shippingData.firstName} {shippingData.lastName}
                                  </p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                    Contact
                                  </p>
                                  <p className="text-sm font-bold text-gray-900 mt-1">
                                    {shippingData.phoneNumber}
                                  </p>
                                  <p className="text-[12px] text-gray-600 mt-1">
                                    {shippingData.email}
                                  </p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 md:col-span-2">
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                    Address
                                  </p>
                                  <p className="text-sm font-bold text-gray-900 mt-1">
                                    {shippingData.address}
                                  </p>
                                  <p className="text-[12px] text-gray-600 mt-1">
                                    {shippingData.city}, {shippingData.country} - {shippingData.zipCode}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-4">
                                <button
                                  type="button"
                                  disabled={loading}
                                  onClick={() => setCheckoutStep(1)}
                                  className="w-full bg-white border border-gray-200 text-gray-900 py-3 rounded-xl font-bold hover:bg-gray-50 disabled:opacity-50"
                                >
                                  Edit Details
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <FiCreditCard className="w-5 h-5 text-red-500" />
                            <h3 className="text-sm font-black uppercase tracking-widest text-[#0b1d3d]">
                              Select Payment Method
                            </h3>
                          </div>

                          <div className={`grid grid-cols-1 ${isCodEnabled ? "sm:grid-cols-2" : ""} gap-4`}>
                            <div
                              onClick={() => !loading && setPaymentMethod("PhonePe")}
                              className={`p-5 border-2 rounded-2xl cursor-pointer transition-all flex items-center justify-between ${paymentMethod === "PhonePe"
                                  ? "border-purple-600 bg-purple-50/50 shadow-sm"
                                  : "border-gray-100 bg-white hover:border-gray-200"
                                }`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === "PhonePe"
                                      ? "border-purple-600"
                                      : "border-gray-300"
                                    }`}
                                >
                                  {paymentMethod === "PhonePe" && (
                                    <div className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <p className="font-bold text-sm text-[#0b1d3d]">
                                      PhonePe
                                    </p>
                                    <span className="text-[9px] bg-purple-600 text-white font-extrabold px-1.5 py-0.5 rounded uppercase">
                                      Secure
                                    </span>
                                  </div>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                    UPI / QR / Cards / NetBanking
                                  </p>
                                </div>
                              </div>
                              <FiLock className="text-purple-400" />
                            </div>

                            {isCodEnabled && (
                              <div
                                onClick={() => !loading && setPaymentMethod("Cash")}
                                className={`p-5 border-2 rounded-2xl cursor-pointer transition-all flex items-center justify-between ${paymentMethod === "Cash"
                                    ? "border-[#0b1d3d] bg-blue-50/50"
                                    : "border-gray-100 bg-white hover:border-gray-200"
                                  }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === "Cash"
                                        ? "border-[#0b1d3d]"
                                        : "border-gray-300"
                                      }`}
                                  >
                                    {paymentMethod === "Cash" && (
                                      <div className="w-2.5 h-2.5 rounded-full bg-[#0b1d3d]" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-bold text-sm text-[#0b1d3d]">
                                      Cash On Delivery
                                    </p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                      Pay when you receive
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="pt-2">
                            {sessionIssue && (
                              <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-3">
                                <FiAlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  <p className="font-bold text-amber-900 text-sm">
                                    {sessionIssue === "expired"
                                      ? "Your session has expired"
                                      : "Sign in required"}
                                  </p>
                                  <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                                    {sessionIssue === "expired"
                                      ? "For your security, please sign in again to complete payment. Your cart is still saved."
                                      : "Please sign in to place your order securely."}
                                  </p>
                                  <Link
                                    href={loginHref}
                                    className="inline-block mt-3 bg-[#0b1d3d] text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg hover:bg-[#162542] transition-colors"
                                  >
                                    Sign in to continue
                                  </Link>
                                </div>
                              </div>
                            )}

                            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-start gap-4 mb-6">
                              <FiLock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                              <p className="text-[11px] text-blue-800 font-medium leading-relaxed">
                                Your transaction is secure and encrypted. By placing the order, you agree to our terms of service and privacy policy.
                              </p>
                            </div>

                            <button
                              type="button"
                              disabled={loading || !shippingData || Boolean(sessionIssue)}
                              onClick={placeOrder}
                              className="w-full bg-[#0b1d3d] hover:bg-[#162542] text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-sm transition-all shadow-2xl active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                              {loading ? (
                                <>
                                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <FiLock className="w-4 h-4" />
                                  {paymentMethod === "Cash"
                                    ? `Place Order ${currency}${getNumber(grandTotal)}`
                                    : `Pay & Place Order ${currency}${getNumber(grandTotal)}`}
                                </>
                              )}
                            </button>

                            <div className="mt-4">
                              <button
                                type="button"
                                disabled={loading}
                                onClick={() => {
                                  setCheckoutStep(1);
                                }}
                                className="w-full bg-white border border-gray-200 text-gray-900 py-3.5 rounded-2xl font-bold text-sm hover:bg-gray-50 transition-all active:scale-[0.98] disabled:opacity-50"
                              >
                                Back to Details
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Summary */}
            <div className="lg:w-1/3">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-28">
                <div className="p-6 border-b border-gray-100 flex items-center gap-3 bg-gray-50">
                  <FiShoppingBag className="w-5 h-5 text-[#0b1d3d]" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-[#0b1d3d]">
                    Order Summary
                  </h3>
                </div>

                <div className="p-6 space-y-6">
                  <div className="max-h-[300px] overflow-y-auto space-y-5 pr-2 custom-scrollbar">
                    {orderItems.map((item) => {
                      const minQty = parseInt(item.minQty) || 1;
                      const isBuyNowItem = !!buyNowItem;
                      return (
                        <div key={item.id} className="flex gap-4 items-center group">
                          <div className="w-16 h-16 relative rounded-xl overflow-hidden border border-gray-100 flex-shrink-0 bg-gray-50">
                            {item.image ? (
                              <Image src={item.image} alt={item.name} fill className="object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-200">
                                <FiShoppingBag />
                              </div>
                            )}
                          </div>

                          <div className="flex-grow min-w-0">
                            <h4 className="text-[13px] font-bold text-gray-900 line-clamp-1 truncate">
                              {item.name}
                            </h4>

                            <div className="flex items-center justify-between mt-1">
                              <p className="text-[11px] text-gray-500 font-medium">
                                Qty: {item.quantity}
                              </p>
                              <p className="text-sm font-bold text-[#0b1d3d]">
                                {currency}
                                {getNumber(item.itemTotal)}
                              </p>
                            </div>

                            <div className="flex items-center gap-3 mt-3">
                              <div className="flex items-center border border-gray-100 rounded-lg bg-gray-50/50 p-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isBuyNowItem) {
                                      decrementBuyNow();
                                    } else {
                                      syncCartQuantity(
                                        updateItem,
                                        item,
                                        item.quantity - 1
                                      );
                                    }
                                  }}
                                  className="p-1 rounded-md hover:bg-white hover:shadow-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed no-green-button"
                                  disabled={
                                    checkoutStep === 2 || item.quantity <= minQty
                                  }
                                >
                                  <FiMinus className="w-3 h-3 text-gray-600" />
                                </button>

                                <span className="text-xs font-bold text-gray-900 w-8 text-center">
                                  {item.quantity}
                                </span>

                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isBuyNowItem) {
                                      incrementBuyNow();
                                    } else {
                                      syncCartQuantity(
                                        updateItem,
                                        item,
                                        item.quantity + 1
                                      );
                                    }
                                  }}
                                  disabled={
                                    checkoutStep === 2 ||
                                    (item.maxQty > 0 && item.quantity >= item.maxQty)
                                  }
                                  className="p-1 rounded-md hover:bg-white hover:shadow-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed no-green-button"
                                >
                                  <FiPlus className="w-3 h-3 text-gray-600" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-6 border-t border-gray-100 space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 font-medium">Subtotal</span>
                      <span className="text-gray-900 font-bold">
                        {currency}
                        {getNumber(currentTotal)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 font-medium">Delivery Charges</span>
                      <span className="text-green-600 font-bold uppercase text-[10px] tracking-widest">
                        {deliveryCharges === 0
                          ? "Free"
                          : `${currency}${getNumber(deliveryCharges)}`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-3 mt-3 border-t-2 border-dashed border-gray-100">
                      <span className="text-base font-black text-[#0b1d3d] uppercase tracking-widest">
                        Grand Total
                      </span>
                      <div className="flex flex-col items-end">
                        <span className="text-2xl font-black text-[#0b1d3d]">
                          {currency}
                          {getNumber(grandTotal)}
                        </span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest -mt-1">
                          (Inclusive of GST)
                        </span>
                      </div>
                    </div>

                    {orderItems.some(item => (item.price - (item.basePrice || item.price)) > 0) && (
                      <div className="flex justify-end pt-1">
                        <p className="text-[11px] text-green-600 font-bold uppercase tracking-tighter flex items-center gap-1 bg-green-50 px-2 py-1 rounded">
                          Includes {currency}{getNumber(orderItems.reduce((acc, item) => acc + ((item.price - (item.basePrice || item.price)) * item.quantity), 0))} GST
                        </p>
                      </div>
                    )}

                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Checkout;
