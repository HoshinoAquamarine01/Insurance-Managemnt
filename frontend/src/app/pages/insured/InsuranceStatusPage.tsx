import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Progress } from "../../components/ui/progress";
import { Shield, AlertCircle } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../../contexts/AuthContext";
import { getCustomerContracts, getCustomerPayments } from "../../services/api";

const statusColors: Record<string, string> = {
  "còn thời hạn": "bg-status-active/10 text-status-active",
  "đang hiệu lực": "bg-status-active/10 text-status-active",
  "đã hết hạn": "bg-status-expired/10 text-status-expired",
  "hết hạn": "bg-status-expired/10 text-status-expired",
};

function normalizeText(value: unknown): string {
  const raw = String(value ?? "");
  if (!raw) return raw;

  // First, do direct replacements of known corrupted patterns
  let cleaned = raw
    .replace(/th\?i h\?n/gi, "thời hạn")
    .replace(/hi\?u l\?c/gi, "hiệu lực")
    .replace(/h\?t h\?n/gi, "hết hạn")
    .replace(/\?/g, ""); // Remove any remaining ?

  try {
    if (/Ã|Â|Æ|Ä|á|º|»|°|¿/.test(cleaned)) {
      const bytes = Uint8Array.from(
        cleaned,
        (char) => char.charCodeAt(0) & 0xff,
      );
      cleaned = new TextDecoder("utf-8").decode(bytes);
    }
  } catch {
    // Decode failed, keep cleaned version
  }

  return cleaned;
}

function normalizeStatus(value: unknown, endDate?: string) {
  let text = normalizeText(value).toLowerCase().trim();

  // Check if contract has passed end date - should be expired
  if (endDate) {
    const [year, month, day] = endDate.split("-");
    if (year && month && day) {
      const endLocalDate = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
      );
      const todayLocalDate = new Date();
      todayLocalDate.setHours(0, 0, 0, 0);

      if (endLocalDate < todayLocalDate) {
        return "Đã hết hạn";
      }
    }
  }

  // Replace corrupted patterns with clean text
  text = text
    .replace(/th\?i h\?n|thời hạn/, "thời hạn")
    .replace(/hiệu lực|hi\?u l\?c/, "hiệu lực")
    .replace(/hết hạn|h\?t h\?n/, "hết hạn")
    .replace(/đã|da/, "đã")
    .replace(/còn|c\?n/, "còn");

  if (
    (text.includes("còn") && text.includes("thời hạn")) ||
    text.includes("đang hiệu lực")
  ) {
    return "Còn thời hạn";
  }
  if (text.includes("đã") && text.includes("hết hạn")) {
    return "Đã hết hạn";
  }

  return normalizeText(value) || "Chưa cập nhật";
}

export function InsuranceStatusPage() {
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

  const totalPayments = payments.length;
  const paidPayments = useMemo(
    () =>
      payments.filter((payment) => {
        const status = normalizeText(payment.TRANGTHAI || "").toLowerCase();
        return status.includes("đã") || status.includes("da");
      }).length,
    [payments],
  );

  const progress =
    totalPayments > 0 ? Math.round((paidPayments / totalPayments) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display mb-2"
          style={{ fontSize: "2rem", fontWeight: 600 }}
        >
          Tình trạng bảo hiểm
        </motion.h1>
        <p className="text-muted-foreground">
          Theo dõi trạng thái hiệu lực hợp đồng bảo hiểm của bạn.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tiến độ hiệu lực bảo hiểm</CardTitle>
          <CardDescription>
            Mức độ hoàn thành nghĩa vụ thanh toán
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tiến độ thanh toán</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground">
            {paidPayments}/{totalPayments} kỳ phí đã thanh toán.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách trạng thái hợp đồng</CardTitle>
          <CardDescription>Tình trạng tất cả hợp đồng hiện có</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">Đang tải dữ liệu...</p>
          ) : contracts.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="w-4 h-4" />
              <span>Chưa có hợp đồng nào.</span>
            </div>
          ) : (
            contracts.map((contract, idx) => {
              const normalized = normalizeStatus(
                contract.TRANGTHAI,
                contract.NGAYKETTHUC,
              );
              const colorClass =
                statusColors[normalized.toLowerCase()] ||
                "bg-status-pending/10 text-status-pending";

              return (
                <motion.div
                  key={String(contract.IDHOPDONG)}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="border rounded-lg p-4 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-medium">
                      Hợp đồng #{contract.IDHOPDONG}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {normalizeText(contract.TENLOAI) || "Chưa cập nhật"} | Kết
                      thúc: {String(contract.NGAYKETTHUC || "").slice(0, 10)}
                    </p>
                  </div>
                  <Badge variant="secondary" className={colorClass}>
                    <Shield className="w-3 h-3 mr-1" />
                    {normalized}
                  </Badge>
                </motion.div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
