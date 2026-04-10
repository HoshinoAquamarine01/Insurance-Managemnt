import { useMemo } from "react";
import { Navigate, useParams } from "react-router-dom";
import DashboardShell from "../../components/layout/DashboardShell";
import ContractCard from "../../components/ui/ContractCard";
import StatCard from "../../components/ui/StatCard";
import {
  dashboardContracts,
  dashboardStats,
  roleProfiles,
} from "../../data/demo";
import { useAuth } from "../../context/AuthContext";

const roleToProfileKey = {
  creator: "LAP_HOP_DONG",
  insured: "NGUOI_DUOC_BAO_HIEM",
  accounting: "KE_TOAN",
  supervisor: "GIAM_SAT",
};

export default function DashboardPage() {
  const { role } = useParams();
  const { user } = useAuth();

  const profile = roleProfiles[roleToProfileKey[role]];

  const content = useMemo(() => {
    const stats = dashboardStats[role] || [];
    const contracts = dashboardContracts[role] || [];
    return { stats, contracts };
  }, [role]);

  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role && roleToProfileKey[role] !== user.role) {
    return <Navigate to="/login" replace />;
  }

  return (
    <DashboardShell profile={profile}>
      <section className="dashboard-summary">
        {content.stats.map((item) => (
          <StatCard key={item.label} {...item} />
        ))}
      </section>

      <section className="section-header">
        <h2>{role === "creator" ? "Hợp đồng gần đây" : "Hợp đồng của tôi"}</h2>
        <button className="ghost-button">Xem tất cả</button>
      </section>

      <section className="card-stack">
        {content.contracts.map((contract) => (
          <ContractCard
            key={contract.code}
            contract={contract}
            actions={role !== "insured"}
          />
        ))}
      </section>
    </DashboardShell>
  );
}
