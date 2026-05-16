import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  FileText,
  Download,
  BarChart3,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock3,
  X,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion } from "motion/react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  cancelAccountingPayment,
  confirmAccountingPayment,
  getDashboardSummary,
  getPayments,
} from "../../services/api";

function isAccountantConfirmed(payment: any) {
  const paymentStatus = String(
    payment?.TRANGTHAI_THANHTOAN || payment?.TRANGTHAI || "",
  ).toLowerCase();

  if (paymentStatus.includes("hủy") || paymentStatus.includes("huy")) {
    return false;
  }

  const confirmerId = Number(payment?.NGUOIXACNHAN);
  if (Number.isInteger(confirmerId) && confirmerId > 0) {
    return true;
  }

  const confirmedAt = String(payment?.NGAYXACNHAN || "").trim();
  if (confirmedAt) {
    return true;
  }

  return (
    paymentStatus.includes("đã xác nhận") ||
    paymentStatus.includes("da xac nhan") ||
    paymentStatus.includes("confirmed")
  );
}

function isAccountantCancelled(payment: any) {
  const paymentStatus = String(
    payment?.TRANGTHAI_THANHTOAN || payment?.TRANGTHAI || "",
  ).toLowerCase();

  return (
    paymentStatus.includes("đã hủy") ||
    paymentStatus.includes("da huy") ||
    paymentStatus.includes("hủy") ||
    paymentStatus.includes("huy")
  );
}

function getPaymentConfirmationState(payment: any) {
  if (!payment?.IDTHANHTOAN) {
    return {
      label: "Chưa thanh toán",
      tone: "bg-neutral-100 text-neutral-800",
    };
  }

  if (isAccountantConfirmed(payment)) {
    return {
      label: "Đã xác nhận",
      tone: "bg-status-active/10 text-status-active",
    };
  }

  if (isAccountantCancelled(payment)) {
    return {
      label: "Đã hủy",
      tone: "bg-status-expired/10 text-status-expired",
    };
  }

  return {
    label: "Chờ kế toán xác nhận",
    tone: "bg-status-pending/10 text-status-pending",
  };
}

function groupByMonth(records: any[], dateKey: string, amountKey?: string) {
  const monthMap = new Map<
    string,
    { month: string; revenue: number; expenses: number; count: number }
  >();

  records.forEach((record) => {
    const dateValue = String(record[dateKey] || "");
    if (!dateValue) return;

    const month = dateValue.slice(0, 7);
    const current = monthMap.get(month) || {
      month,
      revenue: 0,
      expenses: 0,
      count: 0,
    };
    current.count += 1;
    current.revenue += Number(record[amountKey || "SOTIEN"] || 0);
    monthMap.set(month, current);
  });

  return Array.from(monthMap.values()).sort((a, b) =>
    a.month.localeCompare(b.month),
  );
}

