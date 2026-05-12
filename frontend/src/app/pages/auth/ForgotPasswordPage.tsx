import { useState } from "react";
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
import { Shield, ArrowLeft, Mail, Sparkles, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background p-6 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.17),transparent_36%),radial-gradient(circle_at_80%_10%,rgba(14,116,144,0.14),transparent_32%)]" />
      <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(to_right,#1a1512_1px,transparent_1px),linear-gradient(to_bottom,#1a1512_1px,transparent_1px)] [background-size:38px_38px]" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="flex items-center gap-3 mb-8">
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
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Khôi phục tài khoản
            </p>
          </div>
        </div>

        <Card className="border-border/80 bg-white/95 shadow-xl backdrop-blur">
          <CardHeader>
            <div className="mb-2 inline-flex w-fit items-center gap-1 rounded-full border border-emerald-700/20 bg-emerald-50 px-3 py-1 text-xs text-emerald-800">
              <Sparkles className="w-3.5 h-3.5" /> Bảo mật tài khoản
            </div>
            <CardTitle
              className="font-display"
              style={{ fontSize: "1.875rem", fontWeight: 600 }}
            >
              {submitted ? "Kiểm tra email của bạn" : "Quên mật khẩu?"}
            </CardTitle>
            <CardDescription>
              {submitted
                ? `Chúng tôi đã gửi liên kết đặt lại mật khẩu đến ${email}`
                : "Nhập email của bạn, chúng tôi sẽ gửi liên kết đặt lại mật khẩu"}
            </CardDescription>

            {!submitted ? (
              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  Liên kết khôi phục chỉ có hiệu lực trong thời gian ngắn.
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  Hãy dùng email đã đăng ký để nhận liên kết.
                </div>
              </div>
            ) : null}
          </CardHeader>
          <CardContent>
            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full">
                  Gửi liên kết đặt lại
                </Button>

                <Button variant="ghost" className="w-full" asChild>
                  <Link
                    to="/login"
                    className="flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Quay lại đăng nhập
                  </Link>
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Mail className="w-8 h-8 text-primary" />
                </div>

                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Chưa nhận được email? Hãy kiểm tra thư rác hoặc
                  </p>
                  <Button
                    variant="link"
                    onClick={() => setSubmitted(false)}
                    className="p-0 h-auto"
                  >
                    thử email khác
                  </Button>
                </div>

                <Button variant="outline" className="w-full" asChild>
                  <Link
                    to="/login"
                    className="flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Quay lại đăng nhập
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
