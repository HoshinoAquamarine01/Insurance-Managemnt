import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  FileText,
  Lock,
  Sparkles,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";
import { motion } from "motion/react";

import { useAuth } from "../../contexts/AuthContext";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";

const highlights = [
  {
    icon: FileText,
    title: "Quản lý hợp đồng tập trung",
    description:
      "Tạo, theo dõi và tra cứu toàn bộ hợp đồng trong một bảng điều khiển duy nhất.",
  },
  {
    icon: Lock,
    title: "Phân quyền rõ ràng",
    description:
      "Mỗi nhóm nghiệp vụ có không gian làm việc riêng, giới hạn truy cập đúng chức năng.",
  },
  {
    icon: BarChart3,
    title: "Báo cáo theo thời gian thực",
    description:
      "Theo dõi tăng trưởng hợp đồng, thanh toán và hiệu suất vận hành ngay trên dashboard.",
  },
];

const metrics = [
  { value: "5", label: "vai trò người dùng" },
  { value: "99.9%", label: "độ ổn định hệ thống" },
  { value: "24/7", label: "hỗ trợ vận hành" },
];

const trustItems = [
  "Bảo mật dữ liệu theo chuẩn doanh nghiệp",
  "Quy trình tạo hợp đồng nhanh, giảm thao tác lặp",
  "Theo dõi thanh toán và đối soát minh bạch",
];

const testimonials = [
  {
    quote:
      "Sau khi chuyển sang hệ thống này, đội vận hành giảm hơn 40% thời gian xử lý hồ sơ mới.",
    author: "Trưởng phòng Kinh doanh",
  },
  {
    quote:
      "Dashboard trực quan giúp ban giám sát nắm rủi ro và tiến độ xử lý theo ngày rất nhanh.",
    author: "Quản lý Giám sát",
  },
];

export function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="relative isolate overflow-hidden border-b border-border/70 bg-[linear-gradient(135deg,#f8faf8_0%,#edf4f1_42%,#f4f8fb_100%)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(16,185,129,0.16),transparent_28%),radial-gradient(circle_at_84%_14%,rgba(14,165,233,0.14),transparent_26%),radial-gradient(circle_at_50%_100%,rgba(15,23,42,0.05),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.46)_0%,rgba(255,255,255,0.2)_56%,rgba(248,250,252,0.66)_100%)]" />
        <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute -right-24 top-16 h-80 w-80 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-64 w-[42rem] -translate-x-1/2 rounded-full bg-slate-900/5 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-6 py-12 lg:px-10">
          <div className="mb-8 flex items-center justify-between gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="mr-auto">
              <p className="text-xs uppercase tracking-[0.32em] text-muted-foreground">
                Hệ thống quản lý bảo hiểm
              </p>
              <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
                Trang chủ
              </h1>
            </div>
            <Button asChild variant="outline" className="rounded-full px-5">
              <Link to="/login">Đăng nhập</Link>
            </Button>
          </div>

          <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl"
            >
              <Badge
                variant="outline"
                className="mb-5 rounded-full border-emerald-700/20 bg-white/70 px-4 py-1.5 text-xs uppercase tracking-[0.24em] text-emerald-800 shadow-sm backdrop-blur"
              >
                <Sparkles className="mr-1 h-3.5 w-3.5" />
                Nền tảng vận hành bảo hiểm thế hệ mới
              </Badge>
              <h2 className="font-display text-4xl font-semibold tracking-tight text-balance md:text-6xl md:leading-[1.08]">
                Biến quy trình bảo hiểm phức tạp thành trải nghiệm mượt và đáng
                tin.
              </h2>
              <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground md:text-lg">
                Từ tạo hợp đồng, theo dõi thanh toán đến giám sát hiệu suất đội
                ngũ. Mọi thứ được tổ chức trong một không gian trực quan, giúp
                doanh nghiệp tăng tốc tăng trưởng mà vẫn kiểm soát rủi ro.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="rounded-full bg-[#0f766e] px-6 hover:bg-[#115e59]"
                >
                  <Link to="/login">
                    Bắt đầu ngay
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>

              {isAuthenticated ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  Bạn đã đăng nhập rồi. Đi thẳng đến{" "}
                  <Link
                    className="font-medium text-foreground underline underline-offset-4"
                    to="/dashboard"
                  >
                    dashboard
                  </Link>
                  .
                </p>
              ) : null}

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {metrics.map((metric) => (
                  <Card
                    key={metric.label}
                    className="border-border/70 bg-white/78 shadow-lg shadow-slate-900/5 backdrop-blur"
                  >
                    <CardContent className="p-5">
                      <div className="font-display text-3xl font-semibold tracking-tight text-[#0f766e]">
                        {metric.value}
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {metric.label}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="mt-7 space-y-2">
                {trustItems.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.12 }}
              className="relative"
            >
              <div className="absolute -inset-6 rounded-[2rem] bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.18),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(14,165,233,0.16),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.55),rgba(255,255,255,0.18))] blur-2xl" />
              <Card className="relative overflow-hidden border-border/70 bg-white/78 shadow-2xl shadow-slate-900/10 backdrop-blur-xl">
                <CardHeader className="border-b border-border/60 pb-5">
                  <CardTitle className="font-display text-2xl font-semibold">
                    Trải nghiệm làm việc đồng bộ cho toàn đội ngũ
                  </CardTitle>
                  <CardDescription>
                    Thiết kế tối ưu cho hợp đồng, kế toán, giám sát và khách
                    hàng.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  {highlights.map((item, index) => {
                    const Icon = item.icon;

                    return (
                      <motion.div
                        key={item.title}
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          duration: 0.45,
                          delay: 0.18 + index * 0.08,
                        }}
                        className="group flex gap-4 rounded-2xl border border-border/70 bg-background/70 p-4 transition-colors hover:border-emerald-700/30"
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 transition-colors group-hover:bg-emerald-100">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-medium">{item.title}</h3>
                          <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}

                  <div className="mt-1 rounded-2xl border border-border/70 bg-white p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4 text-[#0284c7]" />
                      <p className="text-sm font-medium">Khách hàng nói gì?</p>
                    </div>
                    <div className="space-y-3">
                      {testimonials.map((item) => (
                        <div
                          key={item.author}
                          className="rounded-xl bg-slate-50 p-3"
                        >
                          <div className="mb-1 flex items-center gap-1 text-amber-500">
                            <Star className="h-3.5 w-3.5 fill-current" />
                            <Star className="h-3.5 w-3.5 fill-current" />
                            <Star className="h-3.5 w-3.5 fill-current" />
                            <Star className="h-3.5 w-3.5 fill-current" />
                            <Star className="h-3.5 w-3.5 fill-current" />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            "{item.quote}"
                          </p>
                          <p className="mt-1 text-xs font-medium text-foreground">
                            {item.author}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
