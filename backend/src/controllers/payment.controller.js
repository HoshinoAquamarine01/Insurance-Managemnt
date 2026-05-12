const { body, param, query } = require("express-validator");
const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../views/apiResponse.view");
const paymentModel = require("../models/payment.model");
const { createSePayCheckout, verifySePayCallback } = require("../utils/sepay");

const createCheckoutSessionRules = [body("idKy").isInt({ min: 1 })];
const confirmCheckoutSessionRules = [
  query("orderId").notEmpty(),
  query("amount").isNumeric(),
  query("resultCode").isInt(),
];
const reportTransferredPaymentRules = [
  body("idKy").isInt({ min: 1 }),
  body("orderRef").optional().isString().isLength({ min: 3, max: 100 }),
];
const confirmAccountingPaymentRules = [param("id").isInt({ min: 1 })];
const ipnNotificationRules = [];

function resolveSePayOrderContext(orderId, fallbackAmount) {
  const normalizedOrderId = String(orderId || "")
    .trim()
    .replace(/^DH/i, "");
  const orderIdParts = normalizedOrderId.split("-");
  const parsedIdKy = Number(orderIdParts[0]);
  const parsedInsuredUserId = Number(orderIdParts[1]);

  if (!Number.isInteger(parsedIdKy) || parsedIdKy <= 0) {
    return null;
  }

  if (!Number.isInteger(parsedInsuredUserId) || parsedInsuredUserId <= 0) {
    return null;
  }

  return {
    idKy: parsedIdKy,
    insuredUserId: parsedInsuredUserId,
    amount: Number(fallbackAmount || 0),
  };
}

function resolveSePayOrderContextByAmount(amount) {
  const normalizedAmount = Math.round(Number(amount || 0));
  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
    return null;
  }

  const pendingOrders = Object.entries(global.sepayOrders || {})
    .filter(
      ([, orderData]) =>
        Math.round(Number(orderData?.amount || 0)) === normalizedAmount,
    )
    .sort(
      (left, right) =>
        Number(right[1]?.createdAt || 0) - Number(left[1]?.createdAt || 0),
    );

  const [orderId, orderData] = pendingOrders[0] || [];
  if (!orderId || !orderData) {
    return null;
  }

  return {
    orderId,
    idKy: Number(orderData.idKy),
    insuredUserId: Number(orderData.insuredUserId),
    amount: normalizedAmount,
  };
}

function extractOrderRefFromContent(content) {
  const normalized = String(content || "").trim();
  if (!normalized) {
    return null;
  }

  const match = normalized.match(/DH\s*(\d+-\d+-\d+)/i);
  if (match?.[1]) {
    return `DH${match[1]}`;
  }

  if (/^DH/i.test(normalized)) {
    return normalized.replace(/\s+/g, "");
  }

  return null;
}

function isValidSePayWebhookAuth(authHeader, webhookApiKey) {
  const header = String(authHeader || "").trim();
  const apiKey = String(webhookApiKey || "").trim();

  if (!apiKey) {
    return true;
  }

  // Accept common variants: "Apikey <key>", "ApiKey <key>", or raw key.
  const normalizedHeader = header.replace(/^apikey\s+/i, "").trim();
  return header === `Apikey ${apiKey}` || normalizedHeader === apiKey;
}

function getFirstNonEmptyValue(payload, keys) {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  for (const key of keys) {
    const direct = payload[key];
    if (direct != null && String(direct).trim() !== "") {
      return direct;
    }

    if (key.includes(".")) {
      const dotted = key.split(".").reduce((current, part) => {
        if (!current || typeof current !== "object") {
          return undefined;
        }
        return current[part];
      }, payload);

      if (dotted != null && String(dotted).trim() !== "") {
        return dotted;
      }
    }
  }

  return "";
}

