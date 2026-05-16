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
  Eye,
  Shield,
  FileText,
  CheckCircle2,
  TrendingUp,
  Users,
  Activity,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { getDashboardSummary, getContracts } from "../../services/api";
import { PageHeader, StatsCard, LoadingCard } from "../../components/common";

function buildMonthSeries(records: any[], dateKey: string) {
  const map = new Map<string, { month: string; value: number }>();

  records.forEach((record) => {
    const dateValue = String(record[dateKey] || "");
    if (!dateValue) return;
    const month = dateValue.slice(0, 7);
    const current = map.get(month) || { month, value: 0 };
    current.value += 1;
    map.set(month, current);
  });

  return Array.from(map.values()).sort((a, b) =>
    a.month.localeCompare(b.month),
  );
}

export function SupervisorDashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [allContracts, setAllContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!user) return;

      try {
        const [summaryData, contractsData] = await Promise.all([
          getDashboardSummary(user.role),
          getContracts(user.role),
        ]);

        if (isMounted) {
          setSummary(summaryData);
          setAllContracts(contractsData);
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
    const payments = summary?.payments || {};
    return [
      {
        label: "Tổng hợp đồng",
        value: contracts.TONGHOPDONG ?? 0,
        change: "Tổng dữ liệu",
        icon: FileText,
        bgColor: "bg-[#ede9fe]",
        iconColor: "text-[#7c3aed]",
      },
      {
        label: "Hợp đồng hiệu lực",
        value: contracts.DANGHOATDONG ?? 0,
        change: "Đang hoạt động",
        icon: Shield,
        bgColor: "bg-[#d1fae5]",
        iconColor: "text-[#059669]",
      },
      {
        label: "Số kì đã đóng",
        value: payments.KIYADONG ?? 0,
        change: "Kỳ thanh toán",
        icon: CheckCircle2,
        bgColor: "bg-[#e0f2fe]",
        iconColor: "text-[#0284c7]",
      },
      {
        label: "Nhân viên lập HĐ",
        value: summary?.employees?.TONGNHANVIEN ?? 0,
        change: "Tổng nhân viên",
        icon: Users,
        bgColor: "bg-[#d1fae5]",
        iconColor: "text-[#047857]",
      },
    ];
  }, [summary]);

  const contractStatusData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const validContracts = allContracts.filter((contract) => {
      const endDate = new Date(contract.NGAYKETTHUC);
      endDate.setHours(0, 0, 0, 0);
      return endDate >= today;
    }).length;

    const expiredContracts = allContracts.filter((contract) => {
      const endDate = new Date(contract.NGAYKETTHUC);
      endDate.setHours(0, 0, 0, 0);
      return endDate < today;
    }).length;

    return [
      { name: "Còn hạn", value: validContracts, color: "#10b981" },
      { name: "Hết hạn", value: expiredContracts, color: "#ef4444" },
    ];
  }, [allContracts]);

  const insuranceTypeData = useMemo(() => {
    const map = new Map<string, number>();
    allContracts.forEach((contract) => {
      const key = String(contract.TENLOAI || "Chưa rõ");
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries()).map(([type, count]) => ({ type, count }));
  }, [allContracts]);

  const recentActivities = useMemo(() => {
    const recentContracts = (summary?.recentContracts || [])
      .slice(0, 2)
      .map((contract: any) => ({
        action: "Tạo hợp đồng mới",
        user: contract.TENNHANVIEN || contract.TENKHACHHANG || "N/A",
        time: String(contract.NGAYBATDAU || "").slice(0, 10),
        type: "create",
      }));

    const recentPayments = (summary?.recentPayments || [])
      .slice(0, 2)
      .map((payment: any) => ({
        action: "Nhận thanh toán",
        user: payment.TENKHACHHANG || "N/A",
        time: String(payment.NGAYDONGPHI || payment.NGAYDENHAN || "").slice(
          0,
          10,
        ),
        type: "payment",
      }));

    return [...recentContracts, ...recentPayments];
  }, [summary]);

  const userActivityData = useMemo(
    () => buildMonthSeries(summary?.recentPayments || [], "NGAYDONGPHI"),
    [summary],
  );

  const actionIcons: Record<string, any> = {
    create: FileText,
    approve: Shield,
    payment: TrendingUp,
    update: Activity,
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Bảng điều khiển giám sát"
        description="Theo dõi toàn bộ hệ thống, hợp đồng, thanh toán và hiệu suất"
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          <LoadingCard count={4} />
        ) : (
          stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <StatsCard
                label={stat.label}
                value={stat.value}
                description={stat.change}
                icon={<stat.icon className="w-5 h-5" />}
                bgColor={stat.bgColor}
                iconColor={stat.iconColor}
              />
            </motion.div>
          ))
        )}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contract Status Distribution */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#7c3aed]" />
              Trạng thái hợp đồng
            </CardTitle>
            <CardDescription>
              Phân bố hợp đồng theo hạn hữu hiệu
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-80 bg-muted rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={contractStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {contractStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} hợp đồng`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Insurance Type Distribution removed per request */}
      </div>

      {/* Quick Actions */}
      <Card className="border-[#7c3aed]/10 bg-gradient-to-br from-[#7c3aed]/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-[#7c3aed]" />
            Thao tác nhanh
          </CardTitle>
          <CardDescription>Điều hướng nhanh đến các mục chính</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-3">
          <Button
            asChild
            className="gap-2 flex-1 bg-[#7c3aed] hover:bg-[#6d28d9]"
          >
            <Link to="/contracts">
              <FileText className="w-4 h-4" />
              Xem tất cả hợp đồng
            </Link>
          </Button>

          <Button variant="outline" asChild className="gap-2 flex-1">
            <Link to="/contracts">
              <Eye className="w-4 h-4" />
              Chi tiết hợp đồng
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
