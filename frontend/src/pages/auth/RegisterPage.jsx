import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../../components/layout/AuthLayout";
import Button from "../../components/ui/Button";
import TextField from "../../components/ui/TextField";
import { useAuth } from "../../context/AuthContext";

const roleOptions = [
  { value: "LAP_HOP_DONG", label: "Người lập hợp đồng" },
  { value: "NGUOI_DUOC_BAO_HIEM", label: "Người được bảo hiểm" },
  { value: "KE_TOAN", label: "Kế toán" },
  { value: "GIAM_SAT", label: "Giám sát" },
  { value: "ADMIN", label: "Admin" },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    username: "",
    password: "",
    hoTen: "",
    email: "",
    soDienThoai: "",
    vaiTro: "NGUOI_DUOC_BAO_HIEM",
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await register(form);
      setSuccess("Đăng ký thành công. Chuyển đến trang đăng nhập...");
      setTimeout(() => navigate("/login", { replace: true }), 900);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Tạo tài khoản mới"
      subtitle="Nhập thông tin để mở tài khoản sử dụng hệ thống"
      footerLink={
        <p className="auth-link-row">
          Đã có tài khoản? <Link to="/login">Quay lại đăng nhập</Link>
        </p>
      }
    >
      <form className="auth-form auth-form--grid" onSubmit={handleSubmit}>
        <TextField
          label="Tên đăng nhập"
          placeholder="VD: user01"
          value={form.username}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, username: event.target.value }))
          }
        />
        <TextField
          label="Mật khẩu"
          type="password"
          placeholder="Tối thiểu 6 ký tự"
          value={form.password}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, password: event.target.value }))
          }
        />
        <TextField
          label="Họ và tên"
          placeholder="VD: Nguyễn Văn A"
          value={form.hoTen}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, hoTen: event.target.value }))
          }
        />
        <TextField
          label="Email"
          type="email"
          placeholder="name@example.com"
          value={form.email}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, email: event.target.value }))
          }
        />
        <TextField
          label="Số điện thoại"
          placeholder="VD: 0912345678"
          value={form.soDienThoai}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, soDienThoai: event.target.value }))
          }
        />
        <label className="field field--select">
          <span className="field-label">Vai trò</span>
          <select
            className="field-input"
            value={form.vaiTro}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, vaiTro: event.target.value }))
            }
          >
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="auth-form__full">
          {error ? <div className="form-error">{error}</div> : null}
          {success ? <div className="form-success">{success}</div> : null}
          <Button type="submit" disabled={loading}>
            {loading ? "Đang tạo tài khoản..." : "Đăng ký"}
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
}
