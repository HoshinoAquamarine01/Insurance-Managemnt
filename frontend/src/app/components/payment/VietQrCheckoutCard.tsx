import { useState } from "react";
import { Copy, QrCode, X } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import type { VietQrCheckoutSessionResponse } from "../../services/api";

type VietQrCheckoutCardProps = {
  session: VietQrCheckoutSessionResponse | null;
  onClose?: () => void;
  onReportTransferred?: () => void;
  reporting?: boolean;
};

export function VietQrCheckoutCard({
  session,
  onClose,
  onReportTransferred,
  reporting = false,
}: VietQrCheckoutCardProps) {
  const [copied, setCopied] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (!session) return null;
  const checkoutSession = session;

  async function copyTransferContent() {
    try {
      await navigator.clipboard.writeText(
        checkoutSession.transferContent || "",
      );
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Card className="border-role-insured/20 bg-gradient-to-br from-role-insured/5 to-transparent">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge className="mb-2 bg-role-insured/10 text-role-insured">
              <QrCode className="w-3 h-3 mr-1" /> VietQR
            </Badge>
            <CardTitle className="font-display">
              Quét mã để chuyển khoản
            </CardTitle>
          </div>
          {onClose ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Đóng"
            >
              <X className="w-4 h-4" />
            </Button>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground">
          Mở app ngân hàng và quét mã QR bên dưới. Nội dung chuyển khoản phải
          giữ nguyên để kế toán đối soát.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 lg:grid-cols-[280px_1fr] items-start">
          <div className="rounded-2xl border bg-background p-3 shadow-sm flex items-center justify-center">
            {!imageError ? (
              <img
                src={checkoutSession.qrImageUrl || checkoutSession.qrUrl || ""}
                alt="VietQR checkout"
                className="w-full max-w-[260px] rounded-xl"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="p-4 text-center">
                <p className="mb-2 text-sm text-muted-foreground">
                  Không thể tải mã QR tại đây.
                </p>
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const url =
                        checkoutSession.qrImageUrl ||
                        checkoutSession.qrUrl ||
                        "";
                      if (url) window.open(url, "_blank");
                    }}
                  >
                    Mở QR trong tab mới
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4 text-sm">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border bg-background/60 p-3">
                <p className="text-muted-foreground">Ngân hàng</p>
                <p className="font-medium">
                  {checkoutSession.bankCode || "Chưa cấu hình"}
                </p>
              </div>
              <div className="rounded-xl border bg-background/60 p-3">
                <p className="text-muted-foreground">Số tài khoản</p>
                <p className="font-medium">
                  {checkoutSession.accountNo ||
                    checkoutSession.accountNumber ||
                    "Chưa cấu hình"}
                </p>
              </div>
              <div className="rounded-xl border bg-background/60 p-3 sm:col-span-2">
                <p className="text-muted-foreground">Tên người nhận</p>
                <p className="font-medium">
                  {checkoutSession.accountName || "Chưa cấu hình"}
                </p>
              </div>
              <div className="rounded-xl border bg-background/60 p-3">
                <p className="text-muted-foreground">Số tiền</p>
                <p className="font-medium">
                  {checkoutSession.amount.toLocaleString("vi-VN")} VND
                </p>
              </div>
              <div className="rounded-xl border bg-background/60 p-3">
                <p className="text-muted-foreground">Nội dung CK</p>
                <p className="font-medium break-all">
                  {checkoutSession.transferContent ||
                    checkoutSession.description ||
                    ""}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-dashed bg-background/50 p-3">
              <p className="text-muted-foreground mb-1">Hướng dẫn</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>1. Quét mã bằng app ngân hàng.</li>
                <li>2. Kiểm tra đúng số tiền và nội dung chuyển khoản.</li>
                <li>
                  3. Sau khi chuyển xong, hệ thống sẽ chờ kế toán xác nhận.
                </li>
              </ul>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={copyTransferContent} className="gap-2">
                <Copy className="w-4 h-4" />
                {copied ? "Đã sao chép" : "Sao chép nội dung"}
              </Button>
              <Button
                variant="outline"
                onClick={onReportTransferred}
                disabled={!onReportTransferred || reporting}
              >
                {reporting ? "Đang gửi..." : "Tôi đã chuyển khoản"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
