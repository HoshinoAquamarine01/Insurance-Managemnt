import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, ArrowRight, Calendar, DollarSign } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../../contexts/AuthContext";
import { reportTransferredPayment } from "../../services/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";

export function PaymentSuccessPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [paymentInfo, setPaymentInfo] = useState<{
    idKy?: string;
    amount?: string;
    timestamp?: string;
  }>({});
  const [statusMessage, setStatusMessage] = useState(
    "Hệ thống đã ghi nhận thanh toán của bạn",
  );
  const [reporting, setReporting] = useState(false);
  const reportedRef = useRef(false);

  useEffect(() => {
    // Extract payment info from URL params if available
    const idKy = searchParams.get("idKy") ?? undefined;
    const amount = searchParams.get("amount") ?? undefined;
    const timestamp = searchParams.get("timestamp") ?? undefined;

    setPaymentInfo({ idKy, amount, timestamp });

    // Auto-redirect after 5 seconds
    const timer = setTimeout(() => {
      navigate("/payments?refetch=1", { replace: true });
    }, 5000);

    return () => clearTimeout(timer);
  }, [searchParams, navigate]);

  useEffect(() => {
    const paymentResult = String(
      searchParams.get("payment") || "",
    ).toLowerCase();
    const idKy = Number(searchParams.get("idKy") || 0);
    const orderRef = String(searchParams.get("orderRef") || "").trim();

    if (paymentResult !== "success") {
      return;
    }

    if (!user || !Number.isInteger(idKy) || idKy <= 0 || reportedRef.current) {
      return;
    }

    let active = true;
    reportedRef.current = true;
    setReporting(true);
    setStatusMessage("Đang tạo yêu cầu thanh toán để kế toán xác nhận...");

    reportTransferredPayment({ idKy, orderRef }, user.role)
      .then(() => {
        if (active) {
          setStatusMessage(
            "Đã tạo yêu cầu thanh toán. Kế toán sẽ thấy giao dịch này để xác nhận.",
          );
        }
      })
      .catch((error) => {
        if (active) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Không tạo được yêu cầu thanh toán";
          setStatusMessage(
            /already paid|đã thanh toán/i.test(errorMessage)
              ? "Thanh toán đã được ghi nhận trước đó."
              : `${errorMessage}. Bạn vẫn có thể xem lịch sử thanh toán sau khi chuyển hướng.`,
          );
        }
      })
      .finally(() => {
        if (active) {
          setReporting(false);
        }
      });

    return () => {
      active = false;
    };
  }, [searchParams, user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center pt-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mb-4 flex justify-center"
            >
              <CheckCircle2 className="w-16 h-16 text-green-500" />
            </motion.div>
            <CardTitle className="text-2xl font-bold text-green-600">
              Thanh toán thành công!
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {statusMessage}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-blue-50 rounded-lg p-4 space-y-3"
            >
              {paymentInfo.idKy && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Kỳ phí:</span>
                  <Badge variant="secondary" className="font-mono">
                    #{paymentInfo.idKy}
                  </Badge>
                </div>
              )}

              {paymentInfo.amount && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Số tiền:
                  </span>
                  <span className="font-semibold text-green-600">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(Number(paymentInfo.amount))}
                  </span>
                </div>
              )}

              {paymentInfo.timestamp && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Thời gian:
                  </span>
                  <span className="text-sm text-slate-600">
                    {new Date(paymentInfo.timestamp).toLocaleString("vi-VN")}
                  </span>
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-amber-50 border border-amber-200 rounded-lg p-4"
            >
              <p className="text-sm text-amber-900">
                <strong>Lưu ý:</strong> Kế toán sẽ xác nhận thanh toán của bạn
                trong thời gian sớm nhất. Bạn có thể theo dõi trạng thái trong
                mục Lịch sử thanh toán.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center text-sm text-slate-500"
            >
              Chuyển hướng sau 5 giây...
            </motion.div>

            <Button
              onClick={() => navigate("/payments", { replace: true })}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Xem lịch sử thanh toán
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            <Button
              onClick={() => navigate("/my-contract", { replace: true })}
              variant="outline"
              className="w-full"
            >
              Quay lại dashboard
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}