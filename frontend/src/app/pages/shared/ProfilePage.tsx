import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { Badge } from "../../components/ui/badge";
import { Save } from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { updateProfileRequest } from "../../services/api";

const roleColors: Record<string, { bg: string; text: string; badge: string }> =
  {
    creator: {
      bg: "bg-[#047857]",
      text: "text-white",
      badge: "bg-[#d1fae5] text-[#047857]",
    },
    insured: {
      bg: "bg-[#0284c7]",
      text: "text-white",
      badge: "bg-[#dbeafe] text-[#0284c7]",
    },
    accountant: {
      bg: "bg-[#d97706]",
      text: "text-white",
      badge: "bg-[#fef3c7] text-[#d97706]",
    },
    supervisor: {
      bg: "bg-[#7c3aed]",
      text: "text-white",
      badge: "bg-[#ede9fe] text-[#7c3aed]",
    },
    admin: {
      bg: "bg-[#111827]",
      text: "text-white",
      badge: "bg-[#e5e7eb] text-[#111827]",
    },
  };

const roleLabels: Record<string, string> = {
  creator: "Người tạo hợp đồng",
  insured: "Người được bảo hiểm",
  accountant: "Kế toán",
  supervisor: "Giám sát",
  admin: "Quản trị viên",
};

export function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // State for form fields
  const [fullName, setFullName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");

  if (!user) return null;

  const handleSaveChanges = async () => {
    setIsSaving(true);
    setSaveMessage("");

    try {
      await updateProfileRequest(
        {
          userId: user.id,
          accountType: user.accountType || "customer",
          fullName,
          email,
        },
        user.role,
      );

      updateUser({
        name: fullName,
        email,
      });

      setSaveMessage("✓ Đã lưu thay đổi thành công!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error) {
      setSaveMessage(
        `✗ ${error instanceof Error ? error.message : "Không thể lưu thay đổi"}`,
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display mb-2"
          style={{ fontSize: "2rem", fontWeight: 600 }}
        >
          Cài đặt hồ sơ
        </motion.h1>
        <p className="text-muted-foreground">
          Quản lý thông tin tài khoản và tùy chọn của bạn.
        </p>
      </div>

      {/* Thông tin hồ sơ */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarFallback
                  className={`${roleColors[user.role].bg} ${roleColors[user.role].text} text-2xl`}
                >
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              {/* Camera button removed per request */}
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2
                className="font-display mb-1"
                style={{ fontSize: "1.5rem", fontWeight: 600 }}
              >
                {user.name}
              </h2>
              <p className="text-muted-foreground mb-3">{user.email}</p>
              <Badge className={roleColors[user.role].badge}>
                {roleLabels[user.role]}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Thông tin cá nhân */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin cá nhân</CardTitle>
          <CardDescription>Cập nhật thông tin cá nhân của bạn</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Họ và tên</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Địa chỉ email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              onClick={handleSaveChanges}
              disabled={isSaving}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
            {saveMessage && (
              <div
                className={`text-sm ${saveMessage.includes("✓") ? "text-green-600" : "text-red-600"}`}
              >
                {saveMessage}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bảo mật tài khoản */}
      <Card>
        <CardHeader>
          <CardTitle>Bảo mật tài khoản</CardTitle>
          <CardDescription>
            Quản lý mật khẩu và các thiết lập bảo mật
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border border-border">
            <div>
              <p className="font-medium">Mật khẩu</p>
              <p className="text-sm text-muted-foreground">
                Lần thay đổi gần nhất: 3 tháng trước
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/settings">Đổi mật khẩu</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
