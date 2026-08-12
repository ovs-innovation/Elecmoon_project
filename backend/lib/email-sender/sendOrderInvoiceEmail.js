const MailChecker = require("mailchecker");
const Setting = require("../../models/Setting");
const { handleCreateInvoice } = require("./create");
const customerInvoiceEmailBody = require("./templates/order-to-customer");
const { sendMailPromise } = require("./sender");

const formatOrderDate = (date) => {
  const d = new Date(date || Date.now());
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
};

const formatUserFullAddress = (user = {}) =>
  [user.address, user.city, user.country, user.zipCode].filter(Boolean).join(", ");

const buildCompanyInfo = (globalSetting = {}) => ({
  currency: globalSetting.default_currency || "₹",
  company: globalSetting.company_name || "Elecmoon",
  address: globalSetting.address || "",
  phone: globalSetting.contact || "",
  email: globalSetting.email || "",
  website: globalSetting.website || "",
  vat_number: globalSetting.vat_number || "",
  from_email:
    globalSetting.from_email ||
    globalSetting.email ||
    process.env.EMAIL_USER ||
    "sales@Elecmoon.com",
});

const buildInvoicePayload = (order, globalSetting = {}) => {
  const company_info = buildCompanyInfo(globalSetting);
  const user = order.user_info || {};
  const vat = Math.max(
    0,
    (order.total || 0) -
      (order.subTotal || 0) -
      (order.shippingCost || 0) +
      (order.discount || 0)
  );

  return {
    date: formatOrderDate(order.createdAt),
    invoice: order.invoice,
    orderId: order.orderId,
    status: order.status,
    paymentMethod: order.paymentMethod,
    subTotal: order.subTotal,
    total: order.total,
    discount: order.discount || 0,
    shippingCost: order.shippingCost || 0,
    vat,
    company_info,
    user_info: {
      ...user,
      phone: user.contact || user.phone || "",
      address: formatUserFullAddress(user),
    },
    cart: order.cart || [],
  };
};

const buildEmailOptions = (payload) => {
  const { company_info, user_info } = payload;
  const invoiceLabel = payload.orderId || payload.invoice;

  const option = {
    date: payload.date,
    invoice: payload.invoice,
    status: payload.status,
    method: payload.paymentMethod,
    subTotal: payload.subTotal,
    total: payload.total,
    discount: payload.discount,
    shipping: payload.shippingCost,
    currency: company_info.currency,
    company_name: company_info.company,
    company_address: company_info.address,
    company_phone: company_info.phone,
    company_email: company_info.email,
    company_website: company_info.website,
    vat_number: company_info.vat_number,
    name: user_info.name,
    email: user_info.email,
    phone: user_info.phone,
    address: user_info.address,
    cart: payload.cart,
  };

  return {
    from: company_info.from_email,
    to: user_info.email,
    subject: `Your Order Invoice #${invoiceLabel} - ${company_info.company}`,
    html: customerInvoiceEmailBody(option),
    attachments: [
      {
        filename: `Invoice-${invoiceLabel}.pdf`,
        content: null,
      },
    ],
    _invoiceLabel: invoiceLabel,
  };
};

const sendOrderInvoiceEmail = async (order) => {
  const customerEmail = order?.user_info?.email;

  if (!customerEmail || !MailChecker.isValid(customerEmail)) {
    console.warn("Skipping invoice email: invalid or missing customer email");
    return false;
  }

  const globalSettingDoc = await Setting.findOne({ name: "globalSetting" });
  const globalSetting = globalSettingDoc?.setting || {};

  const payload = buildInvoicePayload(order, globalSetting);
  const pdf = await handleCreateInvoice(payload, `${payload.invoice}.pdf`);
  const mailOptions = buildEmailOptions(payload);
  mailOptions.attachments[0].content = pdf;

  const adminEmail = globalSetting.email;
  if (adminEmail && adminEmail !== customerEmail) {
    mailOptions.bcc = adminEmail;
  }

  await sendMailPromise(mailOptions);
  console.log(
    `Invoice email sent to ${customerEmail} for order ${mailOptions._invoiceLabel}`
  );
  return true;
};

const queueOrderInvoiceEmail = (order) => {
  const orderData = order?.toObject ? order.toObject() : order;
  sendOrderInvoiceEmail(orderData).catch((err) => {
    console.error("Failed to send order invoice email:", err.message);
  });
};

module.exports = {
  buildInvoicePayload,
  sendOrderInvoiceEmail,
  queueOrderInvoiceEmail,
};
