import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  Banknote,
  Calendar,
  CheckCircle2,
  CreditCard,
  Landmark,
  ReceiptText,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import {
  createPaymentCheckoutSession,
  confirmPaymentCheckoutSession,
  getCustomerPayments,
  reportTransferredPayment,
  type VietQrCheckoutSessionResponse,
} from "../../services/api";
import { VietQrCheckoutCard } from "../../components/payment/VietQrCheckoutCard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";

function hasPaymentRecord(payment: any) {
  return Boolean(payment?.IDTHANHTOAN);
}

function isAccountantConfirmed(payment: any) {
  if (payment?.NGUOIXACNHAN) {
    return true;
  }

  const paymentStatus = String(
    payment?.TRANGTHAI_THANHTOAN || "",
  ).toLowerCase();
  return (
    paymentStatus.includes("kế toán xác nhận") ||
    paymentStatus.includes("ke toan xac nhan")
  );
}

function isPaidStatus(payment: any) {
  if (hasPaymentRecord(payment)) {
    return true;
  }

  const status = String(payment?.TRANGTHAI || "").toLowerCase();
  return status.includes("đã") || status.includes("da");
}

function getPaymentStatusLabel(payment: any) {
  if (!hasPaymentRecord(payment)) {
    return "Chưa đóng";
  }

  if (isAccountantConfirmed(payment)) {
    return "Đã xác nhận";
  }

  return "Chờ kế toán xác nhận";
}

function getPaymentStatusTone(payment: any) {
  if (!hasPaymentRecord(payment)) {
    return "bg-neutral-100 text-neutral-800";
  }

  if (isAccountantConfirmed(payment)) {
    return "bg-status-active/10 text-status-active";
  }

  return "bg-status-pending/10 text-status-pending";
}

function getDueAmount(payment: any) {
  if (isPaidStatus(payment)) {
    return Number(payment?.SOTIEN || payment?.SOTIENPHAIDONG || 0);
  }
  return Number(payment?.SOTIENPHAIDONG || payment?.SOTIEN || 0);
}

function normalizeText(value: unknown) {
  const raw = String(value ?? "");
  if (!/[ÃÂ�?]/.test(raw)) return raw;

  try {
    const bytes = Uint8Array.from(raw, (char) => char.charCodeAt(0) & 0xff);
    return new TextDecoder("utf-8").decode(bytes);
  } catch {
    return raw;
  }
}

function getSelectedPayment(payments: any[], idKy: number | null) {
  if (!idKy) return null;
  return payments.find((item) => Number(item.IDKY) === idKy) || null;
}

function getDueDateTime(payment: any) {
  const time = new Date(payment?.NGAYDENHAN || 0).getTime();
  return Number.isFinite(time) && time > 0 ? time : 0;
}

type CheckoutSessionResponse = VietQrCheckoutSessionResponse & {
  checkoutActionUrl?: string;
  checkoutFields?: Record<string, string>;
  qrCodeUrl?: string;
  payUrl?: string;
  paymentUrl?: string;
  bankCode?: string;
  requestId?: string;
  orderRef?: string;
};

type CheckoutSessionState = CheckoutSessionResponse & {
  qrImageUrl?: string;
  accountNo?: string;
  transferContent?: string;
};

