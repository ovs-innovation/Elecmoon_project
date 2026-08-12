import {
  Button,
  Card,
  CardBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@windmill/react-ui";
import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";
import { IoCloudDownloadOutline, IoPrintOutline } from "react-icons/io5";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { PDFDownloadLink } from "@react-pdf/renderer";
import ReactToPrint from "react-to-print";

// internal import
import useAsync from "@/hooks/useAsync";
import OrderServices from "@/services/OrderServices";
import Loading from "@/components/preloader/Loading";
import PageTitle from "@/components/Typography/PageTitle";
import InvoiceForDownload from "@/components/invoice/InvoiceForDownload";
import InvoiceForPrint from "@/components/invoice/InvoiceForPrint";
import SettingServices from "@/services/SettingServices";
import elecmoonLogo from "@/assets/img/logo/elecmoon-logo.jpg";

import Barcode from 'react-barcode';

// ── Screen barcode using react-barcode ─────────────────────────────────────
const ScreenBarcode = ({ value = "", width = 120, height = 30 }) => {
  if (!value) return null;
  return (
    <div style={{ display: "flex", height, width, overflow: "hidden" }}>
      <Barcode 
        value={value} 
        width={1.5} 
        height={height} 
        displayValue={false} 
        margin={0} 
        background="transparent" 
      />
    </div>
  );
};

const OrderInvoice = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const printRef = useRef();

  const { data, loading, error } = useAsync(() => OrderServices.getOrderById(id));
  const { data: globalSetting } = useAsync(SettingServices.getGlobalSetting);

  const currency = globalSetting?.default_currency || "₹";

  const getNumberTwo = (num) => {
    return parseFloat(num || 0).toFixed(2);
  };

  const showDateFormat = (date) => {
    return dayjs(date).format("DD/MM/YYYY");
  };

  const totalQty = (data?.cart || []).reduce((s, i) => s + (i.quantity || 0), 0);
  const preTaxSubTotal = (data?.cart || []).reduce((acc, item) => acc + ((item.basePrice || item.price) * (item.quantity || 1)), 0);

  const shipping = data?.shippingCost || 0;
  const total = data?.total || 0;
  const discount = data?.discount || 0;

  const taxAmt = total - preTaxSubTotal - shipping + discount;
  const averageTaxRate = preTaxSubTotal > 0 ? Math.round((taxAmt / preTaxSubTotal) * 100) : 18;

  return (
    <>
      <PageTitle>{t("InvoicePageTittle")}</PageTitle>

      {/* ══ SCREEN INVOICE (Purchase Order - Exact Design Match) ══════════ */}
      <div
        ref={printRef}
        className="bg-white mb-8 rounded-xl shadow-md overflow-hidden"
        style={{ 
          fontFamily: "'Inter', sans-serif", 
          color: "#000", 
          padding: "50px 60px",
          width: "100%",
          margin: "0 auto",
          fontSize: "14px",
          backgroundColor: "#fff",
          boxSizing: "border-box"
        }}
      >
        {loading ? (
          <Loading loading={loading} />
        ) : error ? (
          <span className="text-center mx-auto text-red-500">{error}</span>
        ) : (
          <div>
            {/* Header Section */}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "40px", width: "100%" }}>
              <div style={{ width: "55%" }}>
                <img src={elecmoonLogo} alt="Logo" style={{ width: "220px", objectFit: "contain", marginBottom: "15px" }} />
                <div style={{ fontWeight: "700", fontSize: "16px", marginBottom: "5px" }}>
                  {globalSetting?.company_name || "ECOMPASS LLP"}
                </div>
                <div style={{ fontSize: "12px", color: "#333", lineHeight: "1.5", maxWidth: "450px" }}>
                  {globalSetting?.address || "#47, New Anaj Mandi Sector 16, Faridabad - 121002, Haryana, India"}
                  <br />
                  {globalSetting?.email || "ecompassllp@gmail.com"} |
                  <br />
                  GSTIN: {globalSetting?.vat_number || "06AAIFE7762K1Z0"}
                </div>
              </div>
              <div style={{ width: "45%", textAlign: "right" }}>
                <div style={{ fontSize: "30px", fontWeight: "400", marginBottom: "8px", lineHeight: "1", whiteSpace: "nowrap" }}>Purchase Order</div>
                <div style={{ fontSize: "16px", fontWeight: "600", marginBottom: "12px" }}># {data?.orderId || data?.invoice}</div>
                <div className="flex justify-end">
                  <ScreenBarcode value={data?.orderId || data?.invoice?.toString()} width={150} height={45} />
                </div>
              </div>
            </div>

            {/* Vendor & Dates Section */}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "45px", width: "100%" }}>
              <div style={{ width: "55%" }}>
                <div style={{ fontSize: "14px", color: "#666", marginBottom: "6px" }}>Vendor's Details </div>
                <div style={{ fontWeight: "700", fontSize: "17px", textTransform: "uppercase", marginBottom: "8px" }}>{data?.user_info?.name}</div>
                <div style={{ fontSize: "14px", color: "#333", lineHeight: "1.6", maxWidth: "450px" }}>
                  {[
                    data?.user_info?.address,
                    data?.user_info?.city,
                    data?.user_info?.country,
                    data?.user_info?.zipCode,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                  <br />
                  |
                  <br />
                  GSTIN {data?.user_info?.vat_number || "07EDPPK2298G2Z1"}
                </div>
              </div>
              <div style={{ width: "45%", textAlign: "right", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <span style={{ fontSize: "15px", color: "#555", width: "180px", textAlign: "right", paddingRight: "30px" }}>Date :</span>
                  <span style={{ fontSize: "15px", fontWeight: "600", width: "120px", textAlign: "right" }}>{showDateFormat(data?.createdAt)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <span style={{ fontSize: "15px", color: "#555", width: "180px", textAlign: "right", paddingRight: "30px" }}>Delivery Date :</span>
                  <span style={{ fontSize: "15px", fontWeight: "600", width: "120px", textAlign: "right" }}>{showDateFormat(data?.updatedAt)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <span style={{ fontSize: "15px", color: "#555", width: "180px", textAlign: "right", paddingRight: "30px" }}>Purchase Person :</span>
                  <span style={{ fontSize: "15px", fontWeight: "600", width: "120px", textAlign: "right" }}>{data?.user_info?.name?.split(" ")[0]}</span>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div style={{ width: "100%", marginBottom: "45px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#333", color: "#fff" }}>
                    <th style={{ padding: "14px", fontSize: "15px", textAlign: "left", width: "50px" }}>#</th>
                    <th style={{ padding: "14px", fontSize: "15px", textAlign: "left" }}>Item & Description</th>
                    <th style={{ padding: "14px", fontSize: "15px", textAlign: "right", width: "100px" }}>Qty</th>
                    <th style={{ padding: "14px", fontSize: "15px", textAlign: "right", width: "110px" }}>Rate</th>
                    <th style={{ padding: "14px", fontSize: "15px", textAlign: "center", width: "100px" }}>IGST</th>
                    <th style={{ padding: "14px", fontSize: "15px", textAlign: "right", width: "130px" }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.cart || []).map((item, i) => {
                    return (
                      <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                        <td style={{ padding: "20px 12px", fontSize: "15px", verticalAlign: "top" }}>{i + 1}</td>
                        <td style={{ padding: "20px 12px", verticalAlign: "top" }}>
                          <div style={{ display: "flex", gap: "25px" }}>
                            {item.image && <img src={item.image} alt="" style={{ width: "80px", height: "65px", objectFit: "contain", border: "1px solid #f0f0f0" }} />}
                            <div>
                              <div style={{ fontWeight: "700", fontSize: "15px", marginBottom: "8px" }}>{item.title}</div>
                              <ScreenBarcode value={item.sku || item.barcode || item.slug || item.id} width={110} height={35} />
                              <div style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>SKU: {item.sku || item.barcode || (item.slug || item.id)?.substring(0, 10)}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "20px 12px", textAlign: "right", verticalAlign: "top" }}>
                          <div style={{ fontSize: "15px", fontWeight: "700" }}>{item.quantity.toFixed(2)}</div>
                          <div style={{ fontSize: "12px", color: "#666" }}>pcs</div>
                        </td>
                        <td style={{ padding: "20px 12px", textAlign: "right", fontSize: "15px", verticalAlign: "top" }}>{getNumberTwo(item.basePrice || item.price)}</td>
                        <td style={{ padding: "20px 12px", textAlign: "center", fontSize: "15px", verticalAlign: "top" }}>{item.gstPercentage || 0}%</td>
                        <td style={{ padding: "20px 12px", textAlign: "right", fontWeight: "700", fontSize: "15px", verticalAlign: "top" }}>
                          {getNumberTwo((item.basePrice || item.price) * item.quantity)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Totals Section */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderTop: "2.5px solid #333", paddingTop: "25px" }}>
              <div style={{ fontWeight: "600", fontSize: "16px" }}>Total No. of Items: {totalQty.toFixed(2)}</div>
              <div style={{ width: "350px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                  <span style={{ fontSize: "15px", color: "#444" }}>Sub Total</span>
                  <span style={{ fontSize: "15px", fontWeight: "600" }}>{getNumberTwo(preTaxSubTotal)}</span>
                </div>
                {shipping > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                    <span style={{ fontSize: "15px", color: "#444" }}>Delivery Charges</span>
                    <span style={{ fontSize: "15px", fontWeight: "600" }}>{getNumberTwo(shipping)}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                  <span style={{ fontSize: "15px", color: "#444" }}>{`IGST (${averageTaxRate}%)`}</span>
                  <span style={{ fontSize: "15px", fontWeight: "600" }}>{getNumberTwo(taxAmt)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "15px", paddingTop: "15px", borderTop: "1px solid #ccc" }}>
                  <span style={{ fontSize: "18px", fontWeight: "700" }}>Total</span>
                  <span style={{ fontSize: "18px", fontWeight: "700" }}>{currency}{getNumberTwo(total)}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ marginTop: "100px" }}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: "10px" }}>
                <span style={{ fontSize: "16px", fontWeight: "600" }}>Checked By</span>
                <div style={{ flex: "1", maxWidth: "450px", borderBottom: "2px solid #000", height: "22px" }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── ACTION BUTTONS ────────────────────────────────────────────────── */}
      {!loading && !error && (
        <div className="flex flex-col lg:flex-row justify-between gap-4 mt-6">
          <PDFDownloadLink
            document={
              <InvoiceForDownload
                data={data}
                currency={currency}
                globalSetting={globalSetting}
                showDateFormat={showDateFormat}
                getNumberTwo={getNumberTwo}
              />
            }
            fileName={`Invoice-${data?.orderId || data?.invoice}.pdf`}
            className="flex-1"
          >
            {({ loading }) => (
              <Button disabled={loading} block className="bg-emerald-500 hover:bg-emerald-600">
                <IoCloudDownloadOutline className="mr-2 h-5 w-5" />
                {loading ? t("LoadingInvoice") : t("DownloadInvoice")}
              </Button>
            )}
          </PDFDownloadLink>

          <ReactToPrint
            trigger={() => (
              <Button block className="flex-1 bg-gray-500 hover:bg-gray-600">
                <IoPrintOutline className="mr-2 h-5 w-5" />
                {t("PrintInvoice")}
              </Button>
            )}
            content={() => printRef.current}
          />
        </div>
      )}

      {/* HIDDEN PRINT VIEW (Rendered off-screen to ensure full-width calculation) */}
      <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
        <InvoiceForPrint 
          data={data} 
          globalSetting={globalSetting} 
          printRef={printRef} 
        />
      </div>
    </>
  );
};

export default OrderInvoice;