function parseSePayIpnPayload(payload) {
  const normalizedPayload =
    payload && typeof payload === "object" ? payload : {};

  const notificationType = String(
    getFirstNonEmptyValue(normalizedPayload, [
      "notification_type",
      "notificationType",
    ]) || "",
  ).toUpperCase();

  const orderId = String(
    getFirstNonEmptyValue(normalizedPayload, [
      "order.order_invoice_number",
      "order[order_invoice_number]",
      "order_invoice_number",
      "order.order_id",
      "order[order_id]",
      "order_id",
      "referenceCode",
      "reference_code",
      "content",
      "description",
      "transferContent",
      "transfer_content",
    ]) || "",
  ).trim();

  const parsedAmount = Math.round(
    Number(
      getFirstNonEmptyValue(normalizedPayload, [
        "order.order_amount",
        "order[order_amount]",
        "order_amount",
        "transaction.transaction_amount",
        "transaction[transaction_amount]",
        "transaction_amount",
      ]) || 0,
    ) || 0,
  );

  const orderStatus = String(
    getFirstNonEmptyValue(normalizedPayload, [
      "order.order_status",
      "order[order_status]",
      "order_status",
    ]) || "",
  ).toUpperCase();

  const transactionStatus = String(
    getFirstNonEmptyValue(normalizedPayload, [
      "transaction.transaction_status",
      "transaction[transaction_status]",
      "transaction_status",
    ]) || "",
  ).toUpperCase();

  const transactionId = String(
    getFirstNonEmptyValue(normalizedPayload, [
      "transaction.id",
      "transaction[transaction_id]",
      "transaction.transaction_id",
      "transaction_id",
      "id",
    ]) || "",
  ).trim();

  const orderEntityId = String(
    getFirstNonEmptyValue(normalizedPayload, [
      "order.id",
      "order[order_id]",
      "order.order_id",
      "order_id",
    ]) || "",
  ).trim();

  if (notificationType) {
    const isPaid =
      notificationType === "ORDER_PAID" ||
      notificationType === "TRANSACTION_APPROVED" ||
      orderStatus === "CAPTURED" ||
      orderStatus === "PAID" ||
      transactionStatus === "APPROVED" ||
      transactionStatus === "SUCCESS";

    return {
      orderId,
      amount: parsedAmount,
      isPaid,
      gatewayRef: transactionId || orderEntityId || orderId,
      debug: { notificationType, orderStatus, transactionStatus },
    };
  }

  const transferType = String(
    normalizedPayload.transferType ||
      normalizedPayload.type ||
      normalizedPayload.direction ||
      "",
  ).toLowerCase();
  const amount = Math.round(
    Number(normalizedPayload.transferAmount || normalizedPayload.amount || 0) ||
      0,
  );
  const legacyOrderId = extractOrderRefFromContent(
    normalizedPayload.content ||
      normalizedPayload.transferContent ||
      normalizedPayload.description ||
      normalizedPayload.referenceCode ||
      normalizedPayload.reference_code ||
      normalizedPayload.id,
  );

  const fallbackOrderId = String(
    legacyOrderId ||
      normalizedPayload.referenceCode ||
      normalizedPayload.reference_code ||
      normalizedPayload.id ||
      "",
  ).trim();

  const acceptedInwardTypes = new Set([
    "in",
    "incoming",
    "deposit",
    "topup",
    "received",
  ]);

  return {
    orderId: fallbackOrderId,
    amount: Math.round(Number(amount || 0)),
    isPaid:
      acceptedInwardTypes.has(String(transferType).toLowerCase()) ||
      String(normalizedPayload.status || "").toLowerCase() === "success",
    gatewayRef: String(
      normalizedPayload.id ||
        normalizedPayload.referenceCode ||
        normalizedPayload.reference_code ||
        legacyOrderId ||
        "",
    ),
    debug: { transferType },
  };
}

const getPayments = asyncHandler(async (req, res) => {
  const data = await paymentModel.getAllPayments(req.user);
  return success(res, data, "Payments fetched");
});

const getPaymentSummary = asyncHandler(async (req, res) => {
  const data = await paymentModel.getPaymentSummary(req.user);
  return success(res, data, "Payment summary fetched");
});

