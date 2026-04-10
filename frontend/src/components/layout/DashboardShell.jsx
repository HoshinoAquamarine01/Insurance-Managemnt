import { Link, useLocation } from "react-router-dom";
import Icon from "../ui/Icon";
import { useAuth } from "../../context/AuthContext";

export default function DashboardShell({ profile, children }) {
  const { logout, user } = useAuth();
  const location = useLocation();

  return (
    <div className={`dashboard-shell dashboard-shell--${profile.theme}`}>
      <aside className="sidebar">
        <div className="sidebar__hero card">
          <div className="sidebar__badge">{profile.title}</div>
          <p>{profile.subtitle}</p>
        </div>

        <nav className="sidebar__nav">
          {profile.nav.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? "active" : ""}`}
            >
              <Icon name={item.icon} size={18} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar__footer">
          <small>Hệ thống quản lý bảo hiểm</small>
          <span>© 2026</span>
        </div>
      </aside>

      <div className="dashboard-main">
        <header className="topbar card">
          <div>
            <h1>Quản lý bảo hiểm</h1>
            <p>Xin chào {user?.fullName || user?.username || "bạn"}</p>
          </div>

          <div className="topbar__user">
            <div>
              <strong>{user?.fullName || user?.username}</strong>
              <p>{user?.username}</p>
            </div>
            <button className="logout-button" onClick={logout}>
              <Icon name="logout" size={16} />
              Đăng xuất
            </button>
          </div>
        </header>

        <div className="dashboard-content">{children}</div>
      </div>
    </div>
  );
}
