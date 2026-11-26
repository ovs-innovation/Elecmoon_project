import React, { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import Layout from "@layout/Layout";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import LeadServices from "@services/LeadServices";
import ProductServices from "@services/ProductServices";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { Controller } from "react-hook-form";
import { FiShoppingBag, FiPhoneCall, FiCheckCircle } from "react-icons/fi";
import useUtilsFunction from "@hooks/useUtilsFunction";
import { useContext } from "react";
import { UserContext } from "@context/UserContext";

import { useCart } from "react-use-cart";

const services = [
  "Electrical Testing & Tagging",
  "Fire Extinguishers",
  "RCD/Safety Switches",
  "Three Phase Testing",
  "Microwave Testing",
  "Emergency Exit Light Testing",
  "Smoke Alarm Service",
];

const RequestAQuote = () => {
  const router = useRouter();
  const { state: { userInfo } } = useContext(UserContext);
  const { selected, productSlug } = router.query;
  const { items, emptyCart, cartTotal } = useCart();
  const { showingTranslateValue, currency, getNumber } = useUtilsFunction();
  const [singleProduct, setSingleProduct] = useState(null);

  useEffect(() => {
    if (productSlug) {
      ProductServices.getProductBySlug(productSlug)
        .then((res) => setSingleProduct(res))
        .catch((err) => console.log(err));
    }
  }, [productSlug]);

  const filteredItems = useMemo(() => {
    if (productSlug) {
      if (!singleProduct) return [];
      const price = singleProduct.price || singleProduct.prices?.price || 0;
      return [{
        id: singleProduct._id,
        name: showingTranslateValue(singleProduct.title) || singleProduct.title,
        quantity: 1,
        price: price,
        itemTotal: price,
        category: singleProduct.category?.name,
        image: Array.isArray(singleProduct.image) ? singleProduct.image[0] : (typeof singleProduct.image === 'string' ? singleProduct.image : null),
      }];
    }
    if (!selected) return items;
    const selectedIds = selected.split(',');
    return items.filter(item => selectedIds.includes(item.id.toString()));
  }, [items, selected, productSlug, singleProduct, showingTranslateValue]);

  const filteredTotal = useMemo(() => {
    return filteredItems.reduce((acc, item) => acc + item.itemTotal, 0);
  }, [filteredItems]);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      const leadData = {
        ...data,
        user: userInfo?._id || userInfo?.id || null,
        serviceDate: data.schedule, // Map schedule to serviceDate
        product: {
          title: "Multi-Product Quote Request",
          type: "quote_request",
          items: filteredItems.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            category: item.category,
            image: item.image
          }))
        },
      };
      await LeadServices.addLead(leadData);
      toast.success("Thank you! Your quote request has been submitted.");
      if (!productSlug) {
        emptyCart();
      }
      reset();
    } catch (error) {
      console.log("error", error);
      toast.error(error?.response?.data?.message || "Failed to submit quote request.");
    }
  };

  return (
    <Layout title="Request A Quote" description="Request a quote for bulk electronic components, battery packs, and industrial solutions from Elecmoon">
      {/* Hero */}
      <div className="relative bg-[#0b1d3d] text-white py-16 lg:py-24 overflow-hidden border-b border-white/5">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-1/3 h-full bg-red-500/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

        <div className="relative max-w-screen-2xl mx-auto px-4 sm:px-10 text-center">
          <div className="inline-flex items-center gap-2 text-[11px] font-bold text-white/70 uppercase tracking-widest mb-4 bg-white/10 px-4 py-1.5 rounded-full border border-white/15 backdrop-blur-sm">
            <span>Home</span>
            <span>/</span>
            <span className="text-[#ED1C24]">Quote</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black !text-white mb-4 tracking-tight uppercase">
            Request A <span className="text-[#ED1C24]">Quote</span>
          </h1>
          <div className="w-20 h-1 bg-[#ED1C24] mx-auto mb-4 rounded-full" />
          <p className="text-white/80 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Need custom battery configurations, bulk electronic component orders, or B2B pricing? Fill out the details below.
          </p>
        </div>
      </div>

      {/* Form + Info */}
      <div className="bg-white">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-10 py-12 lg:py-16 grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            <h2 className="text-2xl lg:text-2xl font-bold text-gray-900 mb-6">
              Request a Custom Quote - Elecmoon Industrial Solutions
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <input
                    {...register("name", { required: "Name is required" })}
                    type="text"
                    placeholder="Name"
                    className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <input
                    {...register("email", { required: "Email is required" })}
                    type="email"
                    placeholder="Email"
                    className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="quote_phone">
                  <Controller
                    name="phone"
                    control={control}
                    rules={{
                      required: "Phone number is required",
                      validate: (value) => (value && value.length > 8) || "Invalid phone number",
                    }}
                    render={({ field: field }) => (
                      <PhoneInput
                        {...field}
                        country={"in"}
                        inputProps={{
                          name: "phone",
                          required: true,
                        }}
                        containerClass="!w-full !rounded-md !border-gray-300"
                        inputClass="!w-full !h-[46px] !border-gray-300 !rounded-md !text-sm focus:!ring-2 focus:!ring-red-500 focus:!outline-none"
                        buttonClass="!border-gray-300 !rounded-l-md"
                      />
                    )}
                  />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                </div>
                <div>
                  <select
                    {...register("service", { required: "Please select a service" })}
                    className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none bg-white"
                    defaultValue=""
                  >
                    <option value="" disabled>Select Service</option>
                    {services.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  {errors.service && <p className="text-red-500 text-xs mt-1">{errors.service.message}</p>}
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <input
                    {...register("state", { required: "State is required" })}
                    type="text"
                    placeholder="State"
                    className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                  {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state.message}</p>}
                </div>
                <div>
                  <input
                    {...register("district", { required: "District is required" })}
                    type="text"
                    placeholder="District"
                    className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                  {errors.district && <p className="text-red-500 text-xs mt-1">{errors.district.message}</p>}
                </div>
                <div>
                  <input
                    {...register("pincode", { required: "Pincode is required" })}
                    type="text"
                    placeholder="Pincode"
                    className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                  {errors.pincode && <p className="text-red-500 text-xs mt-1">{errors.pincode.message}</p>}
                </div>
              </div>

              <div>
                <input
                  {...register("location", { required: "Location is required" })}
                  type="text"
                  placeholder="Your Location"
                  className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
                {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location.message}</p>}
              </div>

              <div>
                <select
                  {...register("schedule", { required: "Please select when you want service" })}
                  className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none bg-white"
                  defaultValue=""
                >
                  <option value="" disabled>When do you want service to be done</option>
                  <option value="As soon as possible">As soon as possible</option>
                  <option value="Within 1-2 weeks">Within 1-2 weeks</option>
                  <option value="Within a month">Within a month</option>
                  <option value="Flexible / Not sure">Flexible / Not sure</option>
                </select>
                {errors.schedule && <p className="text-red-500 text-xs mt-1">{errors.schedule.message}</p>}
              </div>

              <div>
                <textarea
                  {...register("message")}
                  placeholder="Your Message (Optional)"
                  rows={4}
                  className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-start">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-md bg-red-600 text-white font-semibold hover:bg-red-700 transition shadow-lg"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-6">
            {singleProduct ? (
              <div className="bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-[#0b1d3d] p-5 text-white flex items-center gap-3">
                  <FiShoppingBag className="w-6 h-6 text-[#ff5c23]" />
                  <h3 className="font-bold text-lg">Product Details</h3>
                </div>
                <div className="p-6">
                  {(() => {
                    const imgUrl = Array.isArray(singleProduct.image) 
                                     ? singleProduct.image[0] 
                                     : (typeof singleProduct.image === 'string' ? singleProduct.image : null);
                    
                    if (imgUrl) {
                      return (
                        <div className="relative w-full aspect-square min-h-[250px] mb-6 rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                          <Image 
                            src={imgUrl} 
                            alt={showingTranslateValue(singleProduct.title) || singleProduct.title} 
                            fill 
                            className="object-contain p-4 group-hover:scale-105 transition-transform duration-500" 
                          />
                        </div>
                      );
                    }
                    return (
                      <div className="w-full aspect-square min-h-[250px] mb-6 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                        No Image Available
                      </div>
                    );
                  })()}
                  <h4 className="text-xl font-black text-gray-900 mb-2 leading-tight">
                    {showingTranslateValue(singleProduct.title) || singleProduct.title}
                  </h4>
                  <div className="inline-block px-3 py-1 bg-orange-50 text-orange-600 rounded-lg text-xs font-bold uppercase tracking-wider mb-4 border border-orange-100">
                    {singleProduct.category?.name ? showingTranslateValue(singleProduct.category?.name) : "Product"}
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-gray-500 font-medium">Estimated Price</span>
                    <span className="text-2xl font-black text-[#0b1d3d]">
                      {currency}{getNumber(singleProduct.price || singleProduct.prices?.price || 0)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-[#0b1d3d] p-5 text-white flex items-center gap-3">
                  <FiShoppingBag className="w-6 h-6 text-[#ff5c23]" />
                  <h3 className="font-bold text-lg">Quote Summary</h3>
                </div>

                <div className="p-6">
                  {filteredItems.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 text-sm">No products selected for quote.</p>
                    </div>
                  ) : (
                    <div className="space-y-5 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {filteredItems.map((item) => (
                        <div key={item.id} className="flex gap-4 items-center group">
                          <div className="w-16 h-16 relative rounded-lg overflow-hidden border border-gray-100 flex-shrink-0 bg-gray-50">
                            {item.image ? (
                              <Image src={item.image} alt={item.name} fill className="object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-100">
                                <FiShoppingBag className="w-6 h-6" />
                              </div>
                            )}
                          </div>
                          <div className="flex-grow min-w-0">
                            <h4 className="text-sm font-bold text-gray-900 truncate">{item.name}</h4>
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-[11px] text-gray-500 font-medium">
                                Qty: {item.quantity} <span className="mx-1">×</span> <span className="font-bold text-gray-700">{currency}{getNumber(item.price)}</span>
                              </p>
                              <p className="text-sm font-bold text-green-700">{currency}{getNumber(item.itemTotal)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {filteredItems.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Items Total</span>
                        <span className="font-bold text-gray-900">{currency}{getNumber(filteredTotal)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-900 font-bold">Estimated Quote</span>
                        <span className="text-xl font-black text-[#0b1d3d]">{currency}{getNumber(filteredTotal)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Need Help Card */}
            <div className="bg-gradient-to-br from-slate-900 to-blue-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group">
              <div className="relative z-10">
                <h4 className="font-bold text-xl mb-2 flex items-center gap-2">
                  <FiPhoneCall /> Need Help?
                </h4>
                <p className="text-white text-sm mb-6 leading-relaxed">
                  Our specialists are ready to help you with your Test & Tag requirements. Call us now for immediate assistance!
                </p>
                <a
                  href="tel:+919717372217"
                  className="inline-flex items-center justify-center w-full px-6 py-4 rounded-xl bg-white text-pink-700 font-bold  transition-all shadow-lg active:scale-95 text-lg"
                >
                  +91 9717372217
                </a>
              </div>

              {/* Decorative circle */}
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-700" />
            </div>

            {/* Trust Badges */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <FiCheckCircle className="text-green-500 w-5 h-5 flex-shrink-0" />
                <span className="text-xs font-medium text-gray-700">Certified Professional Electricians</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <FiCheckCircle className="text-green-500 w-5 h-5 flex-shrink-0" />
                <span className="text-xs font-medium text-gray-700">On-time Service Guarantee</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default RequestAQuote;

