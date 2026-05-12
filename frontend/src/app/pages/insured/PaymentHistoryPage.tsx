import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
import { Input } from "../../components/ui/input";
import { DollarSign, Download, Calendar, CreditCard } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../../contexts/AuthContext";
import { VietQrCheckoutCard } from "../../components/payment/VietQrCheckoutCard";
import {
  createPaymentCheckoutSession,
  getPayments,
  getCustomerPayments,
  type VietQrCheckoutSessionResponse,
} from "../../services/api";

type CheckoutSessionState = VietQrCheckoutSessionResponse & {
  qrImageUrl?: string;
  accountNo?: string;
  transferContent?: string;
};

function hasPaymentRecord(payment: any) {
  return Boolean(payment?.IDTHANHTOAN);
}

function isAccountantConfirmed(payment: any) {
  const confirmerId = Number(payment?.NGUOIXACNHAN);
  if (Number.isInteger(confirmerId) && confirmerId > 0) {
    return true;
  }

  const confirmedAt = String(payment?.NGAYXACNHAN || "").trim();
  if (confirmedAt) {
    return true;
  }

  const paymentStatus = String(
    payment?.TRANGTHAI_THANHTOAN || payment?.TRANGTHAI || "",
  ).toLowerCase();

  return (
    paymentStatus.includes("đã xác nhận") ||
    paymentStatus.includes("da xac nhan") ||
    paymentStatus.includes("confirmed")
  );
}

function getPaymentAmount(payment: any) {
  const isPaid = hasPaymentRecord(payment);

  if (isPaid) {
    return Number(payment?.SOTIEN || payment?.SOTIENPHAIDONG || 0);
  }

  return Number(payment?.SOTIENPHAIDONG || payment?.SOTIEN || 0);
}