const createCheckoutSession = asyncHandler(async (req, res) => {
  const idKy = Number(req.body?.idKy);
  const insuredUserId = Number(req.user?.id);

  const installment = await paymentModel.getInstallmentByIdForInsured(
    idKy,
    insuredUserId,
  );

  if (!installment) {
    const error = new Error("Installment not found");
    error.statusCode = 404;
    throw error;
  }

  const status = String(installment.TRANGTHAI || "").toLowerCase();
  if (status.includes("đã") || status.includes("da")) {
    const error = new Error("Installment is already paid");
    error.statusCode = 400;
    throw error;
  }

  const amount = Math.round(Number(installment.SOTIENPHAIDONG || 0));
  if (!Number.isFinite(amount) || amount <= 0) {
    const error = new Error("Invalid installment amount");
    error.statusCode = 400;
    throw error;
  }

  const orderRef = `DH${idKy}-${insuredUserId}-${Date.now()}`;

  global.sepayOrders = global.sepayOrders || {};
  global.sepayOrders[orderRef] = {
    idKy,
    insuredUserId,
    amount,
    createdAt: Date.now(),
  };

  const frontendBaseUrl = String(
    process.env.FRONTEND_BASE_URL || "http://localhost:5173",
  ).replace(/\/$/, "");
  const backendBaseUrl = String(
    process.env.BACKEND_BASE_URL ||
      `${req.protocol}://${req.get("host") || "localhost:5000"}`,
  ).replace(/\/$/, "");
  const callbackBaseUrl = String(
    process.env.SEPAY_CALLBACK_BASE_URL || backendBaseUrl,
  ).replace(/\/$/, "");
  const appCheckoutUrl = `${frontendBaseUrl}/payments/sepay?idKy=${idKy}`;
  const successUrl = `${frontendBaseUrl}/payments/success?payment=success&idKy=${idKy}&orderRef=${encodeURIComponent(orderRef)}&amount=${encodeURIComponent(amount)}`;
  const errorUrl = `${callbackBaseUrl}/api/payments/error?idKy=${idKy}&orderRef=${encodeURIComponent(orderRef)}`;
  const cancelUrl = `${callbackBaseUrl}/api/payments/cancel?idKy=${idKy}&orderRef=${encodeURIComponent(orderRef)}`;

  const sepay = await createSePayCheckout({
    amount,
    orderId: orderRef,
    orderDescription: `Thanh toan ky ${installment.SOKY} - ${installment.SOHOPDONG} - ${orderRef}`,
    customerId: String(insuredUserId),
    successUrl,
    errorUrl,
    cancelUrl,
  });

  return success(
    res,
    {
      paymentUrl: appCheckoutUrl,
      payUrl: sepay.payUrl,
      deeplink: sepay.deeplink,
      qrCodeUrl: sepay.qrCodeUrl,
      checkoutActionUrl: sepay.checkoutActionUrl,
      checkoutFields: sepay.checkoutFields,
      amount: sepay.amount,
      bankCode: sepay.bankCode,
      accountNumber: sepay.accountNumber,
      accountName: sepay.accountName,
      orderRef,
      requestId: sepay.requestId,
    },
    "SePay payment data created",
  );
});

function buildSePayFrontendRedirectUrl(req, paymentStatus) {
  const frontendBaseUrl = String(
    process.env.FRONTEND_BASE_URL || "http://localhost:5173",
  ).replace(/\/$/, "");
  const targetPath =
    paymentStatus === "success" ? "/payments/success" : "/payments/sepay";
  const nextUrl = new URL(`${frontendBaseUrl}${targetPath}`);

  nextUrl.searchParams.set("payment", paymentStatus);

  const idKy = String(req.query?.idKy || "").trim();
  const orderRef = String(req.query?.orderRef || "").trim();
  if (idKy) {
    nextUrl.searchParams.set("idKy", idKy);
  }
  if (orderRef) {
    nextUrl.searchParams.set("orderRef", orderRef);
  }

  // Capture SePay callback parameters for frontend to confirm payment
  const orderId = String(req.query?.orderId || "").trim();
  const resultCode = String(req.query?.resultCode || "").trim();
  const amount = String(req.query?.amount || "").trim();
  const signature = String(req.query?.signature || "").trim();

  if (orderId) {
    nextUrl.searchParams.set("orderId", orderId);
  }
  if (resultCode) {
    nextUrl.searchParams.set("resultCode", resultCode);
  }
  if (amount) {
    nextUrl.searchParams.set("amount", amount);
  }
  if (signature) {
    nextUrl.searchParams.set("signature", signature);
  }

  return nextUrl.toString();
}

