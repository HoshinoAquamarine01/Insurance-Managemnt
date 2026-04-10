import RoleIconCard from "../ui/RoleIconCard";
import { demoAccounts, loginHighlights } from "../../data/demo";

export default function AuthLayout({ title, subtitle, children, footerLink }) {
  return (
    <main className="auth-page">
      <section className="auth-page__hero">
        <div className="brand-mark">
          <span className="brand-mark__icon">🛡</span>
        </div>
        <div className="auth-page__intro">
          <h1>Quản lý Bảo hiểm</h1>
          <p>Hệ thống quản lý toàn diện</p>
        </div>

        <div className="auth-page__features">
          {loginHighlights.map((item) => (
            <RoleIconCard key={item.title} {...item} />
          ))}
        </div>
      </section>

      <section className="auth-page__panel card">
        <header className="auth-panel__header">
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </header>

        {children}

        {footerLink}

        <div className="demo-box">
          <p className="demo-box__title">Tài khoản demo (mật khẩu: 123456)</p>
          <div className="demo-grid">
            {demoAccounts.map((account) => (
              <div
                key={account.username}
                className={`demo-account demo-${account.tone}`}
              >
                <small>{account.role}</small>
                <strong>{account.username}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
