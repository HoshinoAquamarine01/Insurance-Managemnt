const crypto = require("crypto");

function sortObjectKeys(obj) {
  return Object.keys(obj)
    .sort()
    .reduce((result, key) => {
      result[key] = obj[key];
      return result;
    }, {});
}

function hmacSHA512(key, str) {
  return crypto.createHmac("sha512", key).update(str).digest("hex");
}

function normalizeIpAddr(ipAddr) {
  const raw = String(ipAddr || "").trim();
  if (!raw) {
    return "127.0.0.1";
  }

  const first = raw.split(",")[0].trim();
  if (first === "::1") {
    return "127.0.0.1";
  }

  if (first.startsWith("::ffff:")) {
    return first.replace("::ffff:", "");
  }

  return first;
}

function buildSignData(params) {
  const sortedParams = sortObjectKeys(params);
  return Object.keys(sortedParams)
    .map((key) => {
      const value = sortedParams[key];
      return `${encodeURIComponent(key)}=${encodeURIComponent(String(value)).replace(/%20/g, "+")}`;
    })
    .join("&");
}

function createPaymentUrl({
  amount,
  bankCode = "",
  description = "",
  ipAddr = "127.0.0.1",
  orderId = "",
  orderType = "other",
  returnUrl = "http://localhost:5173/payments",
  locale = "vn",
}) {
  // Support both naming conventions
  const tmnCode =
    process.env.VNPAY_MERCHANT_ID || process.env.VNP_TMN_CODE || "";
  const secretKey =
    process.env.VNPAY_HASH_SECRET || process.env.VNP_HASH_SECRET || "";
  const placeholderValues = [
    "dien_ma_website_cua_ban",
    "dien_chuoi_bi_mat_cua_ban",
  ];
  const normalizedTmnCode = String(tmnCode).trim().toLowerCase();
  const normalizedSecret = String(secretKey).trim().toLowerCase();

  if (!tmnCode || !secretKey) {
    const error = new Error(
      "Missing VNPay configuration (VNPAY_MERCHANT_ID/VNP_TMN_CODE and VNPAY_HASH_SECRET/VNP_HASH_SECRET)",
    );
    error.statusCode = 500;
    throw error;
  }

  if (
    placeholderValues.includes(normalizedTmnCode) ||
    placeholderValues.includes(normalizedSecret)
  ) {
    const error = new Error(
      "VNPay is not configured with real merchant credentials. Please set valid VNP_TMN_CODE/VNP_HASH_SECRET (or VNPAY_MERCHANT_ID/VNPAY_HASH_SECRET).",
    );
    error.statusCode = 500;
    throw error;
  }

  const vnpUrl =
    process.env.VNPAY_URL ||
    process.env.VNP_URL ||
    "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
  const date = new Date();
  const createDate = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}${String(date.getHours()).padStart(2, "0")}${String(date.getMinutes()).padStart(2, "0")}${String(date.getSeconds()).padStart(2, "0")}`;

  const vnp_Params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: tmnCode,
    vnp_Locale: locale,
    vnp_CurrCode: "VND",
    vnp_TxnRef: orderId || `${tmnCode}${createDate}`,
    vnp_OrderInfo: description || "Payment for installment",
    vnp_OrderType: orderType,
    vnp_Amount: amount * 100, // VNPay expects amount in cents
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: normalizeIpAddr(ipAddr),
    vnp_CreateDate: createDate,
  };

  if (bankCode) {
    vnp_Params.vnp_BankCode = bankCode;
  }

  // Sort and create signature
  const signData = buildSignData(vnp_Params);
  const hmac = hmacSHA512(secretKey, signData);

  return `${vnpUrl}?${signData}&vnp_SecureHash=${hmac}`;
}

function verifyIpn(vnp_Params) {
  const secretKey =
    process.env.VNPAY_HASH_SECRET || process.env.VNP_HASH_SECRET || "";

  if (!secretKey) {
    throw new Error(
      "Missing VNPAY_HASH_SECRET or VNP_HASH_SECRET configuration",
    );
  }

  const secureHash = vnp_Params["vnp_SecureHash"];

  // Remove hash and hash type from params to verify signature
  const paramsCopy = { ...vnp_Params };
  delete paramsCopy["vnp_SecureHash"];
  delete paramsCopy["vnp_SecureHashType"];

  const signData = buildSignData(paramsCopy);
  const computedHash = hmacSHA512(secretKey, signData);

  return computedHash === secureHash;
}

function getTransactionStatus(params) {
  const responseCode = String(params["vnp_ResponseCode"] || "");
  const transactionStatus = String(params["vnp_TransactionStatus"] || "");

  // VNPay response codes:
  // 00: Success
  // 01-99: Error codes
  // Transaction status:
  // 0: Chưa thanh toán
  // 1: Đã thanh toán
  // 2: Bị từ chối

  return {
    responseCode,
    transactionStatus,
    isPaid: responseCode === "00" && transactionStatus === "0",
  };
}

module.exports = {
  createPaymentUrl,
  verifyIpn,
  getTransactionStatus,
  hmacSHA512,
  normalizeIpAddr,
  sortObjectKeys,
};
