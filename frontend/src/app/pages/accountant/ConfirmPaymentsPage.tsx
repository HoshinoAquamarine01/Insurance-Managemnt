import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import { CheckCircle2, DollarSign, Search, ArrowLeft } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { confirmAccountingPayment, getPayments } from "../../services/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";

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

  return {
    label: "Chờ kế toán xác nhận",
    tone: "bg-status-pending/10 text-status-pending",
  };
}

export function ConfirmPaymentsPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
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
        const data = await getPayments(user.role);
        if (isMounted) {
          setPayments(data);
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

  const pendingPayments = useMemo(() => {
    return payments.filter(
      (payment) => payment.IDTHANHTOAN && !isAccountantConfirmed(payment),
    );
  }, [payments]);

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
      await confirmAccountingPayment(paymentId, user.role);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display mb-2"
            style={{ fontSize: "2rem", fontWeight: 600 }}
          >
            Xác nhận thanh toán
          </motion.h1>
          <p className="text-muted-foreground">
            Chỉ hiển thị các khoản thanh toán đã ghi nhận nhưng chưa được kế
            toán xác nhận.
          </p>
          {notice ? (
            <p className="mt-2 text-sm text-muted-foreground">{notice}</p>
          ) : null}
        </div>

        <Button variant="outline" asChild>
          <Link to="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại dashboard
          </Link>
        </Button>
      </div>

      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchParams.get("q") || ""}
                placeholder="Tìm theo mã thanh toán, kỳ, hợp đồng, khách hàng..."
                className="pl-10"
                onChange={(event) => {
                  const value = event.target.value;
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
            <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm text-muted-foreground md:min-w-[240px]">
              <div className="flex items-center gap-2 text-foreground">
                <DollarSign className="h-4 w-4" />
                <span className="font-medium">
                  {loading ? "..." : pendingPayments.length} khoản chờ xác nhận
                </span>
              </div>
              <p className="mt-1 text-xs">
                Danh sách này chỉ gồm các khoản chưa có kế toán xác nhận.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full" id="confirm-payments">
        <CardHeader>
          <CardTitle>Các khoản chờ kế toán xác nhận</CardTitle>
          <CardDescription>
            Thanh toán đã ghi nhận nhưng chưa có kế toán xác nhận
          </CardDescription>
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
                <TableHead className="text-right">Xác nhận</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-8 text-center text-muted-foreground"
                  >
                    Đang tải dữ liệu...
                  </TableCell>
                </TableRow>
              ) : filteredPendingPayments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-8 text-center text-muted-foreground"
                  >
                    Không có thanh toán nào đang chờ xác nhận.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPendingPayments.map((payment: any, idx: number) => {
                  const confirmationState =
                    getPaymentConfirmationState(payment);

                  return (
                    <motion.tr
                      key={payment.IDTHANHTOAN || payment.IDKY}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
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
                        <Button
                          size="sm"
                          className="gap-2"
                          disabled={
                            confirmingPaymentId === Number(payment.IDTHANHTOAN)
                          }
                          onClick={() => handleConfirmPayment(payment)}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          {confirmingPaymentId === Number(payment.IDTHANHTOAN)
                            ? "Đang xác nhận..."
                            : "Xác nhận"}
                        </Button>
                      </TableCell>
                    </motion.tr>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
