import {
  ModalBody,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHeader,
  TableRow,
} from "@windmill/react-ui";
import dayjs from "dayjs";
import React, { Fragment } from "react";
import { useTranslation } from "react-i18next";
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

const InvoiceForPrint = ({ data, printRef, globalSetting }) => {
  const { t } = useTranslation();
  const currency = globalSetting?.default_currency || "₹";

  const renderSingleInvoice = (or, index) => {
    // ── Calculations Logic ──────────────────────────────────────────
    const cart = or?.cart || [];
    const totalQty = cart.reduce((s, i) => s + (i.quantity || 0), 0);
    
    // Using basePrice to determine the real pre-tax subtotal
    const preTaxSubTotal = cart.reduce((acc, item) => acc + ((item.basePrice || item.price) * (item.quantity || 1)), 0);
    
    const shipping = or?.shippingCost || 0;
    const total = or?.total || 0;
    const discount = or?.discount || 0;

    const taxAmt = total - preTaxSubTotal - shipping + discount;
    const averageTaxRate = preTaxSubTotal > 0 ? Math.round((taxAmt / preTaxSubTotal) * 100) : 18;

    return (
      <div 
        key={index} 
        style={{ 
          fontFamily: "'Inter', sans-serif", 
          color: "#000", 
          padding: "10mm 15mm",
          width: "210mm",
          boxSizing: "border-box",
          backgroundColor: "#fff",
          pageBreakAfter: "always",
        }}
      >
        <style>
          {`
            @media print {
              @page { size: A4; margin: 0; }
              body { margin: 0; padding: 0; }
            }
          `}
        </style>

        {/* ── HEADER ── */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "30px" }}>
          <tbody>
            <tr>
              <td style={{ width: "60%", textAlign: "left", verticalAlign: "top" }}>
                <img src={globalSetting?.logo || elecmoonLogo} alt="Logo" style={{ width: "220px", objectFit: "contain", marginBottom: "15px" }} />
                <div style={{ fontWeight: "700", fontSize: "17px", marginBottom: "5px" }}>
                  {globalSetting?.company_name || "ECOMPASS LLP"}
                </div>
                <div style={{ fontSize: "12px", color: "#333", lineHeight: "1.5", maxWidth: "450px" }}>
                  {globalSetting?.address || "#47, New Anaj Mandi Sector 16, Faridabad - 121002, Haryana, India"}
                  <br />
                  {globalSetting?.email || "ecompassllp@gmail.com"} | 
                  GSTIN: {globalSetting?.vat_number || "06AAIFE7762K1Z0"}
                </div>
              </td>
              <td style={{ width: "40%", textAlign: "right", verticalAlign: "top" }}>
                <div style={{ fontSize: "35px", fontWeight: "400", marginBottom: "8px", lineHeight: "1" }}>Purchase Order</div>
                <div style={{ fontSize: "16px", fontWeight: "600", marginBottom: "12px" }}># {or?.orderId || or?.invoice}</div>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <ScreenBarcode value={or?.orderId || or?.invoice?.toString()} width={140} height={40} />
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── VENDOR & DATES ── */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "40px" }}>
          <tbody>
            <tr>
              <td style={{ width: "60%", textAlign: "left", verticalAlign: "top" }}>
                <div style={{ fontSize: "14px", color: "#666", marginBottom: "6px" }}>Vendor's Details</div>
                <div style={{ fontWeight: "700", fontSize: "18px", textTransform: "uppercase", marginBottom: "8px" }}>
                  {or?.user_info?.name}
                </div>
                <div style={{ fontSize: "13px", color: "#333", lineHeight: "1.6", maxWidth: "450px" }}>
                  {[
                    or?.user_info?.address,
                    or?.user_info?.city,
                    or?.user_info?.country,
                    or?.user_info?.zipCode,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                  <br />
                  | GSTIN {or?.user_info?.vat_number || "07EDPPK2298G2Z1"}
                </div>
              </td>
              <td style={{ width: "40%", textAlign: "right", verticalAlign: "bottom" }}>
                <div style={{ display: "inline-block", textAlign: "right", width: "100%" }}>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "10px" }}>
                    <span style={{ fontSize: "14px", color: "#555", width: "160px", textAlign: "right", paddingRight: "20px" }}>Date :</span>
                    <span style={{ fontSize: "14px", fontWeight: "600", width: "110px", textAlign: "right" }}>{dayjs(or?.createdAt).format("DD/MM/YYYY")}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "10px" }}>
                    <span style={{ fontSize: "14px", color: "#555", width: "160px", textAlign: "right", paddingRight: "20px" }}>Delivery Date :</span>
                    <span style={{ fontSize: "14px", fontWeight: "600", width: "110px", textAlign: "right" }}>{dayjs(or?.updatedAt).format("DD/MM/YYYY")}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <span style={{ fontSize: "14px", color: "#555", width: "160px", textAlign: "right", paddingRight: "20px" }}>Purchase Person :</span>
                    <span style={{ fontSize: "14px", fontWeight: "600", width: "110px", textAlign: "right" }}>{or?.user_info?.name?.split(" ")[0]}</span>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── ITEMS TABLE ── */}
        <div style={{ width: "100%", marginBottom: "45px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#333" }}>
                <th style={{ color: "#fff", padding: "14px", fontSize: "15px", textAlign: "left", width: "50px" }}>#</th>
                <th style={{ color: "#fff", padding: "14px", fontSize: "15px", textAlign: "left" }}>Item & Description</th>
                <th style={{ color: "#fff", padding: "14px", fontSize: "15px", textAlign: "right", width: "100px" }}>Qty</th>
                <th style={{ color: "#fff", padding: "14px", fontSize: "15px", textAlign: "right", width: "110px" }}>Rate</th>
                <th style={{ color: "#fff", padding: "14px", fontSize: "15px", textAlign: "center", width: "100px" }}>IGST</th>
                <th style={{ color: "#fff", padding: "14px", fontSize: "15px", textAlign: "right", width: "130px" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "20px 12px", fontSize: "15px", verticalAlign: "top" }}>{i + 1}</td>
                  <td style={{ padding: "20px 12px", verticalAlign: "top" }}>
                    <div style={{ display: "flex", gap: "25px" }}>
                      {item.image && <img src={item.image} alt="" style={{ width: "80px", height: "65px", objectFit: "contain" }} />}
                      <div>
                        <div style={{ fontWeight: "700", fontSize: "15px", marginBottom: "8px" }}>{item.title}</div>
                        <ScreenBarcode value={item.sku || item.barcode || item.slug || item.id} width={110} height={35} />
                        <div style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>SKU: {item.sku || item.barcode || (item.slug || item.id)?.substring(0, 10)}</div>
                        {(item.hsnCode || item.hsn) ? (
                          <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>HSN: {item.hsnCode || item.hsn}</div>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "20px 12px", textAlign: "right", verticalAlign: "top" }}>
                    <div style={{ fontSize: "15px", fontWeight: "700" }}>{item.quantity.toFixed(2)}</div>
                    <div style={{ fontSize: "12px", color: "#666" }}>pcs</div>
                  </td>
                  <td style={{ padding: "20px 12px", textAlign: "right", fontSize: "15px", verticalAlign: "top" }}>{(item.basePrice || item.price).toFixed(2)}</td>
                  <td style={{ padding: "20px 12px", textAlign: "center", fontSize: "15px", verticalAlign: "top" }}>{item.gstPercentage || 0}%</td>
                  <td style={{ padding: "20px 12px", textAlign: "right", fontWeight: "700", fontSize: "15px", verticalAlign: "top" }}>
                    {((item.basePrice || item.price) * item.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── TOTALS ── */}
        <table style={{ width: "100%", borderTop: "2.5px solid #333", paddingTop: "25px" }}>
          <tbody>
            <tr>
              <td style={{ textAlign: "left", verticalAlign: "top", fontSize: "16px", fontWeight: "600" }}>
                Total No. of Items: {totalQty.toFixed(2)}
              </td>
              <td style={{ textAlign: "right", verticalAlign: "top" }}>
                <div style={{ display: "inline-block", width: "350px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                    <span style={{ fontSize: "15px", color: "#444" }}>Sub Total</span>
                    <span style={{ fontSize: "15px", fontWeight: "600" }}>{preTaxSubTotal.toFixed(2)}</span>
                  </div>
                  {shipping > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                      <span style={{ fontSize: "15px", color: "#444" }}>Delivery Charges</span>
                      <span style={{ fontSize: "15px", fontWeight: "600" }}>{shipping.toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                    <span style={{ fontSize: "15px", color: "#444" }}>{`IGST (${averageTaxRate}%)`}</span>
                    <span style={{ fontSize: "15px", fontWeight: "600" }}>{taxAmt.toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "15px", paddingTop: "15px", borderTop: "1px solid #ccc" }}>
                    <span style={{ fontSize: "18px", fontWeight: "700" }}>Total</span>
                    <span style={{ fontSize: "18px", fontWeight: "700" }}>{currency}{total.toFixed(2)}</span>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── FOOTER ── */}
        <div style={{ marginTop: "120px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "10px" }}>
            <span style={{ fontSize: "16px", fontWeight: "700" }}>Checked By</span>
            <div style={{ flex: "1", maxWidth: "500px", borderBottom: "2.5px solid #000", height: "24px" }}></div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div ref={printRef}>
      {Array.isArray(data) ? (
        data.map((or, i) => renderSingleInvoice(or, i))
      ) : (
        renderSingleInvoice(data, 0)
      )}
    </div>
  );
};

export default InvoiceForPrint;
