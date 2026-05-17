const { body, param, query } = require("express-validator");
const asyncHandler = require("../utils/asyncHandler");
const { getPool, sql } = require("../config/db");
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

async function writePaymentAuditLog(pool, userId, paymentId, action) {
  await pool
    .request()
    .input("IDNGUOIDUNG", sql.BigInt, userId || null)
    .input("TENBANG", sql.NVarChar(50), "THANHTOAN")
    .input("IDDULIEU", sql.BigInt, Number(paymentId))
    .input("HANHDONG", sql.NVarChar(20), action).query(`
      INSERT INTO NHATKY (IDNGUOIDUNG, TENBANG, IDDULIEU, HANHDONG, THOIGIAN)
      VALUES (@IDNGUOIDUNG, @TENBANG, @IDDULIEU, @HANHDONG, GETUTCDATE())
    `);
}

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

async function resolveSePayOrderContextFromDbByAmount(amount) {
  const normalizedAmount = Math.round(Number(amount || 0));
  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
    console.log(
      "[resolveSePayOrderContextFromDbByAmount] Invalid amount:",
      amount,
    );
    return null;
  }

  const pool = await getPool();

  // First, check if any installment with this amount exists
  const allInstallmentsResult = await pool
    .request()
    .input("SOTIEN", normalizedAmount).query(`
      SELECT TOP 5
        K.IDKY,
        NDB.IDNGUOIDUNG,
        K.SOTIENPHAIDONG,
        K.TRANGTHAI
      FROM KYDONGPHI K
      JOIN HOPDONG H ON K.IDHOPDONG = H.IDHOPDONG
      JOIN NGUOIDUOCBAOHIEM NDB ON H.IDNGUOIDUOCBH = NDB.IDNGUOIDUOCBH
      WHERE K.SOTIENPHAIDONG = @SOTIEN
      ORDER BY K.NGAYDENHAN ASC, K.IDKY ASC
    `);
  console.log(
    "[resolveSePayOrderContextFromDbByAmount] All installments with amount",
    normalizedAmount,
    ":",
    allInstallmentsResult.recordset.length,
    "found",
  );
  allInstallmentsResult.recordset.forEach((r) => {
    console.log(
      "  - IDKY:",
      r.IDKY,
      "IDNGUOIDUNG:",
      r.IDNGUOIDUNG,
      "TRANGTHAI:",
      r.TRANGTHAI,
    );
  });

  const result = await pool.request().input("SOTIEN", normalizedAmount).query(`
      SELECT TOP 1
        K.IDKY,
        NDB.IDNGUOIDUNG AS IDNGUOIDUNG,
        K.SOTIENPHAIDONG,
        K.NGAYDENHAN
      FROM KYDONGPHI K
      JOIN HOPDONG H ON K.IDHOPDONG = H.IDHOPDONG
      JOIN NGUOIDUOCBAOHIEM NDB ON H.IDNGUOIDUOCBH = NDB.IDNGUOIDUOCBH
      LEFT JOIN THANHTOAN T ON K.IDKY = T.IDKY
      WHERE K.SOTIENPHAIDONG = @SOTIEN
        AND (
          K.TRANGTHAI IS NULL
          OR K.TRANGTHAI NOT IN (N'Đã đóng', N'Đã xác nhận')
        )
      ORDER BY K.NGAYDENHAN ASC, K.IDKY ASC
    `);

  const row = result.recordset[0];
  if (!row) {
    console.log(
      "[resolveSePayOrderContextFromDbByAmount] No unpaid installment found with amount:",
      normalizedAmount,
    );
    return null;
  }

  console.log(
    "[resolveSePayOrderContextFromDbByAmount] Found installment - IDKY:",
    row.IDKY,
    "IDNGUOIDUNG:",
    row.IDNGUOIDUNG,
  );
  return {
    orderId: `DH${row.IDKY}-${row.IDNGUOIDUNG}`,
    idKy: Number(row.IDKY),
    insuredUserId: Number(row.IDNGUOIDUNG),
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
      "order.orderInvoiceNumber",
      "order[order_invoice_number]",
      "order.invoice_number",
      "order.invoiceNumber",
      "order.invoice_no",
      "order.invoiceNo",
      "order_invoice_number",
      "order.order_id",
      "order[order_id]",
      "order.orderId",
      "order_id",
      "invoice_number",
      "invoiceNumber",
      "invoice_no",
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
        "order.orderAmount",
        "order[order_amount]",
        "order.amount",
        "order.orderValue",
        "order_amount",
        "transaction.transaction_amount",
        "transaction.transactionAmount",
        "transaction[transaction_amount]",
        "transaction.amount",
        "transaction_amount",
        "amount",
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
      "code",
      "transaction.code",
      "transaction[code]",
      "transaction_code",
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

  const crypto = require("crypto");
  // Make order ref hard to guess: include random hex token
  const randomHex = crypto.randomBytes(6).toString("hex");
  const orderRef = `DH${idKy}-${insuredUserId}-${randomHex}`;

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
  const successUrl = `${process.env.SEPAY_REDIRECT_URL || `${frontendBaseUrl}/payments/success`}?payment=success&idKy=${idKy}&orderRef=${encodeURIComponent(orderRef)}&amount=${encodeURIComponent(amount)}`;
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

  // Record a pending payment so accountants can see/check it even if IPN or redirect is delayed
  try {
    await paymentModel.createPendingInstallmentPayment({
      idKy,
      insuredUserId,
      amount,
      gatewayRef: `SEPAY-CHECKOUT-${orderRef}`,
      method: "SePay",
      description: `Checkout initiated: ${orderRef}`,
      setPaidDate: false,
    });
  } catch (e) {
    // non-fatal: log and continue returning checkout info
    console.error(
      "Failed to create pending installment payment for checkout:",
      e,
    );
  }

  // Persist a lightweight checkout record so IPN can match after server restarts
  try {
    await paymentModel.createSePayCheckoutRecord({
      orderRef,
      idKy,
      insuredUserId,
      amount,
      gatewayOrderId: sepay.requestId || sepay.orderId || null,
    });
  } catch (e) {
    console.error("Failed to persist SePay checkout record:", e);
  }

  return success(
    res,
    {
      paymentUrl: appCheckoutUrl,
      // Only expose payUrl when it's actually a QR image URL. If the
      // gateway returned a checkout page URL (non-QR), don't expose it so
      // the frontend will open the internal `paymentUrl` first.
      payUrl: sepay.qrCodeUrl ? sepay.payUrl : undefined,
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
  // Always redirect back to the internal checkout page. Do NOT redirect
  // directly to the public success page because the redirect URL from
  // the payment gateway is not a reliable confirmation (IPN/webhook is).
  const targetPath = "/payments/sepay";
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
              setPaidDate: false,
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
  const fallbackOrderData =
    orderData || (await resolveSePayOrderContextFromDbByAmount(amount));

  if (!fallbackOrderData) {
    const error = new Error("Order not found");
    error.statusCode = 404;
    throw error;
  }

  const installment = await paymentModel.getInstallmentByIdForInsured(
    fallbackOrderData.idKy,
    fallbackOrderData.insuredUserId,
  );

  if (!installment) {
    const error = new Error("Installment not found");
    error.statusCode = 404;
    throw error;
  }

  const orderAmount = Math.round(Number(installment.SOTIENPHAIDONG || 0));

  // Verify amount and user
  if (
    amount !== orderAmount ||
    fallbackOrderData.insuredUserId !== insuredUserId
  ) {
    const error = new Error("Payment data does not match the order");
    error.statusCode = 403;
    throw error;
  }

  // Record payment in database
  await paymentModel.confirmInstallmentPayment({
    idKy: fallbackOrderData.idKy,
    insuredUserId: fallbackOrderData.insuredUserId,
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
  const pool = await getPool();
  await writePaymentAuditLog(pool, accountantId, paymentId, "XACNHANTHANHTOAN");

  return success(res, null, "Payment confirmed by accountant");
});

const cancelAccountingPayment = asyncHandler(async (req, res) => {
  const paymentId = Number(req.params?.id);
  const accountantId = Number(req.user?.id);

  await paymentModel.cancelPaymentByAccountant({ paymentId, accountantId });
  const pool = await getPool();
  await writePaymentAuditLog(
    pool,
    accountantId,
    paymentId,
    "HUYXACNHANTHANHTOAN",
  );

  return success(res, null, "Payment cancelled by accountant");
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

const recordManualBankTransfer = asyncHandler(async (req, res) => {
  // This endpoint allows accountants to manually record bank transfers
  // that come in with references not matching the checkout flow
  const accountantId = Number(req.user?.id);
  const { idKy, insuredUserId, amount, bankRef, description } = req.body;

  // Validate inputs
  if (!idKy || !insuredUserId || !amount || !bankRef) {
    const error = new Error(
      "Missing required fields: idKy, insuredUserId, amount, bankRef",
    );
    error.statusCode = 400;
    throw error;
  }

  const parsedIdKy = Number(idKy);
  const parsedInsuredUserId = Number(insuredUserId);
  const parsedAmount = Math.round(Number(amount || 0));

  if (!Number.isFinite(parsedIdKy) || parsedIdKy <= 0) {
    const error = new Error("Invalid idKy");
    error.statusCode = 400;
    throw error;
  }

  if (!Number.isFinite(parsedInsuredUserId) || parsedInsuredUserId <= 0) {
    const error = new Error("Invalid insuredUserId");
    error.statusCode = 400;
    throw error;
  }

  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    const error = new Error("Invalid amount");
    error.statusCode = 400;
    throw error;
  }

  const installment = await paymentModel.getInstallmentByIdForInsured(
    parsedIdKy,
    parsedInsuredUserId,
  );

  if (!installment) {
    const error = new Error("Installment not found");
    error.statusCode = 404;
    throw error;
  }

  const expectedAmount = Math.round(Number(installment.SOTIENPHAIDONG || 0));
  if (parsedAmount !== expectedAmount) {
    const error = new Error(
      `Amount mismatch: expected ${expectedAmount}, got ${parsedAmount}`,
    );
    error.statusCode = 400;
    throw error;
  }

  try {
    await paymentModel.createPendingInstallmentPayment({
      idKy: parsedIdKy,
      insuredUserId: parsedInsuredUserId,
      amount: parsedAmount,
      gatewayRef: `BANK-${bankRef}`,
      method: "Bank Transfer",
      description:
        description ||
        `Manual bank transfer recorded by accountant ${accountantId}`,
    });

    return success(
      res,
      {
        idKy: parsedIdKy,
        insuredUserId: parsedInsuredUserId,
        amount: parsedAmount,
        bankRef: bankRef,
        status: "Pending accountant confirmation",
      },
      "Manual bank transfer recorded successfully",
    );
  } catch (error) {
    console.error("Error recording manual bank transfer:", error);
    const err = new Error("Failed to record payment");
    err.statusCode = 500;
    throw err;
  }
});

const ipnNotification = asyncHandler(async (req, res) => {
  const payload = req.body && Object.keys(req.body).length > 0 ? req.body : {};

  const webhookApiKey = process.env.SEPAY_WEBHOOK_API_KEY || "";
  const authHeader = String(req.get("authorization") || "").trim();

  // If the payload contains a signature (or the request includes a signature header),
  // validate using HMAC-SHA256 as described in SePay docs. Otherwise, fall back to
  // the API key header authentication.
  const signatureInPayload = Boolean(
    payload &&
    (payload.signature || (payload.order && payload.order.signature)),
  );
  const signatureHeader = String(
    req.get("x-sepay-signature") || req.get("signature") || "",
  ).trim();

  if (signatureInPayload || signatureHeader) {
    // Verify HMAC signature against secret key. If invalid, reject.
    if (!verifySePayCallback(payload)) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid signature" });
    }
  } else {
    // Fallback: API key in Authorization header (Apikey <key> or raw key)
    if (!isValidSePayWebhookAuth(authHeader, webhookApiKey)) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }
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
  console.log(
    "[IPN] Processing webhook - orderId:",
    orderId,
    "amount:",
    callbackAmount,
    "isPaid:",
    parsedIpn.isPaid,
  );

  const resolvedOrderData =
    (orderId &&
      (global.sepayOrders?.[orderId] ||
        resolveSePayOrderContext(orderId, callbackAmount))) ||
    resolveSePayOrderContextByAmount(callbackAmount);
  const fallbackResolvedOrderData =
    resolvedOrderData ||
    (await resolveSePayOrderContextFromDbByAmount(callbackAmount));

  console.log(
    "[IPN] Resolved order - immediate:",
    resolvedOrderData,
    "fallback:",
    fallbackResolvedOrderData,
  );

  if (
    !parsedIpn.isPaid ||
    (!orderId && !fallbackResolvedOrderData) ||
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
  let orderData = fallbackResolvedOrderData;

  // If no order resolved from memory or installment lookup, try persisted SePay checkout records
  if (!orderData) {
    try {
      // First try matching by gateway order id (gatewayRef) if available -
      // some gateways include their internal transaction id but not our orderRef.
      let checkout = null;
      if (parsedIpn.gatewayRef) {
        try {
          checkout = await paymentModel.findSePayCheckoutByGatewayOrderId(
            parsedIpn.gatewayRef,
          );
        } catch (e) {
          console.error(
            "Error looking up SePay checkout by gateway order id:",
            e,
          );
        }
      }

      // Fallback to lookup by amount if gateway id didn't match
      if (!checkout) {
        checkout = await paymentModel.findSePayCheckoutByAmount(callbackAmount);
      }

      if (checkout) {
        orderData = {
          orderId: String(checkout.ORDER_REF || "").trim(),
          idKy: Number(checkout.IDKY || 0),
          insuredUserId: Number(checkout.IDNGUOIDUNG || 0),
          amount: Math.round(Number(checkout.AMOUNT || 0)),
        };

        // mark the persisted checkout as matched to avoid duplicate matching
        try {
          await paymentModel.markSePayCheckoutMatched({
            orderRef: checkout.ORDER_REF,
          });
        } catch (e) {
          console.error("Failed to mark SePay checkout matched:", e);
        }
      }
    } catch (e) {
      console.error("Error looking up persisted SePay checkout:", e);
    }
  }

  if (!orderData) {
    await paymentModel.createUnmatchedPayment({
      amount: callbackAmount,
      gatewayRef: `SEPAY-${String(parsedIpn.gatewayRef || orderId)}`,
      method: "SePay",
      note: `Unmatched SePay IPN: ${String(
        orderId ||
          parsedIpn.gatewayRef ||
          parsedIpn.debug?.notificationType ||
          "unknown",
      )}`,
    });
    return res.status(200).json({
      success: true,
      message: "Payment received and recorded for manual review",
    });
  }

  const installment = await paymentModel.getInstallmentByIdForInsured(
    orderData.idKy,
    orderData.insuredUserId,
  );

  if (!installment) {
    await paymentModel.createUnmatchedPayment({
      amount: callbackAmount,
      gatewayRef: `SEPAY-${String(parsedIpn.gatewayRef || orderId)}`,
      method: "SePay",
      note: `Unmatched SePay IPN: ${String(orderId || parsedIpn.gatewayRef || parsedIpn.debug?.notificationType || "unknown")}`,
    });
    return res.status(200).json({
      success: true,
      message: "Payment received and recorded for manual review",
    });
  }

  const orderAmount = Math.round(Number(installment.SOTIENPHAIDONG || 0));

  if (callbackAmount !== orderAmount) {
    await paymentModel.createUnmatchedPayment({
      amount: callbackAmount,
      gatewayRef: `SEPAY-${String(parsedIpn.gatewayRef || orderId)}`,
      method: "SePay",
      note: `Amount mismatch for installment ${String(orderData.idKy)}: expected ${orderAmount}, received ${callbackAmount}`,
    });
    return res.status(200).json({
      success: true,
      message: "Payment received and recorded for manual review",
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
  recordManualBankTransfer,
  confirmAccountingPayment,
  cancelAccountingPayment,
  ipnNotification,
};