function buildVietQrImageUrl({
  bankCode,
  accountNo,
  accountName,
  amount,
  addInfo,
  template = "compact2",
}) {
  const normalizedBankCode = String(bankCode || "").trim();
  const normalizedAccountNo = String(accountNo || "").trim();
  const normalizedAccountName = String(accountName || "").trim();

  if (!normalizedBankCode || !normalizedAccountNo) {
    const error = new Error(
      "Missing VietQR configuration. Set VIETQR_BANK_CODE and VIETQR_ACCOUNT_NO in backend .env.",
    );
    error.statusCode = 500;
    throw error;
  }

  const query = new URLSearchParams();
  if (Number.isFinite(Number(amount)) && Number(amount) > 0) {
    query.set("amount", String(Math.round(Number(amount))));
  }
  if (addInfo) {
    query.set("addInfo", String(addInfo));
  }
  if (normalizedAccountName) {
    query.set("accountName", normalizedAccountName);
  }

  return `https://img.vietqr.io/image/${encodeURIComponent(normalizedBankCode)}-${encodeURIComponent(normalizedAccountNo)}-${encodeURIComponent(template)}.png?${query.toString()}`;
}

function createVietQrCheckout({ amount, addInfo, template }) {
  const bankCode = process.env.VIETQR_BANK_CODE || "";
  const accountNo = process.env.VIETQR_ACCOUNT_NO || "";
  const accountName = process.env.VIETQR_ACCOUNT_NAME || "";
  const imageUrl = buildVietQrImageUrl({
    bankCode,
    accountNo,
    accountName,
    amount,
    addInfo,
    template: process.env.VIETQR_TEMPLATE || template || "compact2",
  });

  return {
    paymentUrl: imageUrl,
    qrImageUrl: imageUrl,
    bankCode,
    accountNo,
    accountName,
    amount: Math.round(Number(amount) || 0),
    transferContent: String(addInfo || "").trim(),
  };
}

module.exports = {
  buildVietQrImageUrl,
  createVietQrCheckout,
};
