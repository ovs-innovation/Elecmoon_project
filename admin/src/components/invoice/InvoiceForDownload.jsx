import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  Font,
} from "@react-pdf/renderer";
import React from "react";
import elecmoonLogo from "@/assets/img/logo/elecmoon-logo.jpg";

Font.register({
  family: "Open Sans",
  fonts: [
    { src: "https://fonts.gstatic.com/s/opensans/v34/memvYaGs126MiZpBA-UvWbX2vVnXBbObj2OVTSKmu1aB.ttf" },
    { src: "https://fonts.gstatic.com/s/opensans/v34/memvYaGs126MiZpBA-UvWbX2vVnXBbObj2OVTSGmu1aB.ttf", fontWeight: 700 },
  ],
});

const BarcodeView = ({ value = "", width = 120, height = 35 }) => {
  if (!value) return null;
  const barcodeUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(value)}&includetext=false`;
  return (
    <View style={{ width, height, overflow: "hidden" }}>
      <Image src={barcodeUrl} style={{ width: "100%", height: "100%", objectFit: "fill" }} />
    </View>
  );
};

const S = StyleSheet.create({
  page: { fontFamily: "Open Sans", fontSize: 11, padding: "40px 50px", color: "#000", backgroundColor: "#fff" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 40 },
  logo: { width: 200, height: 60, objectFit: "contain", marginBottom: 15 },
  companyName: { fontSize: 14, fontWeight: 700, marginBottom: 5 },
  companyInfoText: { fontSize: 10, color: "#333", lineHeight: 1.5 },
  headerRight: { width: "45%", alignItems: "flex-end" },
  poTitle: { fontSize: 46, fontWeight: 400, marginBottom: 10 },
  invoiceNumText: { fontSize: 14, fontWeight: 700, marginBottom: 10 },
  vendorDatesRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 35 },
  vendorBlock: { width: "55%" },
  labelGray: { fontSize: 12, color: "#666", marginBottom: 6 },
  boldUpper: { fontSize: 14, fontWeight: 700, textTransform: "uppercase", marginBottom: 8 },
  datesBlock: { width: "45%", alignItems: "flex-end" },
  dateEntry: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 8 },
  dateLabel: { width: 150, textAlign: "right", paddingRight: 25, color: "#444", fontSize: 12 },
  dateVal: { width: 100, textAlign: "right", fontWeight: 700, fontSize: 12 },
  table: { marginBottom: 40 },
  tableHeader: { flexDirection: "row", backgroundColor: "#333", padding: "12px 14px" },
  thText: { color: "#fff", fontSize: 12, fontWeight: 700 },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#eee", borderBottomStyle: "solid", padding: "15px 14px" },
  colNum: { width: "6%" },
  colItem: { width: "44%" },
  colQty: { width: "12%", textAlign: "right" },
  colRate: { width: "12%", textAlign: "right" },
  colIgst: { width: "12%", textAlign: "center" },
  colAmt: { width: "14%", textAlign: "right" },
  itemTitle: { fontSize: 12, fontWeight: 700, marginBottom: 6 },
  skuText: { fontSize: 10, color: "#666", marginTop: 6 },
  totalsSection: { flexDirection: "row", justifyContent: "space-between", paddingTop: 20, borderTopWidth: 2, borderTopColor: "#333", borderTopStyle: "solid" },
  totalsBox: { width: 300 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  grandTotalRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: "#ddd" },
  footer: { marginTop: 80 },
  signatureLine: { flexDirection: "row", alignItems: "flex-end" },
  checkedByLabel: { fontSize: 13, marginRight: 10, fontWeight: 700 },
  borderBottom: { width: 320, borderBottomWidth: 2, borderBottomColor: "#000", borderBottomStyle: "solid", height: 20 },
});

const InvoiceForDownload = ({ data, currency, globalSetting, showDateFormat, getNumberTwo }) => {
  const cart = data?.cart || [];
  const totalQty = cart.reduce((s, i) => s + (i.quantity || 0), 0);
  const preTaxSubTotal = cart.reduce((acc, item) => acc + ((item.basePrice || item.price) * (item.quantity || 1)), 0);
  const shipping = data?.shippingCost || 0;
  const total = data?.total || 0;
  const discount = data?.discount || 0;
  const taxAmt = total - preTaxSubTotal - shipping + discount;
  const averageTaxRate = preTaxSubTotal > 0 ? Math.round((taxAmt / preTaxSubTotal) * 100) : 18;

  return (
    <Document>
      <Page size="A4" style={S.page}>
        <View style={S.headerRow}>
          <View style={{ width: "55%" }}>
            <Image src={elecmoonLogo} style={S.logo} />
            <Text style={S.companyName}>{globalSetting?.company_name || "ECOMPASS LLP"}</Text>
            <Text style={S.companyInfoText}>{globalSetting?.address || "#47, New Anaj Mandi Sector 16, Faridabad - 121002, India"}</Text>
            <Text style={S.companyInfoText}>{`${globalSetting?.email || "ecompassllp@gmail.com"} | GSTIN: ${globalSetting?.vat_number || "06AAIFE7762K1Z0"}`}</Text>
          </View>
          <View style={S.headerRight}>
            <Text style={S.poTitle}>Purchase Order</Text>
            <Text style={S.invoiceNumText}># {data?.orderId || data?.invoice}</Text>
            <BarcodeView value={data?.orderId || data?.invoice?.toString()} width={130} height={35} />
          </View>
        </View>

        <View style={S.vendorDatesRow}>
          <View style={S.vendorBlock}>
            <Text style={S.labelGray}>Vendor's Details</Text>
            <Text style={S.boldUpper}>{data?.user_info?.name}</Text>
            <Text style={S.companyInfoText}>
              {[
                data?.user_info?.address,
                data?.user_info?.city,
                data?.user_info?.country,
                data?.user_info?.zipCode,
              ]
                .filter(Boolean)
                .join(", ")}
            </Text>
            <Text style={S.companyInfoText}>{`| GSTIN ${data?.user_info?.vat_number || "07EDPPK2298G2Z1"}`}</Text>
          </View>
          <View style={S.datesBlock}>
            <View style={S.dateEntry}><Text style={S.dateLabel}>Date :</Text><Text style={S.dateVal}>{showDateFormat(data?.createdAt)}</Text></View>
            <View style={S.dateEntry}><Text style={S.dateLabel}>Delivery Date :</Text><Text style={S.dateVal}>{showDateFormat(data?.updatedAt)}</Text></View>
            <View style={S.dateEntry}><Text style={S.dateLabel}>Purchase Person :</Text><Text style={S.dateVal}>{data?.user_info?.name?.split(" ")[0]}</Text></View>
          </View>
        </View>

        <View style={S.table}>
          <View style={S.tableHeader}>
            <Text style={[S.thText, S.colNum]}>#</Text>
            <Text style={[S.thText, S.colItem]}>Item & Description</Text>
            <Text style={[S.thText, S.colQty]}>Qty</Text>
            <Text style={[S.thText, S.colRate]}>Rate</Text>
            <Text style={[S.thText, S.colIgst]}>IGST</Text>
            <Text style={[S.thText, S.colAmt]}>Amount</Text>
          </View>
          {cart.map((item, i) => (
            <View key={i} style={S.tableRow}>
              <Text style={[S.colNum, { fontSize: 12 }]}>{i + 1}</Text>
              <View style={S.colItem}>
                <View style={{ flexDirection: "row" }}>
                  {item.image && <Image src={item.image} style={{ width: 60, height: 45, marginRight: 15, objectFit: "contain" }} />}
                  <View style={{ flex: 1 }}>
                    <Text style={S.itemTitle}>{item.title}</Text>
                    <BarcodeView value={item.sku || item.barcode || item.slug || item.id} width={100} height={25} />
                    <Text style={S.skuText}>SKU: {item.sku || item.barcode || (item.slug || item.id)?.substring(0, 10)}</Text>
                    {(item.hsnCode || item.hsn) ? (
                      <Text style={S.skuText}>HSN: {item.hsnCode || item.hsn}</Text>
                    ) : null}
                  </View>
                </View>
              </View>
              <View style={S.colQty}><Text style={{ fontSize: 12, fontWeight: 700 }}>{item.quantity.toFixed(2)}</Text><Text style={{ fontSize: 10, color: "#666" }}>pcs</Text></View>
              <Text style={[S.colRate, { fontSize: 12 }]}>{getNumberTwo(item.basePrice || item.price)}</Text>
              <Text style={[S.colIgst, { fontSize: 12 }]}>{item.gstPercentage || 0}%</Text>
              <Text style={[S.colAmt, { fontSize: 12, fontWeight: 700 }]}>{getNumberTwo((item.basePrice || item.price) * item.quantity)}</Text>
            </View>
          ))}
        </View>

        <View style={S.totalsSection}>
          <Text style={{ fontSize: 13, fontWeight: 700 }}>Total No. of Items: {totalQty.toFixed(2)}</Text>
          <View style={S.totalsBox}>
            <View style={S.totalRow}><Text style={S.dateLabel}>Sub Total</Text><Text style={S.dateVal}>{getNumberTwo(preTaxSubTotal)}</Text></View>
            {shipping > 0 && <View style={S.totalRow}><Text style={S.dateLabel}>Delivery Charges</Text><Text style={S.dateVal}>{getNumberTwo(shipping)}</Text></View>}
            <View style={S.totalRow}><Text style={S.dateLabel}>{`IGST (${averageTaxRate}%)`}</Text><Text style={S.dateVal}>{getNumberTwo(taxAmt)}</Text></View>
            <View style={S.grandTotalRow}><Text style={[S.dateLabel, { fontSize: 15, fontWeight: 700, color: "#000" }]}>Total</Text><Text style={[S.dateVal, { fontSize: 15, fontWeight: 700 }]}>{currency}{getNumberTwo(total)}</Text></View>
          </View>
        </View>

        <View style={S.footer}>
          <View style={S.signatureLine}><Text style={S.checkedByLabel}>Checked By</Text><View style={S.borderBottom} /></View>
        </View>
      </Page>
    </Document>
  );
};
export default InvoiceForDownload;
