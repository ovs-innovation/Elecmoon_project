import React from "react";
import Image from "next/image";
import Layout from "@layout/Layout";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import LeadServices from "@services/LeadServices";
import { FiClock, FiMapPin, FiPhoneCall, FiMail } from "react-icons/fi";

const services = [
  "Lithium-Ion Battery Materials & Cells",
  "BMS & Protection Solutions",
  "Battery Pack Assembly & Testing",
  "Spot Welding & Machine Equipment",
  "Electronic Components & Switches",
  "Wholesale & Bulk Supply Enquiry",
  "Custom Technical Solutions",
];

const ContactUs = () => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      const leadData = {
        ...data,
        address: data.location,
        product: {
          title: "Quote Request",
          type: "quote_request",
        },
      };
      await LeadServices.addLead(leadData);
      toast.success("Thank you! We will contact you shortly.");
      reset();
    } catch (error) {
      console.log("error", error);
      toast.error(error?.response?.data?.message || "Failed to submit request.");
    }
  };

  return (
    <Layout title="Contact Us" description="Get in touch with Elecmoon for electronic components and battery solutions">
      {/* Hero Section */}
      <div className="relative bg-[#0b1d3d] text-white py-16 lg:py-24 overflow-hidden border-b border-white/5">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-1/3 h-full bg-red-500/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

        <div className="relative max-w-screen-2xl mx-auto px-4 sm:px-10 text-center">
          <div className="inline-flex items-center gap-2 text-[11px] font-bold text-white/70 uppercase tracking-widest mb-4 bg-white/10 px-4 py-1.5 rounded-full border border-white/15 backdrop-blur-sm">
            <span>Home</span>
            <span>/</span>
            <span className="text-[#ED1C24]">Contact Us</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black !text-white mb-4 tracking-tight">
            Contact <span className="text-[#ED1C24]">Us</span>
          </h1>
          <div className="w-20 h-1 bg-[#ED1C24] mx-auto mb-4 rounded-full" />
          <p className="text-white/80 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Have questions about electronic components, lithium-ion battery solutions, or custom orders? Reach out to our team today.
          </p>
        </div>
      </div>

      <div className="bg-[#f7f7f7] py-12 px-4 sm:px-10">
        <div className="max-w-screen-2xl mx-auto grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white rounded-xl shadow-md border border-gray-300 p-8 text-center space-y-3 hover:shadow-lg hover:border-green-500/30 transition-all duration-300 group">
            <div className="flex justify-center mb-3">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-600 text-3xl group-hover:bg-green-100 group-hover:scale-110 transition-transform duration-300">
                <FiClock />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900">Our Hours</h3>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">Mon - Fri: 9am - 7pm</p>
              <p className="text-sm text-gray-600">Sat - Sun: 10am - 2pm</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-gray-300 p-8 text-center space-y-3 hover:shadow-lg hover:border-green-500/30 transition-all duration-300 group">
            <div className="flex justify-center mb-3">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-600 text-3xl group-hover:bg-green-100 group-hover:scale-110 transition-transform duration-300">
                <FiMapPin />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900">Location</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              B-1/D GROUND FLOOR SAURAV VIHAR
              <br />
              JAITPUR NEAR CHOKAN MANDIR, BADARPUR
              <br />
              DELHI 110044, NEW DELHI, DELHI, 110044, IN
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-gray-300 p-8 text-center space-y-3 hover:shadow-lg hover:border-green-500/30 transition-all duration-300 group">
            <div className="flex justify-center mb-3">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-600 text-3xl group-hover:bg-green-100 group-hover:scale-110 transition-transform duration-300">
                <FiPhoneCall />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900">Contact Us</h3>
            <p className="text-sm text-gray-600">Phone: <a href="tel:+919717372217" className="hover:text-[#ED1C24] transition">+91 9717372217</a></p>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-gray-300 p-8 text-center space-y-3 hover:shadow-lg hover:border-green-500/30 transition-all duration-300 group">
            <div className="flex justify-center mb-3">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-600 text-3xl group-hover:bg-green-100 group-hover:scale-110 transition-transform duration-300">
                <FiMail />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900">Email</h3>
            <p className="text-sm text-gray-600">elecmoonofficial@gmail.com</p>
          </div>
        </div>
      </div>

      <div className="bg-white">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-10 py-12 lg:py-16 grid lg:grid-cols-2 gap-8">
          <div className="w-full h-[520px] rounded-lg overflow-hidden shadow border">
            <iframe
              title="Elecmoon Location"
              src="https://www.google.com/maps?q=B-1%2FD%20GROUND%20FLOOR%20SAURAV%20VIHAR%2C%20JAITPUR%20NEAR%20CHOKAN%20MANDIR%2C%20BADARPUR%2C%20DELHI%20110044&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
            ></iframe>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-300 p-6 lg:p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <input
                    type="text"
                    placeholder="Name"
                    className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm focus:ring-2 focus:ring-[#ED1C24] focus:outline-none"
                    {...register("name", { required: "Name is required" })}
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <input
                    type="email"
                    placeholder="Email"
                    className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm focus:ring-2 focus:ring-[#ED1C24] focus:outline-none"
                    {...register("email", { required: "Email is required" })}
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <input
                    type="tel"
                    placeholder="Contact Number"
                    className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm focus:ring-2 focus:ring-[#ED1C24] focus:outline-none"
                    {...register("phone", { required: "Contact number is required" })}
                  />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                </div>
                <div>
                  <select
                    className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm focus:ring-2 focus:ring-[#ED1C24] focus:outline-none bg-white"
                    defaultValue=""
                    {...register("service", { required: "Select a service" })}
                  >
                    <option value="" disabled>
                      Select Service
                    </option>
                    {services.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  {errors.service && <p className="text-red-500 text-xs mt-1">{errors.service.message}</p>}
                </div>
              </div>

              <input
                type="text"
                placeholder="Your Location"
                className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm focus:ring-2 focus:ring-[#ED1C24] focus:outline-none"
                {...register("location", { required: "Location is required" })}
              />
              {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location.message}</p>}

              <select
                className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm focus:ring-2 focus:ring-[#ED1C24] focus:outline-none bg-white"
                defaultValue=""
                {...register("serviceDate", { required: "When do you want service?" })}
              >
                <option value="" disabled>
                  When do you want service to be done
                </option>
                <option value="As soon as possible">As soon as possible</option>
                <option value="Within 1-2 weeks">Within 1-2 weeks</option>
                <option value="Within a month">Within a month</option>
                <option value="Flexible / Not sure">Flexible / Not sure</option>
              </select>
              {errors.serviceDate && <p className="text-red-500 text-xs mt-1">{errors.serviceDate.message}</p>}

              <textarea
                placeholder="Your Message (Optional)"
                rows={4}
                className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm focus:ring-2 focus:ring-[#ED1C24] focus:outline-none"
                {...register("message")}
              />

              <button
                type="submit"
                className="inline-flex items-center justify-center px-6 py-3 rounded-md bg-gradient-to-r from-[#051124] to-[#0b1d3d] hover:from-[#0b1d3d] hover:to-[#162542] text-white font-semibold transition shadow-[0_0_15px_rgba(255,255,255,0.3)] w-full"
              >
                Submit
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ContactUs;

