const crypto = require("crypto");

let SePayPgClientCtor = null;
try {
  ({ SePayPgClient: SePayPgClientCtor } = require("sepay-pg-node"));
} catch (error) {
  SePayPgClientCtor = null;
}

function getSePayConfig() {
  const explicitEnv = String(process.env.SEPAY_ENV || "")
    .trim()
    .toLowerCase();
  const secretKey = process.env.SEPAY_SECRET_KEY || "";
  const inferredEnv = inferSePayEnv(explicitEnv, secretKey);

  return {
    env: inferredEnv,
    merchantId:
      process.env.SEPAY_MERCHANT_ID || process.env.SEPAY_STORE_ID || "",
    partnerCode: process.env.SEPAY_PARTNER_CODE || "SEPAY",
    accessKey: process.env.SEPAY_ACCESS_KEY || "",
    secretKey: process.env.SEPAY_SECRET_KEY || "",
    bankCode: process.env.SEPAY_BANK_CODE || "",
    accountNumber: process.env.SEPAY_ACCOUNT_NUMBER || "",
    accountName: process.env.SEPAY_ACCOUNT_NAME || "",
    qrTemplate: process.env.SEPAY_QR_TEMPLATE || "compact",
    qrBaseUrl: process.env.SEPAY_QR_BASE_URL || "https://qr.sepay.vn/img",
    redirectUrl:
      process.env.SEPAY_REDIRECT_URL ||
      "http://localhost:5173/payments/success",
    ipnUrl:
      process.env.SEPAY_IPN_URL ||
      "http://localhost:5000/api/payments/sepay/ipn",
    checkoutInitUrl:
      process.env.SEPAY_CHECKOUT_INIT_URL ||
      (inferredEnv === "production"
        ? "https://pay.sepay.vn/v1/checkout/init"
        : "https://pay-sandbox.sepay.vn/v1/checkout/init"),
    lang: process.env.SEPAY_LANG || "vi",
  };
}

function inferSePayEnv(explicitEnv, secretKey) {
  if (explicitEnv === "production" || explicitEnv === "sandbox") {
    return explicitEnv;
  }

  const normalizedSecret = String(secretKey || "")
    .trim()
    .toLowerCase();
  if (normalizedSecret.startsWith("spsk_live_")) {
    return "production";
  }

  return "sandbox";
}

function hmacSHA256(key, str) {
  return crypto.createHmac("sha256", key).update(str).digest("hex");
}

function buildCallbackSignature(payload, accessKey) {
  const rawSignature = [
    `accessKey=${accessKey}`,
    `amount=${payload.amount}`,
    `extraData=${payload.extraData || ""}`,
    `message=${payload.message || ""}`,
    `orderId=${payload.orderId}`,
    `orderInfo=${payload.orderInfo || ""}`,
    `orderType=${payload.orderType || ""}`,
    `partnerCode=${payload.partnerCode}`,
    `payType=${payload.payType || ""}`,
    `requestId=${payload.requestId}`,
    `responseTime=${payload.responseTime || ""}`,
    `resultCode=${payload.resultCode}`,
    `transId=${payload.transId || ""}`,
  ].join("&");

  return rawSignature;
}

function isPlaceholder(value) {
  const normalized = String(value || "")
    .trim()
    .toUpperCase();
  return normalized.startsWith("YOUR_") || normalized.includes("PLACEHOLDER");
}

function normalizeBankCode(bankCode) {
  const normalized = String(bankCode || "").trim();
  if (!normalized) {
    return "";
  }

  const upper = normalized.toUpperCase();
  if (upper === "ICB" || upper === "VIETINBANK") {
    return "VietinBank";
  }

  return normalized;
}

function assertValidCheckoutConfig(config) {
  if (!config.merchantId || isPlaceholder(config.merchantId)) {
    throw new Error("SEPAY_MERCHANT_ID chưa cấu hình đúng");
  }

  if (!config.secretKey || isPlaceholder(config.secretKey)) {
    throw new Error("SEPAY_SECRET_KEY chưa cấu hình đúng");
  }
}

function canBuildQr(config) {
  return Boolean(
    config.bankCode &&
    !isPlaceholder(config.bankCode) &&
    config.accountNumber &&
    !isPlaceholder(config.accountNumber) &&
    /^[A-Za-z0-9]+$/.test(String(config.accountNumber).trim()),
  );
}

function buildQrUrl(config, amount, transferDescription) {
  if (!canBuildQr(config)) {
    return null;
  }

  const normalizedBankCode = normalizeBankCode(config.bankCode);
  const qrUrl = new URL(config.qrBaseUrl);
  qrUrl.searchParams.set("bank", normalizedBankCode);
  qrUrl.searchParams.set("acc", String(config.accountNumber).trim());
  qrUrl.searchParams.set("amount", String(amount));
  qrUrl.searchParams.set("des", transferDescription);

  if (config.qrTemplate) {
    qrUrl.searchParams.set("template", config.qrTemplate);
  }

  return qrUrl.toString();
}

