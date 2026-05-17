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
  FilePlus,
  FileText,
  Clock,
  CheckCircle,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { getDashboardSummary } from "../../services/api";
import {
  PageHeader,
  StatsCard,
  LoadingCard,
  EmptyState,
} from "../../components/common";

export function CreatorDashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  const stats = useMemo(() => {
    const contracts = summary?.contracts || {};

    return [
      {
        label: "Tổng hợp đồng",
        value: contracts.TONGHOPDONG ?? 0,
        change: "Tổng dữ liệu",
        icon: FileText,
        bgColor: "bg-[#d1fae5]",
        iconColor: "text-[#047857]",
      },
      {
        label: "Đang hiệu lực",
        value: contracts.DANGHOATDONG ?? 0,
        change: "Đang hoạt động",
        icon: CheckCircle,
        bgColor: "bg-[#d1fae5]",
        iconColor: "text-[#059669]",
      },
      // Removed 'Chờ duyệt' and 'Bản nháp' metrics per request
    ];
  }, [summary]);

  const recentContracts = summary?.recentContracts ?? [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Bảng điều khiển"
        description="Tổng quan về hợp đồng và các số liệu chính của bạn"
        action={
          <Button asChild className="gap-2 bg-[#047857] hover:bg-[#036d4f]">
            <Link to="/contracts/create">
              <FilePlus className="w-4 h-4" />
              Tạo hợp đồng mới
            </Link>
          </Button>
        }
      />

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

      <Card className="border-[#047857]/10 bg-gradient-to-br from-[#047857]/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#047857]" />
            Thao tác nhanh
          </CardTitle>
          <CardDescription>Những hành động thường dùng nhất</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-3">
          <Button
            asChild
            className="gap-2 flex-1 bg-[#047857] hover:bg-[#036d4f]"
          >
            <Link to="/contracts/create">
              <FilePlus className="w-4 h-4" />
              Tạo hợp đồng mới
            </Link>
          </Button>
          <Button variant="outline" asChild className="gap-2 flex-1">
            <Link to="/contracts">
              <FileText className="w-4 h-4" />
              Xem tất cả hợp đồng
            </Link>
          </Button>
          <Button variant="outline" asChild className="gap-2 flex-1">
            <Link to="/contracts/history">
              <Clock className="w-4 h-4" />
              Xem lịch sử
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Hợp đồng gần đây</CardTitle>
              <CardDescription className="mt-1">
                {recentContracts.length} hợp đồng tạo gần đây
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/contracts">Xem tất cả →</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentContracts.length === 0 ? (
            <EmptyState
              icon={<FileText className="w-8 h-8" />}
              title="Chưa có hợp đồng"
              description="Tạo hợp đồng đầu tiên của bạn để bắt đầu"
              action={{
                label: "Tạo hợp đồng",
                onClick: () => {
                  window.location.href = "/contracts/create";
                },
              }}
            />
          ) : (
            <div className="space-y-3">
              {recentContracts.map((contract: any, idx: number) => (
                <motion.div
                  key={contract.IDHOPDONG}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-[#047857]/30 hover:bg-muted/40 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-semibold text-sm text-foreground">
                        {contract.IDHOPDONG}
                      </p>
                      {(() => {
                        const status = String(contract.TRANGTHAI || "")
                          .toLowerCase()
                          .trim();

                        let statusClass = "bg-muted text-muted-foreground";
                        let displayStatus =
                          contract.TRANGTHAI || "Chưa cập nhật";

                        if (
                          status.includes("còn") ||
                          status.includes("đang") ||
                          status.includes("hieu luc") ||
                          status.includes("hiệu lực")
                        ) {
                          statusClass = "bg-[#d1fae5] text-[#047857]";
                        } else if (
                          status.includes("chờ") ||
                          status.includes("cho")
                        ) {
                          statusClass = "bg-[#fef3c7] text-[#d97706]";
                        } else if (
                          status.includes("hết") ||
                          status.includes("het")
                        ) {
                          statusClass = "bg-[#fee2e2] text-[#b91c1c]";
                        } else if (
                          status.includes("hủy") ||
                          status.includes("huy") ||
                          status.includes("huỷ")
                        ) {
                          // Canceled: use a prominent red tone
                          statusClass = "bg-[#fee2e2] text-[#b91c1c]";
                          // Normalize display text to Vietnamese
                          if (status.includes("đã") || status.includes("da")) {
                            displayStatus = "Đã hủy";
                          } else {
                            displayStatus = "Hủy";
                          }
                        }

                        return (
                          <Badge
                            variant="secondary"
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass}`}
                          >
                            {displayStatus}
                          </Badge>
                        );
                      })()}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">
                        {contract.TENKHACHHANG}
                      </span>
                      {" • "}
                      <span>{contract.TENLOAI}</span>
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-medium text-sm">
                      {contract.TENNHANVIEN}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {String(contract.NGAYBATDAU).slice(0, 10)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
