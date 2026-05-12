import { useState, useEffect, type FormEvent } from "react";
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
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group";
import { motion } from "motion/react";
import { Lock } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { updatePasswordRequest } from "../../services/api";

type ThemePreference = "light" | "dark" | "system";

export function SettingsPage() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordNotice, setPasswordNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [themePreference, setThemePreference] =
    useState<ThemePreference>("system");
  const [isSavingTheme, setIsSavingTheme] = useState(false);
  const [themeNotice, setThemeNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedTheme = window.localStorage.getItem("theme");
    if (
      storedTheme === "light" ||
      storedTheme === "dark" ||
      storedTheme === "system"
    ) {
      setThemePreference(storedTheme);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const root = window.document.documentElement;
    const isDarkMode =
      themePreference === "dark" ||
      (themePreference === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    root.classList.toggle("dark", isDarkMode);
  }, [themePreference]);

  const handleSavePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordNotice(null);

    if (!user?.id) {
      setPasswordNotice({
        type: "error",
        message:
          "Không xác định được người dùng hiện tại. Vui lòng đăng nhập lại.",
      });
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordNotice({
        type: "error",
        message: "Vui lòng nhập đầy đủ các trường mật khẩu.",
      });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordNotice({
        type: "error",
        message: "Mật khẩu mới phải có ít nhất 6 ký tự.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordNotice({
        type: "error",
        message: "Mật khẩu xác nhận không khớp với mật khẩu mới.",
      });
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordNotice({
        type: "error",
        message: "Mật khẩu mới phải khác mật khẩu hiện tại.",
      });
      return;
    }

    setIsSavingPassword(true);
    try {
      await updatePasswordRequest(
        {
          userId: user.id,
          currentPassword,
          newPassword,
        },
        user.role,
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordNotice({
        type: "success",
        message: "Đã cập nhật mật khẩu thành công.",
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Hiện không thể cập nhật mật khẩu.";
      setPasswordNotice({ type: "error", message });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleSaveTheme = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setThemeNotice(null);
    setIsSavingTheme(true);

    try {
      window.localStorage.setItem("theme", themePreference);

      setThemeNotice({
        type: "success",
        message: "Đã cập nhật giao diện thành công.",
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể cập nhật giao diện.";
      setThemeNotice({ type: "error", message });
    } finally {
      setIsSavingTheme(false);
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
          Cài đặt
        </motion.h1>
        <p className="text-muted-foreground">
          Quản lý bảo mật và tùy chọn thông báo.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#0284c7]" />
            <CardTitle>Mật khẩu</CardTitle>
          </div>
          <CardDescription>Cập nhật mật khẩu tài khoản của bạn</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSavePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
              <Input
                id="currentPassword"
                type="password"
                placeholder="Nhập mật khẩu hiện tại"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                autoComplete="current-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Mật khẩu mới</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Nhập mật khẩu mới"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
              />
            </div>
            {passwordNotice && (
              <p
                className={
                  passwordNotice.type === "success"
                    ? "text-sm text-emerald-700"
                    : "text-sm text-red-600"
                }
              >
                {passwordNotice.message}
              </p>
            )}
            <Button type="submit" disabled={isSavingPassword}>
              {isSavingPassword ? "Đang lưu..." : "Lưu mật khẩu"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Giao diện</CardTitle>
          </div>
          <CardDescription>Chỉ chọn một chế độ nền</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSaveTheme} className="space-y-4">
            <RadioGroup
              value={themePreference}
              onValueChange={(value) =>
                setThemePreference(value as ThemePreference)
              }
              className="space-y-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem id="theme-light" value="light" />
                <Label htmlFor="theme-light" className="text-sm font-medium">
                  Nền sáng
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <RadioGroupItem id="theme-dark" value="dark" />
                <Label htmlFor="theme-dark" className="text-sm font-medium">
                  Nền tối
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <RadioGroupItem id="theme-system" value="system" />
                <Label htmlFor="theme-system" className="text-sm font-medium">
                  Tự động theo hệ thống
                </Label>
              </div>
            </RadioGroup>

            {themeNotice && (
              <p
                className={
                  themeNotice.type === "success"
                    ? "text-sm text-emerald-700"
                    : "text-sm text-red-600"
                }
              >
                {themeNotice.message}
              </p>
            )}

            <Button type="submit" disabled={isSavingTheme}>
              {isSavingTheme ? "Đang lưu..." : "Cập nhật giao diện"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
