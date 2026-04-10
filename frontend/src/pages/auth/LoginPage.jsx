import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../../components/layout/AuthLayout";
import Button from "../../components/ui/Button";
import Icon from "../../components/ui/Icon";
import TextField from "../../components/ui/TextField";
import { useAuth } from "../../context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await login(form);
      const role = data.user.vaiTro;

      const target =
        role === "ADMIN"
          ? "/admin"
          : role === "NGUOI_DUOC_BAO_HIEM"
            ? "/dashboard/insured"
            : role === "KE_TOAN"
              ? "/dashboard/accounting"
              : role === "GIAM_SAT"
                ? "/dashboard/supervisor"
                : "/dashboard/creator";

      navigate(target, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Đăng nhập hệ thống"
      subtitle="Nhập thông tin đăng nhập để tiếp tục"
      footerLink={
        <p className="auth-link-row">
          Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
        </p>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <TextField
          label="Tên đăng nhập"
          placeholder="Nhập tên đăng nhập"
          value={form.username}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, username: event.target.value }))
          }
        />

        <TextField
          label="Mật khẩu"
          type="password"
          placeholder="Nhập mật khẩu"
          value={form.password}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, password: event.target.value }))
          }
        />

        {error ? <div className="form-error">{error}</div> : null}

        <Button type="submit" disabled={loading}>
          {loading ? "Đang xử lý..." : "Đăng nhập"}
        </Button>
      </form>

      <div className="auth-divider" />

      <div className="quick-role-grid">
        {["creator1", "insured1", "accounting1", "supervisor1"].map((name) => (
          <button
            key={name}
            type="button"
            className="quick-role-card"
            onClick={() => setForm({ username: name, password: "123456" })}
          >
            <Icon name="login" size={18} />
            <span>{name}</span>
          </button>
        ))}
      </div>
    </AuthLayout>
  );
}
