import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Button } from "../../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { useAuth } from "../../contexts/AuthContext";
import { createInsuredCustomer } from "../../services/api";

export function CreateInsuredPage() {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({
    idKhachHang: "",
    tenDangNhap: "",
    matKhau: "",
    hoTen: "",
    email: "",
    ngaySinh: "",
    gioiTinh: "",
    cccd: "",
    diaChi: "",
    coQuan: "",
    trangThaiHoSo: "Hoạt động",
    lichSuBenh: "",
  });

  const updateField = (key: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setStatus("error");
      setMessage("Vui lòng đăng nhập lại.");
      return;
    }

    if (
      !formData.idKhachHang ||
      !formData.tenDangNhap ||
      !formData.matKhau ||
      !formData.hoTen ||
      !formData.ngaySinh ||
      !formData.gioiTinh ||
      !formData.cccd ||
      !formData.diaChi ||
      !formData.trangThaiHoSo
    ) {
      setStatus("error");
      setMessage("Vui lòng nhập đầy đủ các trường bắt buộc.");
      return;
    }

    // Client-side validation to mirror backend rules
    if (String(formData.tenDangNhap).trim().length < 4) {
      setStatus("error");
      setMessage("Tên đăng nhập phải có ít nhất 4 ký tự.");
      return;
    }

    if (String(formData.matKhau).length < 6) {
      setStatus("error");
      setMessage("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    if (String(formData.cccd).length < 9 || String(formData.cccd).length > 20) {
      setStatus("error");
      setMessage("CCCD phải có độ dài từ 9 đến 20 ký tự.");
      return;
    }

    try {
      setIsSubmitting(true);
      setStatus("idle");
      setMessage("");

      // Normalize ngaySinh to ISO (YYYY-MM-DD) to satisfy backend validation
      function normalizeToISO(dateStr: string) {
        if (!dateStr) return dateStr;
        // Already ISO-like
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
        // Slash formats: try to detect MM/DD/YYYY or DD/MM/YYYY
        if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
          const parts = dateStr.split("/").map((p) => p.padStart(2, "0"));
          const a = Number(parts[0]);
          const b = Number(parts[1]);
          const year = parts[2];
          let dd = "01";
          let mm = "01";
          // If first part > 12, assume DD/MM/YYYY
          if (a > 12) {
            dd = parts[0];
            mm = parts[1];
          } else {
            // otherwise assume MM/DD/YYYY
            mm = parts[0];
            dd = parts[1];
          }
          return `${year}-${mm}-${dd}`;
        }

        // Fallback: attempt Date parsing and format
        const parsed = new Date(dateStr);
        if (!Number.isNaN(parsed.getTime())) {
          const y = parsed.getFullYear();
          const m = String(parsed.getMonth() + 1).padStart(2, "0");
          const d = String(parsed.getDate()).padStart(2, "0");
          return `${y}-${m}-${d}`;
        }

        return dateStr;
      }

      const isoNgaySinh = normalizeToISO(formData.ngaySinh);

      await createInsuredCustomer(
        {
          idKhachHang: formData.idKhachHang,
          tenDangNhap: formData.tenDangNhap,
          matKhau: formData.matKhau,
          hoTen: formData.hoTen,
          email: formData.email || undefined,
          ngaySinh: isoNgaySinh,
          gioiTinh: formData.gioiTinh,
          cccd: formData.cccd,
          diaChi: formData.diaChi,
          diaChiLienLac: formData.diaChi,
          coQuan: formData.coQuan || undefined,
          trangThaiHoSo: formData.trangThaiHoSo,
          lichSuBenh: formData.lichSuBenh || undefined,
        },
        user.role,
      );

      setStatus("success");
      setMessage("Tạo người được bảo hiểm thành công.");
      setFormData({
        idKhachHang: "",
        tenDangNhap: "",
        matKhau: "",
        hoTen: "",
        email: "",
        ngaySinh: "",
        gioiTinh: "",
        cccd: "",
        diaChi: "",
        coQuan: "",
        trangThaiHoSo: "Hoạt động",
        lichSuBenh: "",
      });
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Tạo mới thất bại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Tạo người được bảo hiểm
          </h1>
          <p className="text-sm text-muted-foreground">
            Creator tạo tài khoản người được bảo hiểm để sử dụng khi lập hợp
            đồng.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/contracts/create">Lập hợp đồng</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin bắt buộc</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="idKhachHang">Mã khách hàng *</Label>
                <Input
                  id="idKhachHang"
                  value={formData.idKhachHang}
                  onChange={(e) => updateField("idKhachHang", e.target.value)}
                  placeholder="KH0001"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cccd">CCCD *</Label>
                <Input
                  id="cccd"
                  value={formData.cccd}
                  onChange={(e) => updateField("cccd", e.target.value)}
                  placeholder="079xxxxxxxxx"
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="hoTen">Họ tên *</Label>
                <Input
                  id="hoTen"
                  value={formData.hoTen}
                  onChange={(e) => updateField("hoTen", e.target.value)}
                  placeholder="Nguyễn Văn A"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenDangNhap">Tên đăng nhập *</Label>
                <Input
                  id="tenDangNhap"
                  value={formData.tenDangNhap}
                  onChange={(e) => updateField("tenDangNhap", e.target.value)}
                  placeholder="nguyenvana"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="matKhau">Mật khẩu *</Label>
                <Input
                  id="matKhau"
                  type="password"
                  value={formData.matKhau}
                  onChange={(e) => updateField("matKhau", e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="abc@company.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ngaySinh">Ngày sinh *</Label>
                <Input
                  id="ngaySinh"
                  type="date"
                  value={formData.ngaySinh}
                  onChange={(e) => updateField("ngaySinh", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Giới tính *</Label>
                <Select
                  value={formData.gioiTinh}
                  onValueChange={(value) => updateField("gioiTinh", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn giới tính" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Nam">Nam</SelectItem>
                    <SelectItem value="Nữ">Nữ</SelectItem>
                    <SelectItem value="Khác">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="coQuan">Cơ quan</Label>
                <Input
                  id="coQuan"
                  value={formData.coQuan}
                  onChange={(e) => updateField("coQuan", e.target.value)}
                  placeholder="Tên cơ quan"
                />
              </div>

              <div className="space-y-2">
                <Label>Trạng thái hồ sơ *</Label>
                <Select
                  value={formData.trangThaiHoSo}
                  onValueChange={(value) => updateField("trangThaiHoSo", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hoạt động">Hoạt động</SelectItem>
                    <SelectItem value="Chờ duyệt">Chờ duyệt</SelectItem>
                    <SelectItem value="Tạm ngưng">Tạm ngưng</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="diaChi">Địa chỉ liên lạc *</Label>
                <Input
                  id="diaChi"
                  value={formData.diaChi}
                  onChange={(e) => updateField("diaChi", e.target.value)}
                  placeholder="Số nhà, đường, quận/huyện, tỉnh/thành"
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="lichSuBenh">Lịch sử bệnh</Label>
                <Textarea
                  id="lichSuBenh"
                  value={formData.lichSuBenh}
                  onChange={(e) => updateField("lichSuBenh", e.target.value)}
                  placeholder="Thông tin bổ sung nếu có"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Đang tạo..." : "Tạo người được bảo hiểm"}
              </Button>
              <Button asChild variant="outline" type="button">
                <Link to="/contracts/create">Quay lại lập hợp đồng</Link>
              </Button>
            </div>

            {message ? (
              <p
                className={
                  status === "success"
                    ? "text-sm text-emerald-700"
                    : "text-sm text-red-600"
                }
              >
                {message}
              </p>
            ) : null}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
