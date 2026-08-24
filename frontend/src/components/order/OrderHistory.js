import React from "react";
import dayjs from "dayjs";

const OrderHistory = ({ order, currency }) => {
  const displayStatus =
    order?.status === "Delivered" || order?.deliveryStatus === "Delivered"
      ? "Delivered"
      : order?.status;

  return (
    <>
      <td className="px-5 py-3 leading-6 whitespace-nowrap">
        <span className="uppercase text-sm font-medium">
          {order?.orderId || order?.invoice || order?._id?.substring(20, 24)}
        </span>
      </td>
      <td className="px-5 py-3 leading-6 text-center whitespace-nowrap">
        <span className="text-sm">
          {dayjs(order.createdAt).format("MMMM D, YYYY")}
        </span>
      </td>

      <td className="px-5 py-3 leading-6 text-center whitespace-nowrap">
        <span className="text-sm">{order.paymentMethod}</span>
      </td>
      <td className="px-5 py-3 leading-6 text-center whitespace-nowrap font-medium text-sm">
        {displayStatus === "Delivered" && (
          <span className="text-green-500">{displayStatus}</span>
        )}
        {displayStatus === "Pending" && (
          <span className="text-orange-500">{displayStatus}</span>
        )}
        {displayStatus === "Cancel" && (
          <span className="text-red-500">{displayStatus}</span>
        )}
        {displayStatus === "Processing" && (
          <span className="text-indigo-500">{displayStatus}</span>
        )}
      </td>
      <td className="px-5 py-3 leading-6 text-center whitespace-nowrap">
        <div className="flex flex-col items-center">
          <span className="text-sm font-bold">
            {currency}
            {parseFloat(order?.total).toFixed(2)}
          </span>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight -mt-1">
            (Incl. GST)
          </span>
        </div>
      </td>

    </>
  );
};

export default OrderHistory;