function getPaymentStatusLabel(payment: any) {
  if (!hasPaymentRecord(payment)) {
    return "Chưa thanh toán";
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

function isSettledPayment(payment: any) {
  if (hasPaymentRecord(payment)) {
    return true;
  }

  const status = String(payment?.TRANGTHAI || "").toLowerCase();
  return status.includes("đã") || status.includes("da");
}

function escapeCsvValue(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function buildPaymentExportCsv(payments: any[]) {
  const rows = [
    [
      "Mã thanh toán",
      "Ngày thanh toán",
      "Số tiền",
      "Phương thức",
      "Trạng thái",
    ],
    ...payments.map((payment) => [
      payment.IDKY,
      String(payment.NGAYTHANHTOAN || "").slice(0, 10),
      getPaymentAmount(payment).toLocaleString("vi-VN"),
      payment.PHUONGTHUC || "Chưa thanh toán",
      getPaymentStatusLabel(payment),
    ]),
  ];

  return rows
    .map((row) => row.map((cell) => escapeCsvValue(cell)).join(","))
    .join("\r\n");
}

function downloadCsvFile(filename: string, csv: string) {
  const blob = new Blob(["\ufeff", csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function getPaymentSortTime(payment: any) {
  const candidateDates = [
    payment?.NGAYTHANHTOAN,
    payment?.NGAYDONGPHI,
    payment?.NGAYDENHAN,
  ];

  for (const candidate of candidateDates) {
    const time = new Date(candidate || 0).getTime();
    if (Number.isFinite(time) && time > 0) {
      return time;
    }
  }

  return Number.MAX_SAFE_INTEGER;
}

function getDueDateTime(payment: any) {
  const dueTime = new Date(
    payment?.NGAYDENHAN || payment?.NGAYDONGPHI || 0,
  ).getTime();
  return Number.isFinite(dueTime) && dueTime > 0
    ? dueTime
    : Number.MAX_SAFE_INTEGER;
}

export function PaymentHistoryPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPaymentId, setProcessingPaymentId] = useState<number | null>(
    null,
  );
  const [checkoutSession, setCheckoutSession] =
    useState<CheckoutSessionState | null>(null);
  const [selectedIdKy, setSelectedIdKy] = useState<number | null>(null);
  const [notice, setNotice] = useState("");

  const searchKeyword = String(searchParams.get("q") || "")
    .toLowerCase()
    .trim();

  async function loadPayments(silent = false) {
    if (!user) return [];

    if (!silent) {
      setLoading(true);
    }

    try {
      const data =
        user.role === "accountant"
          ? await getPayments(user.role)
          : await getCustomerPayments(user.id, user.role);
      setPayments(data);
      return data;
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Không tải được dữ liệu thanh toán",
      );
      return [];
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    void loadPayments();
  }, [user]);

  async function handlePayInstallment(payment: any) {
    if (!user) return;

    const idKy = Number(payment.IDKY);
    if (!Number.isInteger(idKy) || idKy <= 0) return;

    try {
      setProcessingPaymentId(idKy);
      setNotice("");
      const response = await createPaymentCheckoutSession({ idKy }, user.role);
      const checkoutUrl =
        response.qrImageUrl ||
        response.qrUrl ||
        response.payUrl ||
        response.paymentUrl ||
        response.checkoutActionUrl ||
        "";

      if (!checkoutUrl) {
        setNotice("Không nhận được phiên thanh toán SePay. Vui lòng thử lại.");
        return;
      }

      setSelectedIdKy(idKy);
      setCheckoutSession({
        ...response,
        qrImageUrl: checkoutUrl,
        qrUrl: checkoutUrl,
        transferContent: String(
          response.transferContent ||
            response.requestId ||
            response.orderRef ||
            idKy,
        ),
      });

      setNotice(
        "Đã mở phiên SePay. Vui lòng quét QR, kiểm tra đúng số tiền và nội dung chuyển khoản. Hệ thống sẽ tự cập nhật khi webhook ghi nhận giao dịch.",
      );
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Không tạo được phiên thanh toán",
      );
    } finally {
      setProcessingPaymentId(null);
    }
  }

  useEffect(() => {
    if (!user || !checkoutSession || !selectedIdKy) {
      return;
    }

    let active = true;
    const timer = window.setInterval(async () => {
      const latest = await loadPayments(true);
      if (!active || !latest.length) {
        return;
      }

      const selected = latest.find(
        (entry) => Number(entry.IDKY) === Number(selectedIdKy),
      );

      if (selected && isSettledPayment(selected)) {
        setCheckoutSession(null);
        setSelectedIdKy(null);
        setNotice(
          "Giao dịch đã được hệ thống ghi nhận. Trạng thái thanh toán đã cập nhật tự động.",
        );
      }
    }, 4000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [checkoutSession, selectedIdKy, user]);

  function handleExportPayments() {
    if (!filteredPayments.length) return;

    const fileDate = new Date().toISOString().slice(0, 10);

    downloadCsvFile(
      `payment-records-${fileDate}.csv`,
      buildPaymentExportCsv(filteredPayments),
    );
  }

  function handleExportPayment(payment: any) {
    if (!payment) return;

    const paymentDate = String(
      payment.NGAYTHANHTOAN || payment.NGAYDONGPHI || payment.NGAYDENHAN || "",
    ).slice(0, 10);

    downloadCsvFile(
      `payment-record-${String(payment.IDKY || "unknown")}${paymentDate ? `-${paymentDate}` : ""}.csv`,
      buildPaymentExportCsv([payment]),
    );
  }

  const filteredPayments = useMemo(() => {
    const sourcePayments = payments.filter((payment) =>
      isSettledPayment(payment),
    );
    const sortedPayments = [...sourcePayments].sort(
      (left, right) => getPaymentSortTime(left) - getPaymentSortTime(right),
    );

    if (!searchKeyword) return sortedPayments;

    return sortedPayments.filter((payment) => {
      const searchable = [
        payment.IDTHANHTOAN,
        payment.IDKY,
        payment.SOHOPDONG,
        payment.PHUONGTHUC,
        payment.TRANGTHAI_THANHTOAN,
        payment.TRANGTHAI,
        payment.NGAYTHANHTOAN,
        payment.NGAYDONGPHI,
        payment.NGAYDENHAN,
        getPaymentAmount(payment),
      ]
        .map((value) => String(value || "").toLowerCase())
        .join(" ");

      return searchable.includes(searchKeyword);
    });
  }, [payments, searchKeyword, user?.role]);

  const unpaidPayments = useMemo(
    () =>
      [...payments]
        .filter((payment) => !isSettledPayment(payment))
        .sort((left, right) => getDueDateTime(left) - getDueDateTime(right)),
    [payments],
  );

  const selectedPayment = useMemo(
    () =>
      payments.find(
        (payment) => Number(payment.IDKY) === Number(selectedIdKy),
      ) || null,
    [payments, selectedIdKy],
  );

  const summary = useMemo(() => {
    const totalPaid = filteredPayments.reduce(
      (sum, payment) => sum + Number(payment.SOTIEN || 0),
      0,
    );
    const upcoming = filteredPayments[filteredPayments.length - 1] || null;

    return {
      totalPaid,
      count: filteredPayments.length,
      nextPayment: upcoming ? getPaymentAmount(upcoming) : 0,
      nextPaymentDate: upcoming
        ? String(upcoming.NGAYTHANHTOAN || "").slice(0, 10)
        : "",
    };
  }, [filteredPayments]);

  return (
    <div className="space-y-6">
      <div>
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display mb-2"
          style={{ fontSize: "2rem", fontWeight: 600 }}
        >
          Lịch sử thanh toán
        </motion.h1>
        <p className="text-muted-foreground">
          Lịch sử kỳ đóng phí lấy từ backend.
        </p>
        {notice ? (
          <p className="mt-2 text-sm text-muted-foreground">{notice}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tổng đã đóng</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="font-display"
              style={{ fontSize: "1.75rem", fontWeight: 600 }}
            >
              {loading ? "..." : summary.totalPaid.toLocaleString("vi-VN")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.count} lần thanh toán
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Số kỳ thanh toán</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="font-display"
              style={{ fontSize: "1.75rem", fontWeight: 600 }}
            >
              {loading ? "..." : summary.count}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Tổng số kỳ</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Lần thanh toán gần nhất</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="font-display"
              style={{ fontSize: "1.75rem", fontWeight: 600 }}
            >
              {loading ? "..." : summary.nextPayment.toLocaleString("vi-VN")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.nextPaymentDate || "Chưa có dữ liệu"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-role-insured/20 bg-gradient-to-br from-role-insured/5 to-transparent">
          <CardHeader className="pb-2">
            <CardDescription>Trạng thái thanh toán</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge className="bg-status-active/10 text-status-active">
              Đã thanh toán
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">
              Chỉ hiển thị các kỳ đã thanh toán
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thanh toán SePay trực tiếp</CardTitle>
          <CardDescription>
            Mở thanh toán ngay trong trang này. Quét QR, kiểm tra số tiền và nội
            dung chuyển khoản, hệ thống sẽ tự cập nhật khi webhook về.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {unpaidPayments.length === 0 ? (
            <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
              Hiện không có kỳ nào cần thanh toán.
            </div>
          ) : (
            <div className="space-y-3">
              {unpaidPayments.slice(0, 5).map((payment) => (
                <div
                  key={`unpaid-${payment.IDKY}`}
                  className="flex flex-col gap-3 rounded-xl border p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">
                      Kỳ {payment.SOKY || payment.IDKY} - HĐ{" "}
                      {payment.SOHOPDONG || "-"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Đến hạn:{" "}
                      {String(
                        payment.NGAYDENHAN || payment.NGAYDONGPHI || "",
                      ).slice(0, 10)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Số tiền:{" "}
                      {getPaymentAmount(payment).toLocaleString("vi-VN")} VND
                    </p>
                  </div>
                  <Button
                    className="gap-2"
                    disabled={processingPaymentId === Number(payment.IDKY)}
                    onClick={() => handlePayInstallment(payment)}
                  >
                    <CreditCard className="w-4 h-4" />
                    {processingPaymentId === Number(payment.IDKY)
                      ? "Đang tạo phiên SePay..."
                      : "Thanh toán SePay"}
                  </Button>
                </div>
              ))}
            </div>
          )}

          {checkoutSession ? (
            <div className="space-y-4">
              <VietQrCheckoutCard
                session={checkoutSession}
                onClose={() => {
                  setCheckoutSession(null);
                  setSelectedIdKy(null);
                }}
              />

              <div className="rounded-xl border border-dashed bg-background/70 p-4 text-sm text-muted-foreground">
                {selectedPayment ? (
                  <p>
                    Đang theo dõi kỳ{" "}
                    {selectedPayment.SOKY || selectedPayment.IDKY}. Trạng thái
                    sẽ tự cập nhật ngay sau khi webhook xác nhận giao dịch.
                  </p>
                ) : (
                  <p>
                    Hệ thống đang theo dõi cập nhật webhook cho giao dịch này.
                  </p>
                )}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Danh sách thanh toán</CardTitle>
              <CardDescription>
                Lịch sử đầy đủ của các kỳ đóng phí
              </CardDescription>
            </div>
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleExportPayments}
              disabled={loading || filteredPayments.length === 0}
            >
              <Download className="w-4 h-4" />
              Xuất dữ liệu
            </Button>
          </div>
          <div className="pt-3">
            <Input
              placeholder="Tìm theo kỳ, hợp đồng, phương thức, trạng thái..."
              value={searchParams.get("q") || ""}
              onChange={(e) => {
                const value = e.target.value;
                const nextParams = new URLSearchParams(searchParams);
                if (value.trim()) {
                  nextParams.set("q", value.trim());
                } else {
                  nextParams.delete("q");
                }
                setSearchParams(nextParams, { replace: true });
              }}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã thanh toán</TableHead>
                <TableHead>Ngày thanh toán</TableHead>
                <TableHead>Số tiền</TableHead>
                <TableHead>Phương thức thanh toán</TableHead>
                <TableHead className="text-right">Biên lai</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-muted-foreground"
                  >
                    Đang tải dữ liệu thanh toán...
                  </TableCell>
                </TableRow>
              ) : filteredPayments.length > 0 ? (
                filteredPayments.map((payment, idx) => (
                  <motion.tr
                    key={payment.IDKY}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <TableCell className="font-medium">
                      {payment.IDKY}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {String(
                          payment.NGAYTHANHTOAN ||
                            payment.NGAYDONGPHI ||
                            payment.NGAYDENHAN ||
                            "",
                        ).slice(0, 10)}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {getPaymentAmount(payment).toLocaleString("vi-VN")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-muted-foreground" />
                        {payment.PHUONGTHUC || "Chưa thanh toán"}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {isSettledPayment(payment) ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2"
                          onClick={() => handleExportPayment(payment)}
                        >
                          <Download className="w-4 h-4" />
                          Tải xuống
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="gap-2"
                          disabled={
                            processingPaymentId === Number(payment.IDKY)
                          }
                          onClick={() => handlePayInstallment(payment)}
                        >
                          <CreditCard className="w-4 h-4" />
                          {processingPaymentId === Number(payment.IDKY)
                            ? "Đang chuyển SePay..."
                            : "Thanh toán"}
                        </Button>
                      )}
                    </TableCell>
                  </motion.tr>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-muted-foreground"
                  >
                    Không có bản ghi thanh toán.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-status-pending/20 bg-gradient-to-br from-status-pending/5 to-transparent">
        <CardHeader>
          <CardTitle>Lần thanh toán gần nhất</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-status-pending/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-status-pending" />
              </div>
              <div>
                <p className="font-medium mb-1">
                  Thanh toán vào {summary.nextPaymentDate || "Chưa có dữ liệu"}
                </p>
                <p className="text-muted-foreground text-sm">
                  Số tiền: {summary.nextPayment.toLocaleString("vi-VN")}
                </p>
              </div>
            </div>
            <Button className="gap-2" disabled={true} onClick={() => undefined}>
              <CreditCard className="w-4 h-4" />
              Xem lịch sử
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