export function InstallmentPaymentPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [reportingTransfer, setReportingTransfer] = useState(false);
  const [notice, setNotice] = useState("");
  const [checkoutSession, setCheckoutSession] =
    useState<null | CheckoutSessionState>(null);
  const [selectedIdKy, setSelectedIdKy] = useState<number | null>(null);
  const [pendingTransferReport, setPendingTransferReport] = useState<null | {
    idKy: number;
    orderRef?: string;
  }>(null);
  const checkoutSectionRef = useRef<HTMLDivElement | null>(null);
  const installmentsSectionRef = useRef<HTMLDivElement | null>(null);
  const autoReportedTransferRef = useRef<Set<string>>(new Set());

  function scrollTo(ref: React.RefObject<HTMLDivElement | null>) {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function loadPayments() {
    if (!user) return [];
    const data = await getCustomerPayments(user.id, user.role);
    setPayments(data);
    return data;
  }

  useEffect(() => {
    let active = true;

    async function init() {
      if (!user) return;
      try {
        await loadPayments();
      } catch (error) {
        if (active) {
          setNotice(
            error instanceof Error
              ? error.message
              : "Không tải được dữ liệu kỳ thanh toán",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    init();
    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const refetch = searchParams.get("refetch");
    const paymentResult = String(
      searchParams.get("payment") || "",
    ).toLowerCase();
    const callbackIdKy = Number(searchParams.get("idKy") || 0);
    const callbackOrderRef = String(searchParams.get("orderRef") || "").trim();

    // Handle refetch flag after payment redirect
    if (refetch === "1") {
      loadPayments().catch(() => {
        // Continue regardless of error
      });
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("refetch");
      setSearchParams(nextParams, { replace: true });
      return;
    }

    if (paymentResult) {
      if (paymentResult === "success") {
        if (Number.isInteger(callbackIdKy) && callbackIdKy > 0) {
          setPendingTransferReport({
            idKy: callbackIdKy,
            orderRef: callbackOrderRef || undefined,
          });
        }
        setNotice(
          "Thanh toán thành công. Nếu trạng thái chưa thanh toán, bấm 'Báo đã thanh toán' để kế toán xác nhận.",
        );

        loadPayments().catch(() => {});
      } else if (paymentResult === "cancel") {
        setNotice("Bạn đã hủy thanh toán trên cổng SePay.");
      } else {
        setNotice("Thanh toán thất bại. Vui lòng thử lại.");
      }

      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("payment");
      nextParams.delete("idKy");
      nextParams.delete("orderRef");
      setSearchParams(nextParams, { replace: true });
      return;
    }

    const orderId = searchParams.get("orderId");
    const resultCode = searchParams.get("resultCode");

    if (!orderId || resultCode == null) return;

    if (resultCode === "0") {
      setNotice("✓ Thanh toán SePay thành công! Hệ thống đang cập nhật...");

      // Call backend API to confirm payment
      if (user) {
        const amount = searchParams.get("amount") || "0";
        confirmPaymentCheckoutSession(
          {
            orderId,
            amount,
            resultCode,
          },
          user.role,
        )
          .then((response) => {
            console.log("Payment confirmed successfully");

            const successParams = new URLSearchParams({
              payment: "success",
              amount,
              orderRef: callbackOrderRef || orderId,
              timestamp: new Date().toISOString(),
            });

            const responseIdKy = Number(response?.IDKY || callbackIdKy || 0);
            if (Number.isInteger(responseIdKy) && responseIdKy > 0) {
              successParams.set("idKy", String(responseIdKy));
            }

            navigate(`/payments/success?${successParams.toString()}`, {
              replace: true,
            });
          })
          .catch((error) => {
            console.error("Payment confirmation error:", error);
          });
      }
    } else {
      setNotice("Bạn đã hủy hoặc thanh toán SePay thất bại.");
    }

    setSearchParams({}, { replace: true });
  }, [navigate, searchParams, setSearchParams, user]);

  useEffect(() => {
    if (!user || checkoutSession || processingId !== null) return;

    const idKyParam = Number(searchParams.get("idKy") || 0);
    if (!Number.isInteger(idKyParam) || idKyParam <= 0) return;

    const targetInstallment = payments.find(
      (item) => Number(item.IDKY) === idKyParam,
    );

    if (!targetInstallment) {
      setNotice("Không tìm thấy kỳ phí cần thanh toán.");
      const clearedParams = new URLSearchParams(searchParams);
      clearedParams.delete("idKy");
      setSearchParams(clearedParams, { replace: true });
      return;
    }

    if (isPaidStatus(targetInstallment)) {
      setNotice("Kỳ phí này đã được thanh toán.");
      const clearedParams = new URLSearchParams(searchParams);
      clearedParams.delete("idKy");
      setSearchParams(clearedParams, { replace: true });
      return;
    }

    handleCheckout(targetInstallment).finally(() => {
      const clearedParams = new URLSearchParams(searchParams);
      clearedParams.delete("idKy");
      setSearchParams(clearedParams, { replace: true });
    });
  }, [
    user,
    checkoutSession,
    processingId,
    payments,
    searchParams,
    setSearchParams,
  ]);

  useEffect(() => {
    if (!checkoutSession || !selectedIdKy) return undefined;

    let active = true;
    const timer = window.setInterval(async () => {
      if (!active || !user) return;

      try {
        const latestPayments = await loadPayments();
        const current = getSelectedPayment(latestPayments, selectedIdKy);

        console.log("Payment polling check:", {
          selectedIdKy,
          totalPayments: latestPayments.length,
          currentPayment: current
            ? {
                IDKY: current.IDKY,
                IDTHANHTOAN: current.IDTHANHTOAN,
                TRANGTHAI: current.TRANGTHAI,
                SOTIEN: current.SOTIEN,
              }
            : null,
          isPaidStatus: current ? isPaidStatus(current) : false,
        });

        if (current && isPaidStatus(current)) {
          window.clearInterval(timer);

          console.log("Payment detected! Redirecting to success page...", {
            selectedIdKy,
            amount: current.SOTIEN || current.SOTIENPHAIDONG || 0,
          });

          // Navigate to success page with payment info
          const successParams = new URLSearchParams({
            idKy: String(selectedIdKy),
            amount: String(current.SOTIEN || current.SOTIENPHAIDONG || 0),
            timestamp: new Date().toISOString(),
          });
          navigate(`/payments/success?${successParams.toString()}`, {
            replace: true,
          });
        }
      } catch (error) {
        console.error("Payment polling error:", error);
      }
    }, 1000); // Check every 1 second for faster feedback

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [checkoutSession, selectedIdKy, user, navigate]);

  // Auto-detect if payment was just processed by SePay webhook when page loads
  useEffect(() => {
    if (!user || payments.length === 0 || checkoutSession || selectedIdKy)
      return;

    // Check if there's any payment with IDTHANHTOAN that's recent (means SePay callback processed it)
    const recentPayment = payments.find((p) => {
      const hasRecord = hasPaymentRecord(p);
      const isNotConfirmed = !isAccountantConfirmed(p);
      const isRecent =
        new Date(p.NGAYTHANHTOAN || 0).getTime() > Date.now() - 120000; // Within 2 minutes

      return hasRecord && isNotConfirmed && isRecent;
    });

    if (recentPayment) {
      console.log(
        "Auto-detected recent SePay payment from webhook:",
        recentPayment.IDTHANHTOAN,
      );

      // Redirect to success page
      const successParams = new URLSearchParams({
        idKy: String(recentPayment.IDKY),
        amount: String(
          recentPayment.SOTIEN || recentPayment.SOTIENPHAIDONG || 0,
        ),
        timestamp: new Date(recentPayment.NGAYTHANHTOAN).toISOString(),
      });
      navigate(`/payments/success?${successParams.toString()}`, {
        replace: true,
      });
    }
  }, [payments, user, checkoutSession, selectedIdKy, navigate]);

  const unpaid = useMemo(
    () =>
      [...payments]
        .filter((item) => !isPaidStatus(item))
        .sort((left, right) => getDueDateTime(right) - getDueDateTime(left)),
    [payments],
  );

  const totalUnpaid = useMemo(
    () => unpaid.reduce((sum, item) => sum + getDueAmount(item), 0),
    [unpaid],
  );

  async function handleCheckout(item: any) {
    if (!user) return;

    const idKy = Number(item.IDKY);
    if (!Number.isInteger(idKy) || idKy <= 0) return;

    try {
      setProcessingId(idKy);
      setNotice("");
      const response = (await createPaymentCheckoutSession(
        { idKy },
        user.role,
      )) as CheckoutSessionResponse;

      const checkoutUrl =
        response.qrCodeUrl ||
        response.payUrl ||
        response.paymentUrl ||
        response.checkoutActionUrl ||
        "";
      if (!checkoutUrl) {
        setNotice("Không nhận được link thanh toán SePay.");
        return;
      }

      setSelectedIdKy(idKy);
      setCheckoutSession({
        sessionId: String(idKy),
        qrUrl: checkoutUrl,
        description: String(response.requestId || response.orderRef || idKy),
        qrImageUrl: checkoutUrl,
        bankCode: response.bankCode,
        accountNumber: response.accountNumber || "",
        accountNo: response.accountNumber,
        accountName: response.accountName,
        amount: response.amount,
        transferContent: String(
          response.requestId || response.orderRef || idKy,
        ),
        orderRef: response.orderRef,
      });

      setNotice(
        "Đã tạo phiên SePay. Sau khi chuyển khoản thành công, trang sẽ tự cập nhật.",
      );
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Không tạo được phiên thanh toán",
      );
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReportTransferredFromCallback() {
    if (!user || !pendingTransferReport) return;

    try {
      setReportingTransfer(true);
      await reportTransferredPayment(
        {
          idKy: pendingTransferReport.idKy,
          orderRef: pendingTransferReport.orderRef,
        },
        user.role,
      );
      await loadPayments();
      setNotice(
        "Đã gửi báo thanh toán cho kế toán. Kế toán sẽ thấy kỳ này để xác nhận.",
      );
      setPendingTransferReport(null);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Không gửi được báo thanh toán";

      if (/already paid|đã thanh toán/i.test(errorMessage)) {
        await loadPayments();
        setNotice("Thanh toán đã được ghi nhận trước đó.");
        setPendingTransferReport(null);
        return;
      }

      setNotice(
        `${errorMessage}. Bạn có thể bấm 'Báo đã thanh toán' để thử lại.`,
      );
    } finally {
      setReportingTransfer(false);
    }
  }

  useEffect(() => {
    if (!pendingTransferReport || !user || reportingTransfer) return;

    const reportKey = `${pendingTransferReport.idKy}:${pendingTransferReport.orderRef || ""}`;
    if (autoReportedTransferRef.current.has(reportKey)) {
      return;
    }

    autoReportedTransferRef.current.add(reportKey);
    void handleReportTransferredFromCallback();
  }, [pendingTransferReport, reportingTransfer, user]);

  async function handleReportTransferred() {
    if (!user || !selectedIdKy) return;

    try {
      setReportingTransfer(true);
      await reportTransferredPayment(
        {
          idKy: selectedIdKy,
          orderRef: checkoutSession?.orderRef,
        },
        user.role,
      );

      await loadPayments();
      setNotice(
        "Đã gửi thông báo thanh toán cho kế toán. Kế toán sẽ thấy kỳ này để xác nhận.",
      );
      setCheckoutSession(null);
      setSelectedIdKy(null);
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Không gửi được thông báo thanh toán",
      );
    } finally {
      setReportingTransfer(false);
    }
  }

  const selectedPayment = getSelectedPayment(payments, selectedIdKy);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-role-insured/10 via-background to-role-accountant/10 p-6 md:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.55),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.16),transparent_30%)] pointer-events-none" />
        <div className="relative grid gap-6 lg:grid-cols-[1.2fr_1fr] items-start">
          <div className="space-y-4">
            <motion.h1
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-4xl md:text-5xl font-semibold tracking-tight"
            >
              Thanh Toán Từng Kỳ
            </motion.h1>
            <p className="max-w-2xl text-muted-foreground text-base md:text-lg leading-7">
              Thanh toán SePay trực tiếp ngay trên trang này. Vui lòng quét mã
              QR, xác nhận đúng số tiền và nội dung chuyển khoản; trạng thái sẽ
              được cập nhật tự động khi webhook được ghi nhận.
            </p>
            {notice ? (
              <div className="flex flex-wrap items-center gap-2 rounded-full border bg-background/80 px-4 py-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-status-active" />
                <span>{notice}</span>
                {pendingTransferReport ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleReportTransferredFromCallback}
                    disabled={reportingTransfer}
                  >
                    {reportingTransfer ? "Đang gửi..." : "Báo đã thanh toán"}
                  </Button>
                ) : null}
              </div>
            ) : null}
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                className="rounded-full bg-background/80"
                onClick={() => {
                  if (checkoutSession) {
                    scrollTo(checkoutSectionRef);
                    return;
                  }

                  setNotice(
                    "Hãy chọn một kỳ phía dưới để mở khung thanh toán SePay.",
                  );
                  scrollTo(installmentsSectionRef);
                }}
              >
                <Landmark className="h-4 w-4 text-role-insured" />
                SePay Checkout
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-full bg-background/80"
                onClick={() => scrollTo(installmentsSectionRef)}
              >
                <ReceiptText className="h-4 w-4 text-role-insured" />
                Kỳ phí bảo hiểm
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card className="bg-background/80 backdrop-blur-sm h-full min-h-[170px]">
              <CardHeader className="pb-2">
                <CardDescription>Kỳ chưa đóng</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="font-display text-3xl">
                  {loading ? "..." : unpaid.length}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-background/80 backdrop-blur-sm h-full min-h-[170px]">
              <CardHeader className="pb-2">
                <CardDescription>Tổng cần thanh toán</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="font-display text-3xl">
                  {loading ? "..." : totalUnpaid.toLocaleString("vi-VN")}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-background/80 backdrop-blur-sm h-full min-h-[170px]">
              <CardHeader className="pb-2">
                <CardDescription>Cổng thanh toán</CardDescription>
              </CardHeader>
              <CardContent>
                <Badge className="bg-status-active/10 text-status-active">
                  <ShieldCheck className="w-3 h-3 mr-1" /> SePay Checkout
                </Badge>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {checkoutSession && selectedPayment ? (
        <div ref={checkoutSectionRef} className="space-y-4">
          <VietQrCheckoutCard
            session={checkoutSession}
            onClose={() => {
              setCheckoutSession(null);
              setSelectedIdKy(null);
            }}
            onReportTransferred={handleReportTransferred}
            reporting={reportingTransfer}
          />

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Kỳ đang thanh toán</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-display">
                  Kỳ {selectedPayment.IDKY}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedPayment.SOHOPDONG || selectedPayment.IDHOPDONG}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Trạng thái hiện tại</CardDescription>
              </CardHeader>
              <CardContent>
                {isPaidStatus(selectedPayment) ? (
                  <Badge className="bg-status-active/10 text-status-active">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Đã thanh toán
                  </Badge>
                ) : (
                  <Badge className="bg-status-pending/10 text-status-pending">
                    <ShieldCheck className="w-3 h-3 mr-1" /> Đang chờ webhook
                  </Badge>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Hành động</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button variant="secondary" onClick={() => loadPayments()}>
                  Tải lại trạng thái
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCheckoutSession(null);
                    setSelectedIdKy(null);
                  }}
                >
                  Đóng QR
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}

      <div ref={installmentsSectionRef}>
        <Card>
          <CardHeader>
            <CardTitle>Danh sách kỳ cần thanh toán</CardTitle>
            <CardDescription>
              Chọn kỳ phí muốn thanh toán. Hệ thống sẽ mở khung thanh toán SePay
              ngay trên trang.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Kỳ</TableHead>
                  <TableHead>Hợp đồng</TableHead>
                  <TableHead>Đến hạn</TableHead>
                  <TableHead>Số tiền</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-muted-foreground"
                    >
                      Đang tải dữ liệu...
                    </TableCell>
                  </TableRow>
                ) : unpaid.length > 0 ? (
                  unpaid.map((item, idx) => (
                    <motion.tr
                      key={item.IDKY}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <TableCell className="font-medium">{item.IDKY}</TableCell>
                      <TableCell>{item.SOHOPDONG || item.IDHOPDONG}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {String(item.NGAYDENHAN || "").slice(0, 10)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getDueAmount(item).toLocaleString("vi-VN")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={getPaymentStatusTone(item)}
                        >
                          {normalizeText(getPaymentStatusLabel(item))}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          className="gap-2"
                          size="sm"
                          onClick={() => handleCheckout(item)}
                          disabled={processingId === Number(item.IDKY)}
                        >
                          <CreditCard className="w-4 h-4" />
                          {processingId === Number(item.IDKY)
                            ? "Đang chuyển..."
                            : "Thanh toán"}
                        </Button>
                      </TableCell>
                    </motion.tr>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-muted-foreground"
                    >
                      Không có kỳ phí chưa thanh toán.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
