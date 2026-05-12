import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Calendar } from "../../components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover";
import { Badge } from "../../components/ui/badge";
import {
  CalendarIcon,
  Download,
  FileText,
  BarChart3,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { motion } from "motion/react";
import { useAuth } from "../../contexts/AuthContext";
import { getDashboardSummary } from "../../services/api";

const reportTypes = [
  {
    id: "revenue",
    name: "Báo cáo doanh thu",
    icon: DollarSign,
    description: "Phân tích chi tiết doanh thu theo kỳ",
  },
  {
    id: "payment",
    name: "Báo cáo thu phí",
    icon: TrendingUp,
    description: "Theo dõi thanh toán và chỉ số thu phí",
  },
  {
    id: "contracts",
    name: "Báo cáo hiệu suất hợp đồng",
    icon: FileText,
    description: "Thống kê số lượng và hiệu quả hợp đồng",
  },
  {
    id: "analysis",
    name: "Phân tích loại bảo hiểm",
    icon: BarChart3,
    description: "Phân bố theo từng nhóm bảo hiểm",
  },
];

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

export function ReportsPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [selectedReport, setSelectedReport] = useState(reportTypes[0].id);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [formatType, setFormatType] = useState("pdf");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadSummary() {
      if (!user) return;

      try {
        const data = await getDashboardSummary(user.role);
        if (isMounted) {
          setSummary(data);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadSummary();

    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    if (startDate && endDate) return;

    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    setStartDate((prev) => prev || monthStart);
    setEndDate((prev) => prev || today);
  }, [startDate, endDate]);

  const recentSnapshots = useMemo(() => {
    const contracts = summary?.recentContracts || [];
    const payments = summary?.recentPayments || [];

    return [
      ...contracts.slice(0, 2).map((contract: any) => ({
        title: `Hợp đồng ${contract.IDHOPDONG}`,
        type: "contracts",
        date: String(contract.NGAYBATDAU || "").slice(0, 10),
        note: `${contract.TENKHACHHANG} • ${contract.TENLOAI}`,
      })),
      ...payments.slice(0, 2).map((payment: any) => ({
        title: `Thanh toán ${payment.IDKY}`,
        type: "payment",
        date: String(payment.NGAYDONGPHI || payment.NGAYDENHAN || "").slice(
          0,
          10,
        ),
        note: `${Number(payment.SOTIEN || 0).toLocaleString("vi-VN")} • ${payment.PHUONGTHUC || "Chưa rõ"}`,
      })),
    ];
  }, [summary]);

  const handleGenerate = () => {
    if (!selectedReport) {
      setNotice("Vui lòng chọn loại báo cáo.");
      return;
    }

    const safeEndDate = endDate || new Date();
    const safeStartDate =
      startDate ||
      new Date(safeEndDate.getFullYear(), safeEndDate.getMonth(), 1);

    const rangeStart =
      safeStartDate.getTime() <= safeEndDate.getTime()
        ? safeStartDate
        : safeEndDate;
    const rangeEnd =
      safeStartDate.getTime() <= safeEndDate.getTime()
        ? safeEndDate
        : safeStartDate;

    setStartDate(rangeStart);
    setEndDate(rangeEnd);

    const report = reportTypes.find((item) => item.id === selectedReport);
    const rows: Array<Array<string | number>> = [
      ["Báo cáo tài chính bảo hiểm"],
      ["Loại báo cáo", report?.name || selectedReport],
      [
        "Khoảng thời gian",
        `${format(rangeStart, "yyyy-MM-dd")} -> ${format(rangeEnd, "yyyy-MM-dd")}`,
      ],
      ["Thời điểm tạo", new Date().toISOString()],
      [],
    ];

    if (selectedReport === "revenue") {
      rows.push(["Chỉ số", "Giá trị"]);
      rows.push(["Tổng số tiền", Number(summary?.payments?.TONGTIEN || 0)]);
      rows.push(["Đã thu", Number(summary?.payments?.DATHU || 0)]);
      rows.push(["Chưa thu", Number(summary?.payments?.CHUATHU || 0)]);
      rows.push(["Tổng phiếu", Number(summary?.payments?.TONGSOPHIEU || 0)]);
    } else if (selectedReport === "payment") {
      const recentPayments = summary?.recentPayments || [];
      rows.push(["Mã kỳ", "Ngày", "Số tiền", "Phương thức", "Trạng thái"]);
      recentPayments.forEach((payment: any) => {
        rows.push([
          payment.IDKY || "",
          String(payment.NGAYDONGPHI || payment.NGAYDENHAN || "").slice(0, 10),
          Number(payment.SOTIEN || 0),
          payment.PHUONGTHUC || "",
          payment.TRANGTHAI || "",
        ]);
      });
    } else if (selectedReport === "contracts") {
      const recentContracts = summary?.recentContracts || [];
      rows.push([
        "Mã hợp đồng",
        "Khách hàng",
        "Loại",
        "Ngày bắt đầu",
        "Trạng thái",
      ]);
      recentContracts.forEach((contract: any) => {
        rows.push([
          contract.IDHOPDONG || "",
          contract.TENKHACHHANG || "",
          contract.TENLOAI || "",
          String(contract.NGAYBATDAU || "").slice(0, 10),
          contract.TRANGTHAI || "",
        ]);
      });
    } else {
      const byType = summary?.contractsByType || [];
      rows.push(["Loại bảo hiểm", "Số hợp đồng"]);
      byType.forEach((item: any) => {
        rows.push([item.TENLOAI || "", Number(item.SOLUONG || 0)]);
      });
    }

    const csv = rows
      .map((row) => row.map((cell) => escapeCsvValue(cell)).join(","))
      .join("\r\n");

    const fileDate = new Date().toISOString().slice(0, 10);
    const fileBase = `${selectedReport}-report-${fileDate}`;
    // Export using CSV for compatibility across spreadsheet tools.
    downloadCsvFile(`${fileBase}.csv`, csv);

    if (formatType === "csv") {
      setNotice("Đã xuất báo cáo CSV thành công.");
    } else {
      setNotice("Đã xuất dạng CSV để mở bằng Excel hoặc Sheets.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display mb-2"
          style={{ fontSize: "2rem", fontWeight: 600 }}
        >
          Báo cáo tài chính
        </motion.h1>
        {notice ? (
          <p className="mt-2 text-sm text-muted-foreground">{notice}</p>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tạo báo cáo mới</CardTitle>
          <CardDescription>
            Chọn loại báo cáo, khoảng thời gian và định dạng xuất
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Loại báo cáo</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reportTypes.map((report) => (
                <button
                  key={report.id}
                  onClick={() => setSelectedReport(report.id)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedReport === report.id
                      ? "border-[#d97706] bg-[#d97706]/5"
                      : "border-border hover:border-[#d97706]/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        selectedReport === report.id
                          ? "bg-[#d97706] text-white"
                          : "bg-muted"
                      }`}
                    >
                      <report.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium mb-1">{report.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {report.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ngày bắt đầu</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Chọn ngày bắt đầu"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Ngày kết thúc</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Chọn ngày kết thúc"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Định dạng xuất</Label>
            <Select value={formatType} onValueChange={setFormatType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">Tài liệu PDF</SelectItem>
                <SelectItem value="excel">Bảng tính Excel</SelectItem>
                <SelectItem value="csv">Tệp CSV</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full gap-2"
          >
            <Download className="w-4 h-4" />
            Tạo báo cáo
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tổng quan dữ liệu </CardTitle>
          <CardDescription>
            Xem nhanh dữ liệu hiện có để lập báo cáo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground">Hợp đồng</p>
              <p className="font-display text-2xl font-semibold">
                {loading
                  ? "..."
                  : Number(summary?.contracts?.TONGHOPDONG || 0).toLocaleString(
                      "vi-VN",
                    )}
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground">Thanh toán</p>
              <p className="font-display text-2xl font-semibold">
                {loading
                  ? "..."
                  : Number(summary?.payments?.TONGSOPHIEU || 0).toLocaleString(
                      "vi-VN",
                    )}
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground">Tổng số tiền</p>
              <p className="font-display text-2xl font-semibold">
                {loading
                  ? "..."
                  : Number(summary?.payments?.TONGTIEN || 0).toLocaleString(
                      "vi-VN",
                    )}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {recentSnapshots.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Chưa có snapshot dữ liệu từ backend.
              </p>
            ) : (
              recentSnapshots.map((item, idx) => (
                <motion.div
                  key={`${item.title}-${idx}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center justify-between p-4 rounded-lg border border-border"
                >
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.note}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary">{item.type}</Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.date}
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
