import { useEffect, useMemo, useState } from "react";
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
  Shield,
  DollarSign,
  FileText,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Progress } from "../../components/ui/progress";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { getCustomerContracts, getCustomerPayments } from "../../services/api";
import {
  PageHeader,
  StatsCard,
  LoadingCard,
  EmptyState,
} from "../../components/common";

function getPaymentAmount(payment: any) {
  const isPaid = hasPaymentRecord(payment);

  if (isPaid) {
    return Number(payment?.SOTIEN || payment?.SOTIENPHAIDONG || 0);
  }

  return Number(payment?.SOTIENPHAIDONG || payment?.SOTIEN || 0);
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

function hasPaymentRecord(payment: any) {
  return Boolean(payment?.IDTHANHTOAN);
}

function getPaymentStatusLabel(payment: any) {
  if (!payment?.IDTHANHTOAN) {
    return "Chưa cập nhật";
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

function normalizeText(value: unknown) {
  const raw = String(value ?? "");
  if (!raw) return raw;

  let cleaned = raw
    .replace(/th\?i h\?n/gi, "thời hạn")
    .replace(/hi\?u l\?c/gi, "hiệu lực")
    .replace(/h\?t h\?n/gi, "hết hạn")
    .replace(/\?/g, "");

  const looksBroken = /Ã|Â|�/.test(cleaned);

  if (!looksBroken) return cleaned;

  try {
    const bytes = Uint8Array.from(cleaned, (char) => char.charCodeAt(0) & 0xff);
    return new TextDecoder("utf-8").decode(bytes);
  } catch {
    return cleaned;
  }
}

export function InsuredDashboard() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!user) return;

      try {
        const [contractsData, paymentsData] = await Promise.all([
          getCustomerContracts(user.id, user.role),
          getCustomerPayments(user.id, user.role),
        ]);

        if (isMounted) {
          setContracts(contractsData);
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

  const currentContract = contracts[0];
  const totalPaid = useMemo(
    () =>
      payments.reduce((sum, payment) => sum + Number(payment.SOTIEN || 0), 0),
    [payments],
  );
  const totalPayments = payments.length;
  const paidPayments = payments.filter(
    (payment) =>
      String(payment.TRANGTHAI || "")
        .toLowerCase()
        .includes("đã") ||
      String(payment.TRANGTHAI || "")
        .toLowerCase()
        .includes("da"),
  ).length;
  const progress =
    totalPayments > 0 ? Math.round((paidPayments / totalPayments) * 100) : 0;
  const nextPayment =
    payments.find(
      (payment) =>
        !String(payment.TRANGTHAI || "")
          .toLowerCase()
          .includes("đã") &&
        !String(payment.TRANGTHAI || "")
          .toLowerCase()
          .includes("da"),
    ) || payments[0];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Bảo hiểm của tôi"
        description="Quản lý hợp đồng, thanh toán và tình trạng bảo hiểm của bạn"
        action={
          <Button asChild className="gap-2 bg-[#0284c7] hover:bg-[#0272aa]">
            <Link to="/payments/sepay">
              <DollarSign className="w-4 h-4" />
              Thanh toán ngay
            </Link>
          </Button>
        }
      />

      {/* Main Coverage Card */}
      <Card className="border-[#0284c7]/20 bg-gradient-to-br from-[#0284c7]/5 to-transparent">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-[#0284c7]" />
                <CardTitle className="font-display text-2xl">
                  {loading
                    ? "Đang tải..."
                    : normalizeText(
                        currentContract?.TENLOAI || "Chưa có hợp đồng",
                      )}
                </CardTitle>
              </div>
              <CardDescription>
                {currentContract
                  ? `Hợp đồng ${currentContract.IDHOPDONG}`
                  : "Không có dữ liệu hợp đồng"}
              </CardDescription>
            </div>
            {currentContract && (
              <Badge className="bg-[#059669]/10 text-[#059669]">
                <CheckCircle className="w-3 h-3 mr-1" />
                {normalizeText(currentContract?.TRANGTHAI || "Hoạt động")}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i}>
                  <div className="h-4 bg-muted rounded w-20 mb-2" />
                  <div className="h-6 bg-muted rounded w-16" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Số hợp đồng
                  </p>
                  <p className="font-display text-2xl font-semibold">
                    {contracts.length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Tổng đã đóng
                  </p>
                  <p className="font-display text-2xl font-semibold">
                    {totalPaid.toLocaleString("vi-VN")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Kỳ phí</p>
                  <p className="font-semibold">
                    <span className="text-[#0284c7]">{paidPayments}</span>
                    <span className="text-muted-foreground">
                      /{totalPayments}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Tiến độ</p>
                  <p className="font-semibold">{progress}% hoàn thành</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Tiến độ thanh toán kỳ phí
                  </span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <Progress value={progress} className="h-3" />
              </div>
            </>
          )}

          {nextPayment && !loading && (
            <div className="flex items-center gap-4 p-4 bg-[#eab308]/10 rounded-lg border border-[#eab308]/30">
              <AlertCircle className="w-5 h-5 text-[#eab308] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">Kỳ phí tiếp theo</p>
                <p className="text-sm text-muted-foreground">
                  {getPaymentAmount(nextPayment).toLocaleString("vi-VN")} VND •{" "}
                  {String(nextPayment.NGAYDENHAN || "").slice(0, 10)}
                </p>
              </div>
              <Button asChild className="h-8 px-3 text-sm">
                <Link to="/payments/sepay">Thanh toán</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contract and Recent Payments Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contract Details */}
        <Card className="border-border/50">
          <CardHeader className="pb-4">
            <CardTitle>Chi tiết hợp đồng</CardTitle>
            {contracts.length > 0 && (
              <CardDescription>{contracts.length} hợp đồng</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-20 bg-muted rounded-lg" />
                ))}
              </div>
            ) : contracts.length === 0 ? (
              <EmptyState
                icon={<FileText className="w-8 h-8" />}
                title="Chưa có hợp đồng"
                description="Bạn chưa có hợp đồng bảo hiểm nào"
              />
            ) : (
              <div className="space-y-3">
                {contracts.map((c) => (
                  <div
                    key={c.IDHOPDONG}
                    className="p-3 rounded-lg border border-border hover:border-[#0284c7]/30 hover:bg-muted/50 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm">
                          {normalizeText(c.SOHOPDONG || `#${c.IDHOPDONG}`)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {normalizeText(c.TENLOAI)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {String(c.NGAYBATDAU || "").slice(0, 10)} →{" "}
                          {String(c.NGAYKETTHUC || "").slice(0, 10)}
                        </p>
                      </div>
                      <Button
                        asChild
                        className="h-8 px-3 text-sm bg-transparent text-foreground hover:bg-muted"
                      >
                        <Link to={`/contracts/${c.IDHOPDONG}`}>Chi tiết →</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card className="border-border/50">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Thanh toán gần đây</CardTitle>
                <CardDescription className="mt-1">
                  {payments.length} kỳ thanh toán
                </CardDescription>
              </div>
              <Button
                asChild
                className="h-8 px-3 text-sm bg-transparent text-foreground hover:bg-muted"
              >
                <Link to="/payments">Xem tất cả →</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted rounded-lg" />
                ))}
              </div>
            ) : payments.length === 0 ? (
              <EmptyState
                icon={<DollarSign className="w-8 h-8" />}
                title="Chưa có thanh toán"
                description="Lịch sử thanh toán của bạn sẽ hiển thị ở đây"
              />
            ) : (
              <div className="space-y-3">
                {payments.slice(0, 4).map((payment, idx) => (
                  <motion.div
                    key={payment.IDKY}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-[#0284c7]/30 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#0284c7]/10 flex items-center justify-center flex-shrink-0">
                        <DollarSign className="w-4 h-4 text-[#0284c7]" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm">
                          {getPaymentAmount(payment).toLocaleString("vi-VN")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {normalizeText(payment.PHUONGTHUC || "Chưa xác định")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <Badge
                        className={`text-xs ${getPaymentStatusTone(payment)}`}
                      >
                        {normalizeText(getPaymentStatusLabel(payment))}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {String(
                          payment.NGAYDONGPHI || payment.NGAYDENHAN || "",
                        ).slice(0, 10)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-[#0284c7]/10 bg-gradient-to-br from-[#0284c7]/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-[#0284c7]" />
            Thao tác nhanh
          </CardTitle>
          <CardDescription>Những hành động thường dùng nhất</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-3">
          <Button
            asChild
            className="gap-2 flex-1 bg-[#0284c7] hover:bg-[#0272aa]"
          >
            <Link to="/my-contract">
              <FileText className="w-4 h-4" />
              Xem hợp đồng đầy đủ
            </Link>
          </Button>
          <Button
            asChild
            className="gap-2 flex-1 border border-border bg-transparent text-foreground hover:bg-muted"
          >
            <Link to="/payments">
              <DollarSign className="w-4 h-4" />
              Lịch sử thanh toán
            </Link>
          </Button>
          <Button
            asChild
            className="gap-2 flex-1 border border-border bg-transparent text-foreground hover:bg-muted"
          >
            <Link to="/status">
              <Shield className="w-4 h-4" />
              Tình trạng bảo hiểm
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
