import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import {
  Shield,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  Star,
} from "lucide-react";
import { motion } from "motion/react";
import { Link, useNavigate } from "react-router-dom";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(username, password);
      navigate("/dashboard");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Đăng nhập thất bại");
      console.error("Đăng nhập thất bại:", error);
    } finally {
      setLoading(false);
    }
  };

  const quickLoginOptions = [
    {
      role: "Người lập hợp đồng",
      username: "creator@insurance.vn",
      bgColor: "bg-[#d1fae5]",
      textColor: "text-[#047857]",
      hoverBorderColor: "hover:border-[#047857]",
    },
    {
      role: "Người được bảo hiểm",
      username: "insured@insurance.vn",
      bgColor: "bg-[#dbeafe]",
      textColor: "text-[#0284c7]",
      hoverBorderColor: "hover:border-[#0284c7]",
    },
    {
      role: "Kế toán",
      username: "accountant@insurance.vn",
      bgColor: "bg-[#fef3c7]",
      textColor: "text-[#d97706]",
      hoverBorderColor: "hover:border-[#d97706]",
    },
    {
      role: "Giám sát",
      username: "supervisor@insurance.vn",
      bgColor: "bg-[#ede9fe]",
      textColor: "text-[#7c3aed]",
      hoverBorderColor: "hover:border-[#7c3aed]",
    },
    {
      role: "Quản trị viên",
      username: "admin@insurance.vn",
      bgColor: "bg-[#e5e7eb]",
      textColor: "text-[#111827]",
      hoverBorderColor: "hover:border-[#111827]",
    },
  ];

  return (
    <div className="min-h-screen flex bg-[linear-gradient(135deg,#faf7f2_0%,#f5f7fb_100%)]">
      {/* Left side - Branding */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:w-1/2 bg-[linear-gradient(160deg,#0f172a_0%,#132238_40%,#0f766e_100%)] text-primary-foreground p-12 flex-col justify-between relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(56,189,248,0.18),transparent_24%),radial-gradient(circle_at_82%_78%,rgba(16,185,129,0.22),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0)_100%)]" />
        <div className="absolute inset-0 opacity-18 [background-image:linear-gradient(to_right,rgba(255,255,255,0.14)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.14)_1px,transparent_1px)] [background-size:56px_56px]" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-16 left-16 w-72 h-72 bg-emerald-300/40 rounded-full blur-3xl" />
          <div className="absolute bottom-16 right-10 w-[28rem] h-[28rem] bg-sky-300/35 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1
                className="font-display tracking-tight"
                style={{ fontSize: "1.75rem", fontWeight: 600 }}
              >
                Bảo hiểm
              </h1>
              <p className="opacity-80" style={{ fontSize: "0.95rem" }}>
                Hệ thống quản lý
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <Badge className="mb-4 border border-white/10 bg-white/10 text-white backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 mr-1" /> Được tin dùng bởi các đội
            ngũ bảo hiểm
          </Badge>
          <h2
            className="font-display mb-4 text-balance"
            style={{ fontSize: "3rem", fontWeight: 600, lineHeight: 1.12 }}
          >
            Chào mừng trở lại.
            <br />
            Quản lý bảo hiểm thông minh hơn mỗi ngày.
          </h2>
          <p
            className="opacity-80 max-w-md"
            style={{ fontSize: "1.2rem", lineHeight: 1.65 }}
          >
            Tối ưu toàn bộ quy trình hợp đồng và thanh toán với giao diện trực
            quan, bảo mật cao và tốc độ xử lý ổn định.
          </p>

          <div className="mt-8 space-y-3 max-w-md">
            <div className="flex items-center gap-2 text-[0.98rem] text-white/90">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              Theo dõi hợp đồng tập trung theo vai trò
            </div>
            <div className="flex items-center gap-2 text-[0.98rem] text-white/90">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              Đối soát thanh toán minh bạch với SePay
            </div>
            <div className="flex items-center gap-2 text-[0.98rem] text-white/90">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              Dashboard vận hành theo thời gian thực
            </div>
          </div>
        </div>

        <div className="relative z-10 opacity-60 text-sm">
          © 2026 Hệ thống quản lý bảo hiểm. Bảo lưu mọi quyền.
        </div>
      </motion.div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-[28rem]"
        >
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h2
                  className="font-display tracking-tight"
                  style={{ fontSize: "1.25rem", fontWeight: 600 }}
                >
                  Bảo hiểm
                </h2>
              </div>
            </div>
          </div>

          <Card className="border-border/80 bg-white/96 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl">
            <CardHeader className="space-y-2 pb-6">
              <Badge
                variant="outline"
                className="mb-2 w-fit rounded-full border-emerald-700/20 bg-emerald-50 px-3 py-1 text-emerald-800"
              >
                Bảo mật đăng nhập
              </Badge>
              <CardTitle
                className="font-display"
                style={{ fontSize: "2.125rem", fontWeight: 600 }}
              >
                Chào mừng trở lại
              </CardTitle>
              <CardDescription className="text-base leading-7">
                Đăng nhập để tiếp tục làm việc với hợp đồng, thanh toán và báo
                cáo.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm">
                    Tên đăng nhập
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Nhập tên đăng nhập"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm">
                      Mật khẩu
                    </Label>
                    <Link
                      to="/forgot-password"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Quên mật khẩu?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Đang đăng nhập..." : "Đăng nhập"}
                </Button>

                {error ? <p className="text-sm text-red-600">{error}</p> : null}
              </form>

              <div className="mt-7">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase tracking-[0.16em]">
                    <span className="bg-card px-3 text-muted-foreground">
                      Đăng nhập nhanh (Demo)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-5">
                  {quickLoginOptions.map((option) => (
                    <button
                      type="button"
                      key={option.username}
                      onClick={async () => {
                        setLoading(true);
                        setError("");

                        try {
                          await login(option.username, "demo123!");
                          navigate("/dashboard");
                        } catch (loginError) {
                          setError(
                            loginError instanceof Error
                              ? loginError.message
                              : "Đăng nhập thất bại",
                          );
                        } finally {
                          setLoading(false);
                        }
                      }}
                      className={`p-3.5 rounded-xl border border-border ${option.hoverBorderColor} transition-all text-left group hover:shadow-sm bg-white`}
                    >
                      <div
                        className={`w-8 h-8 rounded-md ${option.bgColor} flex items-center justify-center mb-2 transition-colors`}
                      >
                        <Shield className={`w-4 h-4 ${option.textColor}`} />
                      </div>
                      <p className="text-sm font-medium leading-5">
                        {option.role}
                      </p>
                    </button>
                  ))}
                </div>

                <div className="mt-6 rounded-xl border border-border/70 bg-slate-50 p-4">
                  <div className="mb-1 flex items-center gap-1 text-amber-500">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    <Star className="h-3.5 w-3.5 fill-current" />
                    <Star className="h-3.5 w-3.5 fill-current" />
                    <Star className="h-3.5 w-3.5 fill-current" />
                    <Star className="h-3.5 w-3.5 fill-current" />
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    "Giao diện mới dễ dùng hơn hẳn cho đội nghiệp vụ và chăm sóc
                    khách hàng."
                  </p>
                </div>
              </div>

              <div className="mt-7 text-center text-sm text-muted-foreground">
                Tài khoản được cấp bởi quản trị viên hệ thống.
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
