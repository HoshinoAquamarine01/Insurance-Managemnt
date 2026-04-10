import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import AdminPage from "./pages/admin/AdminPage";

function ProtectedRoute({ children, allowRoles }) {
  const { user, isReady } = useAuth();

  if (!isReady) return null;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowRoles && !allowRoles.includes(user.role)) {
    return <Navigate to={getHomePath(user.role)} replace />;
  }

  return children;
}

function getHomePath(role) {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "NGUOI_DUOC_BAO_HIEM":
      return "/dashboard/insured";
    case "KE_TOAN":
      return "/dashboard/accounting";
    case "GIAM_SAT":
      return "/dashboard/supervisor";
    case "LAP_HOP_DONG":
      return "/dashboard/creator";
    default:
      return "/login";
  }
}

export default function App() {
  const { user, isReady } = useAuth();

  if (!isReady) return null;

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Navigate to={user ? getHomePath(user.role) : "/login"} replace />
        }
      />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowRoles={["ADMIN"]}>
            <AdminPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/:role"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
