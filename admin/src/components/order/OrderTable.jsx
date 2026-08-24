import { TableBody, TableCell, TableRow } from "@windmill/react-ui";

import { useTranslation } from "react-i18next";
import { FiTrash2, FiZoomIn } from "react-icons/fi";
import { Link } from "react-router-dom";
import { useState } from "react";

//internal import

import Status from "@/components/table/Status";
import Tooltip from "@/components/tooltip/Tooltip";
import useUtilsFunction from "@/hooks/useUtilsFunction";
import PrintReceipt from "@/components/form/others/PrintReceipt";
import SelectStatus from "@/components/form/selectOption/SelectStatus";
import DeleteModal from "@/components/modal/DeleteModal";
import useToggleDrawer from "@/hooks/useToggleDrawer";
import OrderServices from "@/services/OrderServices";
import { notifySuccess, notifyError } from "@/utils/toast";

const OrderTable = ({ orders }) => {
  const { t } = useTranslation();
  const { showDateTimeFormat, currency, getNumberTwo } = useUtilsFunction();
  const { title, serviceId, handleModalOpen } = useToggleDrawer();
  const [loadingIds, setLoadingIds] = useState([]);

  const handleShiprocket = async (id) => {
    try {
      setLoadingIds((prev) => [...prev, id]);
      const res = await OrderServices.createShiprocketOrder(id);
      notifySuccess(res.message);
    } catch (err) {
      notifyError(err?.response?.data?.message || err.message);
    } finally {
      setLoadingIds((prev) => prev.filter((loadingId) => loadingId !== id));
    }
  };

  // console.log('orders',orders)

  return (
    <>
      <DeleteModal id={serviceId} title={title} />
      <TableBody className="dark:bg-gray-900">
        {orders?.map((order, i) => (
          <TableRow key={i + 1}>
            <TableCell>
              <span className="font-semibold uppercase text-xs">
                {order?.orderId || "N/A"}
              </span>
            </TableCell>

            <TableCell>
              <span className="font-semibold uppercase text-xs">
                {order?.invoice || "N/A"}
              </span>
            </TableCell>

            <TableCell>
              <span className="text-sm">
                {showDateTimeFormat(order?.updatedDate)}
              </span>
            </TableCell>

            <TableCell className="text-xs">
              <span className="text-sm">{order?.user_info?.name || "N/A"}</span>
            </TableCell>

            <TableCell>
              <span className="text-sm">{order?.user_info?.contact || "N/A"}</span>
            </TableCell>

            <TableCell>
              <div className="flex flex-col gap-2">
                {order?.cart?.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    {item.image && (
                      <img 
                        src={item.image} 
                        alt="product" 
                        className="w-8 h-8 rounded-md object-contain border border-gray-200" 
                      />
                    )}
                    <span className="text-xs font-semibold whitespace-nowrap">
                      Qty: {item.quantity}
                    </span>
                  </div>
                ))}
                {(!order?.cart || order?.cart?.length === 0) && (
                  <span className="text-sm text-center font-semibold text-gray-500">0</span>
                )}
              </div>
            </TableCell>

            <TableCell>
              <span className="text-sm font-semibold">
                {currency}
                {getNumberTwo(order?.total)}
              </span>
            </TableCell>


            <TableCell className="text-xs">
              <Status status={order?.status} />
            </TableCell>
            <TableCell className="text-xs">
              <Status status={order?.deliveryStatus} />
            </TableCell>

            <TableCell className="text-center">
              <div className="flex justify-center items-center">
                <PrintReceipt orderId={order._id} />

                <span className="p-2 cursor-pointer text-gray-400 hover:text-green-600">
                  <Link to={`/order/${order._id}`}>
                    <Tooltip
                      id="view"
                      Icon={FiZoomIn}
                      title={t("ViewInvoice")}
                      bgColor="#059669"
                    />
                  </Link>
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleModalOpen(
                      order._id,
                      order?.orderId || order?.invoice || "this order"
                    )
                  }
                  className="p-2 cursor-pointer text-gray-400 hover:text-red-600 focus:outline-none"
                >
                  <Tooltip
                    id="delete"
                    Icon={FiTrash2}
                    title={t("Delete")}
                    bgColor="#EF4444"
                  />
                </button>
              </div>
            </TableCell>

            <TableCell className="text-right">
              <SelectStatus id={order._id} order={order} />
              {(!order.shiprocketOrderId ||
                order.shiprocketFulfillmentStatus === "FAILED" ||
                (order.shiprocketOrderId && !order.awbCode)) && (
                <button
                  onClick={() => handleShiprocket(order._id)}
                  disabled={loadingIds.includes(order._id)}
                  className="mt-2 text-xs w-full bg-indigo-500 hover:bg-indigo-600 text-white px-2 py-1 rounded transition-colors disabled:opacity-50"
                  title="Create / resume Shiprocket shipment (order → AWB → pickup)"
                >
                  {loadingIds.includes(order._id)
                    ? "Processing..."
                    : order.shiprocketOrderId
                      ? "Retry Shiprocket"
                      : "Ship via Shiprocket"}
                </button>
              )}
              {order.shiprocketOrderId && (
                <div className="mt-2 text-xs text-center text-indigo-500 font-semibold bg-indigo-50 p-1 rounded border border-indigo-100">
                  SR: {order.shiprocketOrderId}
                  {order.awbCode && (
                    <>
                      <br />
                      AWB: {order.awbCode}
                    </>
                  )}
                  {order.courierName && (
                    <>
                      <br />
                      {order.courierName}
                    </>
                  )}
                  {order.trackingUrl && (
                    <>
                      <br />
                      <a
                        href={order.trackingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="underline"
                      >
                        Track
                      </a>
                    </>
                  )}
                </div>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </>
  );
};

export default OrderTable;