function escapeCsvValue(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
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

function buildAccountantExportCsv(summary: any, payments: any[]) {
  const rows: Array<Array<string | number>> = [
    ["Xuất dữ liệu bảng điều khiển tài chính"],
    ["Thời điểm xuất", new Date().toISOString()],
    [],
    ["Tổng quan"],
    ["Tổng hợp đồng", Number(summary?.contracts?.TONGHOPDONG || 0)],
    ["Hợp đồng hiệu lực", Number(summary?.contracts?.DANGHOATDONG || 0)],
    ["Tổng phiếu thanh toán", Number(summary?.payments?.TONGSOPHIEU || 0)],
    ["Tổng số tiền", Number(summary?.payments?.TONGTIEN || 0)],
    ["Đã thu", Number(summary?.payments?.DATHU || 0)],
    ["Chưa thu", Number(summary?.payments?.CHUATHU || 0)],
    [],
    [
      "Mã thanh toán",
      "Kỳ",
      "Hợp đồng",
      "Khách hàng",
      "Ngày",
      "Số tiền",
      "Phương thức",
      "Trạng thái",
      "Người xác nhận",
    ],
    ...payments.map((payment) => [
      payment.IDTHANHTOAN || "",
      payment.SOKY || payment.IDKY || "",
      payment.SOHOPDONG || "",
      payment.TENKHACHHANG || "",
      String(payment.NGAYTHANHTOAN || payment.NGAYDONGPHI || "").slice(0, 10),
      Number(payment.SOTIEN || 0),
      payment.PHUONGTHUC || "",
      payment.TRANGTHAI_THANHTOAN || payment.TRANGTHAI || "",
      payment.NGUOIXACNHAN || "",
    ]),
  ];

  return rows
    .map((row) => row.map((cell) => escapeCsvValue(cell)).join(","))
    .join("\r\n");
}

export function AccountantDashboard() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [summary, setSummary] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingPaymentId, setConfirmingPaymentId] = useState<number | null>(
    null,
  );
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!user) return;

      try {
        const [summaryData, paymentsData] = await Promise.all([
          getDashboardSummary(user.role),
          getPayments(user.role),
        ]);

        if (isMounted) {
          setSummary(summaryData);
          setPayments(paymentsData);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const stats = useMemo(() => {
    const contracts = summary?.contracts || {};
    const paymentSummary = summary?.payments || {};

    return [
      {
        label: "Tổng doanh thu",
        value: Number(paymentSummary.TONGTIEN || 0),
        change: "Tổng số tiền",
        trend: "up",
        icon: DollarSign,
        bgColor: "bg-[#fef3c7]",
        iconColor: "text-[#d97706]",
      },
      {
        label: "Hợp đồng hiệu lực",
        value: contracts.DANGHOATDONG || 0,
        change: "Đang hoạt động",
        trend: "up",
        icon: FileText,
        bgColor: "bg-[#fef3c7]",
        iconColor: "text-[#d97706]",
      },
      {
        label: "Khoản chờ thu",
        value: Number(paymentSummary.CHUATHU || 0),
        change: "Chưa thu tiền",
        trend: "down",
        icon: TrendingDown,
        bgColor: "bg-[#fef3c7]",
        iconColor: "text-[#d97706]",
      },
      {
        label: "Tỷ lệ thu phí",
        value: paymentSummary.TONGTIEN
          ? `${Math.round((Number(paymentSummary.DATHU || 0) / Number(paymentSummary.TONGTIEN)) * 100)}%`
          : "0%",
        change: "So với tổng tiền",
        trend: "up",
        icon: TrendingUp,
        bgColor: "bg-[#fef3c7]",
        iconColor: "text-[#d97706]",
      },
    ];
  }, [summary]);

  const normalizedPayments = useMemo(() => {
    return payments.map((p) => ({
      ...p,
      NGAYDONGPHI: p.NGAYDONGPHI || p.NGAYTHANHTOAN || p.NGAYDENHAN || "",
      SOTIEN: p.SOTIEN || p.SOTIENPHAIDONG || 0,
    }));
  }, [payments]);

  const monthlyData = useMemo(
    () => groupByMonth(normalizedPayments, "NGAYDONGPHI"),
    [normalizedPayments],
  );
  const contractsByType = summary?.contractsByType || [];
  const pendingPayments = useMemo(
    () =>
      payments.filter(
        (payment) =>
          payment.IDTHANHTOAN &&
          !isAccountantConfirmed(payment) &&
          !isAccountantCancelled(payment),
      ),
    [payments],
  );

  const searchKeyword = String(searchParams.get("q") || "")
    .toLowerCase()
    .trim();

  const filteredPendingPayments = useMemo(() => {
    if (!searchKeyword) return pendingPayments;

    return pendingPayments.filter((payment) => {
      const searchable = [
        payment.IDTHANHTOAN,
        payment.IDKY,
        payment.SOKY,
        payment.SOHOPDONG,
        payment.TENKHACHHANG,
        payment.TRANGTHAI,
        payment.NGAYTHANHTOAN,
        payment.PHUONGTHUC,
        payment.SOTIEN,
      ]
        .map((value) => String(value || "").toLowerCase())
        .join(" ");

      return searchable.includes(searchKeyword);
    });
  }, [pendingPayments, searchKeyword]);

  async function handleConfirmPayment(payment: any) {
    if (!user) return;

    const paymentId = Number(payment.IDTHANHTOAN);
    if (!Number.isInteger(paymentId) || paymentId <= 0) return;

    try {
      setConfirmingPaymentId(paymentId);
      setNotice("");
      await confirmAccountingPayment(String(paymentId), user.role);
      const refreshedPayments = await getPayments(user.role);
      setPayments(refreshedPayments);
      setNotice(`Đã xác nhận thanh toán kỳ ${payment.SOKY || payment.IDKY}.`);
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Không xác nhận được thanh toán",
      );
    } finally {
      setConfirmingPaymentId(null);
    }
  }

  async function handleCancelPayment(payment: any) {
    if (!user) return;

    const paymentId = Number(payment.IDTHANHTOAN);
    if (!Number.isInteger(paymentId) || paymentId <= 0) return;

    const confirmed = window.confirm(
      `Hủy thanh toán kỳ ${payment.SOKY || payment.IDKY}?`,
    );
    if (!confirmed) return;

    try {
      setConfirmingPaymentId(paymentId);
      setNotice("");
      await cancelAccountingPayment(paymentId, user.role);
      const refreshedPayments = await getPayments(user.role);
      setPayments(refreshedPayments);
      setNotice(`Đã hủy thanh toán kỳ ${payment.SOKY || payment.IDKY}.`);
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Không hủy được thanh toán",
      );
    } finally {
      setConfirmingPaymentId(null);
    }
  }

  function handleExportFinancialData() {
    const fileDate = new Date().toISOString().slice(0, 10);
    const csv = buildAccountantExportCsv(summary, payments);
    downloadCsvFile(`accountant-financial-report-${fileDate}.csv`, csv);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display mb-2"
            style={{ fontSize: "2rem", fontWeight: 600 }}
          >
            Bảng điều khiển tài chính
          </motion.h1>
          <p className="text-muted-foreground">
            Số liệu được tính từ dữ liệu backend.
          </p>
          {notice ? (
            <p className="mt-2 text-sm text-muted-foreground">{notice}</p>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Button className="gap-2" onClick={handleExportFinancialData}>
            <Download className="w-4 h-4" />
            Xuất CSV
          </Button>
          <Button
            className="gap-2"
            variant="secondary"
            onClick={() => {
              // Export CSV but download with .xls and Excel MIME type for direct open in Excel
              const fileDate = new Date().toISOString().slice(0, 10);
              const csv = buildAccountantExportCsv(summary, payments);
              const blob = new Blob(["\ufeff", csv], {
                type: "application/vnd.ms-excel",
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `accountant-financial-report-${fileDate}.xls`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
          >
            <Download className="w-4 h-4" />
            Xuất Excel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription>{stat.label}</CardDescription>
                <div
                  className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}
                >
                  <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div
                  className="font-display mb-1"
                  style={{ fontSize: "2rem", fontWeight: 600 }}
                >
                  {loading
                    ? "..."
                    : typeof stat.value === "number"
                      ? stat.value.toLocaleString("vi-VN")
                      : stat.value}
                </div>
                <div className="flex items-center gap-1 text-xs">
                  {stat.trend === "up" ? (
                    <TrendingUp className="w-3 h-3 text-status-active" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-status-expired" />
                  )}
                  <span
                    className={
                      stat.trend === "up"
                        ? "text-status-active"
                        : "text-status-expired"
                    }
                  >
                    {stat.change}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card id="confirm-payments">
        <CardHeader>
          <CardTitle>Các khoản chờ kế toán xác nhận</CardTitle>
          <CardDescription>
            Thanh toán đã ghi nhận nhưng chưa có kế toán xác nhận
          </CardDescription>
          {searchKeyword ? (
            <p className="text-xs text-muted-foreground">
              Đang lọc theo từ khóa: "{searchKeyword}"
            </p>
          ) : null}
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kỳ</TableHead>
                <TableHead>Hợp đồng</TableHead>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Ngày thanh toán</TableHead>
                <TableHead>Số tiền</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPendingPayments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-8 text-center text-muted-foreground"
                  >
                    Không có thanh toán nào đang chờ xác nhận.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPendingPayments
                  .slice(0, 8)
                  .map((payment: any, idx: number) => {
                    const confirmationState =
                      getPaymentConfirmationState(payment);

                    return (
                      <motion.tr
                        key={payment.IDTHANHTOAN || payment.IDKY}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <TableCell className="font-medium">
                          Kỳ {payment.SOKY}
                        </TableCell>
                        <TableCell>{payment.SOHOPDONG}</TableCell>
                        <TableCell>{payment.TENKHACHHANG}</TableCell>
                        <TableCell>
                          {String(payment.NGAYTHANHTOAN || "").slice(0, 10)}
                        </TableCell>
                        <TableCell>
                          {Number(payment.SOTIEN || 0).toLocaleString("vi-VN")}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={confirmationState.tone}
                          >
                            {confirmationState.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              className="gap-2"
                              disabled={
                                confirmingPaymentId ===
                                Number(payment.IDTHANHTOAN)
                              }
                              onClick={() => handleConfirmPayment(payment)}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              {confirmingPaymentId ===
                              Number(payment.IDTHANHTOAN)
                                ? "Đang xử lý..."
                                : "Xác nhận"}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="gap-2"
                              disabled={
                                confirmingPaymentId ===
                                Number(payment.IDTHANHTOAN)
                              }
                              onClick={() => handleCancelPayment(payment)}
                            >
                              <X className="w-4 h-4" />
                              Hủy xác nhận
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    );
                  })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Cash-flow chart removed per request */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Hợp đồng theo loại bảo hiểm</CardTitle>
            <CardDescription>Phân bổ hợp đồng đang hiệu lực</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {contractsByType.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Chưa có dữ liệu hợp đồng.
                </p>
              ) : (
                contractsByType.map((item: any, idx: number) => (
                  <motion.div
                    key={item.TENLOAI}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.TENLOAI}</span>
                      <span className="text-muted-foreground">
                        {item.SOLUONG} hợp đồng
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-role-accountant rounded-full"
                          style={{
                            width: `${Math.max(Number(item.SOLUONG || 0) * 10, 5)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Thao tác nhanh</CardTitle>
            <CardDescription>Tác vụ tài chính thường dùng</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              asChild
              className="w-full justify-start gap-3"
              variant="outline"
            >
              <Link to="/contracts">
                <FileText className="w-4 h-4" />
                Xem tất cả hợp đồng
              </Link>
            </Button>
            <Button
              asChild
              className="w-full justify-start gap-3"
              variant="outline"
            >
              <Link to="/payments">
                <DollarSign className="w-4 h-4" />
                Theo dõi thanh toán
              </Link>
            </Button>
            <Button
              className="w-full justify-start gap-3"
              variant="outline"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              <Clock3 className="w-4 h-4" />
              Khoản chờ xác nhận
            </Button>
            <Button
              asChild
              className="w-full justify-start gap-3"
              variant="outline"
            >
              <Link to="/reports">
                <BarChart3 className="w-4 h-4" />
                Tạo báo cáo
              </Link>
            </Button>
            <Button
              className="w-full justify-start gap-3"
              onClick={handleExportFinancialData}
            >
              <Download className="w-4 h-4" />
              Xuất dữ liệu tài chính
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
