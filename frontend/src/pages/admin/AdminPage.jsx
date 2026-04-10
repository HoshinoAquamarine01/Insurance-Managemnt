import DashboardShell from "../../components/layout/DashboardShell";
import Button from "../../components/ui/Button";
import ContractCard from "../../components/ui/ContractCard";
import StatCard from "../../components/ui/StatCard";
import TextField from "../../components/ui/TextField";
import {
  adminMetrics,
  auditLogs,
  insuranceTypes,
  roleProfiles,
} from "../../data/demo";

const adminProfile = roleProfiles.ADMIN;

export default function AdminPage() {
  return (
    <DashboardShell profile={adminProfile}>
      <section className="dashboard-summary dashboard-summary--admin">
        {adminMetrics.map((item) => (
          <StatCard key={item.label} {...item} />
        ))}
      </section>

      <section className="admin-grid">
        <div className="soft-card admin-panel">
          <div className="section-header section-header--compact">
            <h2>Loại bảo hiểm</h2>
            <button className="ghost-button">Thêm loại mới</button>
          </div>
          <div className="admin-list">
            {insuranceTypes.map((item) => (
              <div key={item.code} className="admin-list__row">
                <strong>{item.name}</strong>
                <span
                  className={`status-pill ${item.status === "ACTIVE" ? "badge-green" : "badge-orange"}`}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="soft-card admin-panel">
          <div className="section-header section-header--compact">
            <h2>Phân công</h2>
            <button className="ghost-button">Lưu phân công</button>
          </div>
          <div className="admin-form-grid">
            <TextField label="Người dùng" placeholder="Nhập userId" />
            <TextField label="Loại bảo hiểm" placeholder="Nhập loaiBaoHiemId" />
            <TextField label="Ngày phân công" type="date" />
            <TextField label="Vai trò" value="Kế toán / Giám sát" readOnly />
          </div>
        </div>
      </section>

      <section className="section-header">
        <h2>Hợp đồng mẫu</h2>
      </section>

      <section className="card-stack">
        {[
          {
            code: "BH-2026-010",
            title: "Bảo hiểm xe cơ giới",
            insured: "Lê Văn C",
            creator: "Nguyễn Văn A",
            status: "Đang hoạt động",
            term: "1/4/2026 - 31/3/2027",
            value: "200.000.000 VNĐ",
            variant: "green",
          },
        ].map((contract) => (
          <ContractCard key={contract.code} contract={contract} />
        ))}
      </section>

      <section className="section-header section-header--compact">
        <h2>Lịch sử truy cập</h2>
      </section>

      <div className="soft-card audit-panel">
        {auditLogs.map((log) => (
          <div key={`${log.entity}-${log.time}`} className="audit-row">
            <div>
              <strong>{log.entity}</strong>
              <p>{log.detail}</p>
            </div>
            <span>{log.action}</span>
            <time>{log.time}</time>
          </div>
        ))}
      </div>

      <div className="admin-actions">
        <Button>Thêm loại bảo hiểm</Button>
        <Button variant="secondary">Xuất báo cáo</Button>
      </div>
    </DashboardShell>
  );
}