const handleSePaySuccessRedirect = asyncHandler(async (req, res) => {
  // Try to record a pending payment for accountant confirmation before redirecting.
  try {
    const queryParams = req.query || {};
    const orderId = String(
      queryParams.orderId || queryParams.orderRef || "",
    ).trim();
    const amount = Math.round(Number(queryParams.amount || 0) || 0);
    const resultCode = Number(queryParams.resultCode || -1);

    if ((orderId || amount > 0) && (resultCode === 0 || resultCode === -1)) {
      global.sepayOrders = global.sepayOrders || {};
      const orderData =
        global.sepayOrders[orderId] ||
        resolveSePayOrderContext(orderId, amount) ||
        resolveSePayOrderContextByAmount(amount);

      if (orderData?.idKy && orderData?.insuredUserId) {
        const installment = await paymentModel.getInstallmentByIdForInsured(
          orderData.idKy,
          orderData.insuredUserId,
        );

        if (installment) {
          const expectedAmount = Math.round(
            Number(installment.SOTIENPHAIDONG || 0),
          );
          const effectiveAmount = amount > 0 ? amount : expectedAmount;

          if (effectiveAmount === expectedAmount) {
            await paymentModel.createPendingInstallmentPayment({
              idKy: orderData.idKy,
              insuredUserId: orderData.insuredUserId,
              amount: expectedAmount,
              gatewayRef: `SEPAY-REDIRECT-${orderId}`,
              method: "SePay",
            });

            // Remove any matching order keys from in-memory store
            try {
              if (orderId) {
                delete global.sepayOrders[orderId];
              }
              if (orderData.orderId && orderData.orderId !== orderId) {
                delete global.sepayOrders[orderData.orderId];
              }
            } catch (e) {
              // no-op
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("Error processing SePay success callback:", error);
    // Continue with redirect regardless
  }

  const redirectUrl = buildSePayFrontendRedirectUrl(req, "success");
  return res.redirect(302, redirectUrl);
});

const handleSePayErrorRedirect = asyncHandler(async (req, res) => {
  const redirectUrl = buildSePayFrontendRedirectUrl(req, "error");
  return res.redirect(302, redirectUrl);
});

const handleSePayCancelRedirect = asyncHandler(async (req, res) => {
  const redirectUrl = buildSePayFrontendRedirectUrl(req, "cancel");
  return res.redirect(302, redirectUrl);
});

const confirmCheckoutSession = asyncHandler(async (req, res) => {
  const insuredUserId = Number(req.user?.id);
  const queryParams = req.query || {};

  const orderId = String(queryParams.orderId || "").trim();
  const amount = Math.round(Number(queryParams.amount || 0) || 0);
  const resultCode = Number(queryParams.resultCode || -1);

  if (!orderId || !amount) {
    const error = new Error("Invalid payment parameters");
    error.statusCode = 400;
    throw error;
  }

  if (resultCode !== 0) {
    const error = new Error("Payment failed or not completed");
    error.statusCode = 400;
    throw error;
  }

  if (!verifySePayCallback(queryParams)) {
    const error = new Error("Invalid payment signature");
    error.statusCode = 403;
    throw error;
  }

  global.sepayOrders = global.sepayOrders || {};
  const orderData =
    global.sepayOrders[orderId] || resolveSePayOrderContext(orderId, amount);

  if (!orderData) {
    const error = new Error("Order not found");
    error.statusCode = 404;
    throw error;
  }

  const installment = await paymentModel.getInstallmentByIdForInsured(
    orderData.idKy,
    orderData.insuredUserId,
  );

  if (!installment) {
    const error = new Error("Installment not found");
    error.statusCode = 404;
    throw error;
  }

  const orderAmount = Math.round(Number(installment.SOTIENPHAIDONG || 0));

  // Verify amount and user
  if (amount !== orderAmount || orderData.insuredUserId !== insuredUserId) {
    const error = new Error("Payment data does not match the order");
    error.statusCode = 403;
    throw error;
  }

  // Record payment in database
  await paymentModel.confirmInstallmentPayment({
    idKy: orderData.idKy,
    insuredUserId: orderData.insuredUserId,
    amount: orderAmount,
    gatewayRef: orderId,
    method: "SePay",
  });

  // Clean up order from memory
  delete global.sepayOrders[orderId];

  return success(res, null, "Payment confirmed");
});

const confirmAccountingPayment = asyncHandler(async (req, res) => {
  const paymentId = Number(req.params?.id);
  const accountantId = Number(req.user?.id);

  await paymentModel.confirmPaymentByAccountant({ paymentId, accountantId });

  return success(res, null, "Payment confirmed by accountant");
});

const reportTransferredPayment = asyncHandler(async (req, res) => {
  const insuredUserId = Number(req.user?.id);
  const idKy = Number(req.body?.idKy);
  const orderRef = String(req.body?.orderRef || "").trim();

  const installment = await paymentModel.getInstallmentByIdForInsured(
    idKy,
    insuredUserId,
  );

  if (!installment) {
    const error = new Error("Installment not found");
    error.statusCode = 404;
    throw error;
  }

  const amount = Math.round(Number(installment.SOTIENPHAIDONG || 0));
  if (!Number.isFinite(amount) || amount <= 0) {
    const error = new Error("Invalid installment amount");
    error.statusCode = 400;
    throw error;
  }

  await paymentModel.createPendingInstallmentPayment({
    idKy,
    insuredUserId,
    amount,
    gatewayRef: orderRef
      ? `MANUAL-${orderRef}`
      : `MANUAL-${idKy}-${Date.now()}`,
    method: "SePay",
  });

  return success(res, null, "Payment reported for accountant confirmation");
});

const ipnNotification = asyncHandler(async (req, res) => {
  const payload = req.body && Object.keys(req.body).length > 0 ? req.body : {};

  const webhookApiKey = process.env.SEPAY_WEBHOOK_API_KEY || "";
  const authHeader = String(req.get("authorization") || "").trim();
  if (!isValidSePayWebhookAuth(authHeader, webhookApiKey)) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  const parsedIpn = parseSePayIpnPayload(payload);
  const callbackAmount = Math.round(Number(parsedIpn.amount || 0) || 0);
  const orderId = String(parsedIpn.orderId || "").trim();

  // Optional debug logging to assist with webhook troubleshooting.
  if (String(process.env.SEPAY_DEBUG || "").toLowerCase() === "true") {
    try {
      console.info(
        "[SEPAY_DEBUG] Incoming IPN payload:",
        JSON.stringify(payload),
      );
    } catch (e) {
      console.info("[SEPAY_DEBUG] Incoming IPN payload (non-serializable)");
    }
    console.info("[SEPAY_DEBUG] Parsed IPN:", parsedIpn);
    try {
      global.sepayLastIpn = {
        payload: payload,
        parsed: parsedIpn,
        receivedAt: Date.now(),
      };
    } catch (e) {
      // ignore
    }
  }
  const resolvedOrderData =
    (orderId &&
      (global.sepayOrders?.[orderId] ||
        resolveSePayOrderContext(orderId, callbackAmount))) ||
    resolveSePayOrderContextByAmount(callbackAmount);

  if (
    !parsedIpn.isPaid ||
    (!orderId && !resolvedOrderData) ||
    !callbackAmount
  ) {
    console.warn("SePay IPN ignored: invalid payload", {
      debug: parsedIpn.debug,
      callbackAmount,
      orderId,
      resolvedOrderData,
      payloadKeys: Object.keys(payload || {}),
    });
    return res.status(200).json({
      success: false,
      message: "Invalid transaction payload",
    });
  }

  global.sepayOrders = global.sepayOrders || {};
  const orderData = resolvedOrderData;

  if (!orderData) {
    return res.status(200).json({
      success: false,
      message: "Order not found",
    });
  }

  const installment = await paymentModel.getInstallmentByIdForInsured(
    orderData.idKy,
    orderData.insuredUserId,
  );

  if (!installment) {
    return res.status(200).json({
      success: false,
      message: "Installment not found",
    });
  }

  const orderAmount = Math.round(Number(installment.SOTIENPHAIDONG || 0));

  if (callbackAmount !== orderAmount) {
    return res.status(200).json({
      success: false,
      message: "Invalid amount",
    });
  }

  try {
    const gatewayRef = `SEPAY-${String(parsedIpn.gatewayRef || orderId)}`;

    // Record payment in database
    await paymentModel.confirmInstallmentPayment({
      idKy: orderData.idKy,
      insuredUserId: orderData.insuredUserId,
      amount: orderAmount,
      gatewayRef,
      method: "SePay",
    });

    // Clean up order from memory
    if (orderId) {
      delete global.sepayOrders[orderId];
    }
    if (orderData.orderId && orderData.orderId !== orderId) {
      delete global.sepayOrders[orderData.orderId];
    }

    return res.status(200).json({
      success: true,
      message: "Confirmed",
    });
  } catch (error) {
    console.error("SePay IPN processing error:", error);
    return res.status(200).json({
      success: false,
      message: "Processing error",
    });
  }
});

module.exports = {
  createCheckoutSessionRules,
  confirmCheckoutSessionRules,
  reportTransferredPaymentRules,
  confirmAccountingPaymentRules,
  ipnNotificationRules,
  handleSePaySuccessRedirect,
  handleSePayErrorRedirect,
  handleSePayCancelRedirect,
  getPayments,
  getPaymentSummary,
  createCheckoutSession,
  confirmCheckoutSession,
  reportTransferredPayment,
  confirmAccountingPayment,
  ipnNotification,
};