let cachedSePayClient = null;
let cachedSePayClientKey = "";

function getSePaySdkClient(config) {
  if (!SePayPgClientCtor) {
    return null;
  }

  const env = config.env === "production" ? "production" : "sandbox";
  const cacheKey = `${env}:${config.merchantId}:${config.secretKey}`;

  if (cachedSePayClient && cachedSePayClientKey === cacheKey) {
    return cachedSePayClient;
  }

  cachedSePayClient = new SePayPgClientCtor({
    env,
    merchant_id: String(config.merchantId).trim(),
    secret_key: String(config.secretKey).trim(),
  });
  cachedSePayClientKey = cacheKey;
  return cachedSePayClient;
}

function buildSePaySignature(formFields, secretKey) {
  const allowedFields = [
    "order_amount",
    "merchant",
    "currency",
    "operation",
    "order_description",
    "order_invoice_number",
    "customer_id",
    "payment_method",
    "success_url",
    "error_url",
    "cancel_url",
  ];

  const signedString = allowedFields
    .filter((field) => formFields[field] != null && formFields[field] !== "")
    .map((field) => `${field}=${formFields[field]}`)
    .join("&");

  return crypto
    .createHmac("sha256", secretKey)
    .update(signedString)
    .digest("base64");
}

function createSePayCheckout({
  amount,
  orderId,
  orderDescription,
  customerId,
  successUrl,
  errorUrl,
  cancelUrl,
}) {
  const config = getSePayConfig();
  assertValidCheckoutConfig(config);

  const requestId = `${orderId}`;
  const normalizedAmount = Math.round(Number(amount) || 0);
  const transferDescription = String(orderDescription || orderId || "").trim();
  const orderInvoiceNumber = String(orderId).trim();
  const checkoutInput = {
    operation: "PURCHASE",
    payment_method: "BANK_TRANSFER",
    order_invoice_number: orderInvoiceNumber,
    order_amount: normalizedAmount,
    currency: "VND",
    order_description: transferDescription,
    customer_id: String(customerId || "").trim() || undefined,
    success_url: String(successUrl || "").trim() || undefined,
    error_url: String(errorUrl || "").trim() || undefined,
    cancel_url: String(cancelUrl || "").trim() || undefined,
  };

  let checkoutActionUrl = String(config.checkoutInitUrl).trim();
  let checkoutFields = null;

  try {
    const sdkClient = getSePaySdkClient(config);
    if (sdkClient) {
      checkoutActionUrl = sdkClient.checkout.initCheckoutUrl();
      checkoutFields =
        sdkClient.checkout.initOneTimePaymentFields(checkoutInput);
    }
  } catch (error) {
    checkoutFields = null;
  }

  if (!checkoutFields) {
    checkoutFields = {
      order_amount: normalizedAmount,
      merchant: String(config.merchantId).trim(),
      currency: "VND",
      operation: "PURCHASE",
      order_description: transferDescription,
      order_invoice_number: orderInvoiceNumber,
      customer_id: String(customerId || "").trim(),
      payment_method: "BANK_TRANSFER",
      success_url: String(successUrl || "").trim(),
      error_url: String(errorUrl || "").trim(),
      cancel_url: String(cancelUrl || "").trim(),
    };

    checkoutFields.signature = buildSePaySignature(
      checkoutFields,
      config.secretKey,
    );
  }

  const qrCodeUrl = buildQrUrl(config, normalizedAmount, transferDescription);

  return Promise.resolve({
    payUrl: qrCodeUrl || checkoutActionUrl,
    qrCodeUrl: qrCodeUrl || undefined,
    checkoutActionUrl,
    checkoutFields,
    requestId,
    orderId,
    amount: normalizedAmount,
    bankCode: config.bankCode || undefined,
    accountNumber: canBuildQr(config)
      ? String(config.accountNumber).trim()
      : undefined,
    accountName: String(config.accountName || "").trim(),
    response: {
      gateway: "SePay",
      transferDescription,
    },
  });
}

function verifySePayCallback(payload) {
  const config = getSePayConfig();
  const incomingSignature = String(payload.signature || "").trim();
  if (!incomingSignature) return false;

  const rawSignature = buildCallbackSignature(payload, config.accessKey);
  const computedSignature = hmacSHA256(config.secretKey, rawSignature);
  return computedSignature === incomingSignature;
}

module.exports = {
  createSePayCheckout,
  verifySePayCallback,
  getSePayConfig,
};
