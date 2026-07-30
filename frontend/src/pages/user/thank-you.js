import React from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { FiCheckCircle, FiArrowRight } from "react-icons/fi";

// internal imports
import Layout from "@layout/Layout";
import Loading from "@components/preloader/Loading";
import OrderServices from "@services/OrderServices";
import useUtilsFunction from "@hooks/useUtilsFunction";

import { useCart } from "react-use-cart";
import { useEffect } from "react";

const StatusLabel = ({ status }) => {
  if (status === "Delivered") {
    return <span className="text-green-600 font-bold">{status}</span>;
  }
  if (status === "Pending") {
    return <span className="text-orange-500 font-bold">{status}</span>;
  }
  if (status === "Cancel") {
    return <span className="text-red-500 font-bold">{status}</span>;
  }
  if (status === "Processing") {
    return <span className="text-indigo-500 font-bold">{status}</span>;
  }
  return <span className="text-gray-600 font-bold">{status || "Pending"}</span>;
};

const ThankYouPage = () => {
  const router = useRouter();
  const { orderId } = router.query;
  const { currency, getNumber } = useUtilsFunction();
  const { emptyCart } = useCart();

  useEffect(() => {
    emptyCart();
  }, []);

  const { data, error, isLoading } = useQuery({
    queryKey: ["order-by-id", orderId],
    enabled: !!orderId,
    queryFn: () => OrderServices.getOrderById(orderId),
  });

  return (
    <Layout title="Thank you" description="Order confirmation page">
      <div className="bg-gray-50 min-h-[60vh] py-12">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-10">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            {isLoading ? (
              <Loading loading={isLoading} />
            ) : error ? (
              <div className="text-red-500 font-bold">
                {error?.message || "Failed to load order details."}
              </div>
            ) : (
              <>
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
                    <FiCheckCircle className="w-8 h-8 text-green-600" />
                  </div>

                  <div>
                    <h1 className="text-2xl font-black text-gray-900">
                      Thank you for your order
                    </h1>
                    <p className="text-gray-600 mt-1">
                      Order ID:{" "}
                      <span className="font-bold text-gray-900">
                        {data?.orderId || data?.invoice || data?._id?.substring(20, 24) || orderId}
                      </span>
                    </p>
                    {data?.user_info?.email && (
                      <p className="text-sm text-gray-500 mt-2">
                        Invoice has been sent to{" "}
                        <span className="font-semibold text-gray-700">
                          {data.user_info.email}
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-xl border border-gray-100 p-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Payment Method
                    </p>
                    <p className="text-sm font-bold text-gray-900 mt-2">
                      {data?.paymentMethod}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl border border-gray-100 p-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Status
                    </p>
                    <p className="text-sm font-bold text-gray-900 mt-2">
                      <StatusLabel status={data?.status} />
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl border border-gray-100 p-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Total
                    </p>
                    <p className="text-sm font-bold text-gray-900 mt-2">
                      {currency}
                      {getNumber(data?.total || 0)}
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <Link
                    href={`/order/${data?._id}`}
                    className="inline-flex items-center justify-center bg-[#0b1d3d] text-white rounded-xl font-bold px-6 py-3 hover:bg-[#162542] transition-all"
                  >
                    View Invoice
                    <FiArrowRight className="ml-2" />
                  </Link>
                  <Link
                    href="/user/my-orders"
                    className="inline-flex items-center justify-center bg-white border border-gray-200 text-gray-900 rounded-xl font-bold px-6 py-3 hover:bg-gray-50 transition-all"
                  >
                    Track Orders
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ThankYouPage;

