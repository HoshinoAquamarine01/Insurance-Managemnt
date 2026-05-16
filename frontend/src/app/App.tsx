import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { AppLayout } from "./components/layout/AppLayout";


import { HomePage } from "./pages/shared/HomePage";


import { LoginPage } from "./pages/auth/LoginPage.tsx";



import { CreatorDashboard } from "./pages/creator/CreatorDashboard.tsx";
import { CreateContractPage } from "./pages/creator/CreateContractPage.tsx";
import { ContractsListPage } from "./pages/creator/ContractsListPage.tsx";
import { CreateInsuredPage } from "./pages/creator/CreateInsuredPage.tsx";


import { InsuredDashboard } from "./pages/insured/InsuredDashboard.tsx";
import { InstallmentPaymentPage } from "./pages/insured/InstallmentPaymentPage.tsx";
import { PaymentSuccessPage } from "./pages/insured/PaymentSuccessPage.tsx";
import { PaymentHistoryPage } from "./pages/insured/PaymentHistoryPage.tsx";
import { InsuranceStatusPage } from "./pages/insured/InsuranceStatusPage.tsx";

import { AccountantDashboard } from "./pages/accountant/AccountantDashboard.tsx";
import { ConfirmPaymentsPage } from "./pages/accountant/ConfirmPaymentsPage.tsx";
import { ReportsPage } from "./pages/accountant/ReportsPage.tsx";


import { SupervisorDashboard } from "./pages/supervisor/SupervisorDashboard.tsx";

import { AdminDashboard } from "./pages/admin/AdminDashboard.tsx";


import { ProfilePage } from "./pages/shared/ProfilePage.tsx";
import { SettingsPage } from "./pages/shared/SettingsPage.tsx";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isReady } = useAuth();
  if (!isReady) return null;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function RoleRoute({
  allowedRoles,
  children,
}: {
  allowedRoles: Array<
    "creator" | "insured" | "accountant" | "supervisor" | "admin"
  >;
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" />;

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
}

function DashboardRouter() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" />;

  switch (user.role) {
    case "creator":
      return <CreatorDashboard />;
    case "insured":
      return <InsuredDashboard />;
    case "accountant":
      return <AccountantDashboard />;
    case "supervisor":
      return <SupervisorDashboard />;
    case "admin":
      return <AdminDashboard />;
    default:
      return <CreatorDashboard />;
  }
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

    
      <Route path="/login" element={<LoginPage />} />
     

    
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardRouter />} />
        <Route path="/profile" element={<ProfilePage />} />

     
        <Route
          path="/contracts/create"
          element={
            <RoleRoute allowedRoles={["creator"]}>
              <CreateContractPage />
            </RoleRoute>
          }
        />
        <Route
          path="/customers/create"
          element={
            <RoleRoute allowedRoles={["creator"]}>
              <CreateInsuredPage />
            </RoleRoute>
          }
        />
        <Route path="/contracts" element={<ContractsListPage />} />
        <Route path="/contracts/:id" element={<ContractsListPage />} />
        <Route
          path="/contracts/:id/edit"
          element={
            <RoleRoute allowedRoles={["creator"]}>
              <CreateContractPage />
            </RoleRoute>
          }
        />
        <Route path="/contracts/history" element={<ContractsListPage />} />

       
        <Route path="/my-contract" element={<InsuredDashboard />} />
        <Route path="/payments/sepay" element={<InstallmentPaymentPage />} />
        <Route path="/payments/success" element={<PaymentSuccessPage />} />
        <Route
          path="/payments/pay"
          element={<Navigate to="/payments/sepay" replace />}
        />
        <Route path="/payments" element={<PaymentHistoryPage />} />
        <Route path="/status" element={<InsuranceStatusPage />} />

      
        <Route path="/reports" element={<ReportsPage />} />
        <Route
          path="/payments/confirm"
          element={
            <RoleRoute allowedRoles={["accountant"]}>
              <ConfirmPaymentsPage />
            </RoleRoute>
          }
        />

        
        <Route
          path="/contract-details"
          element={<Navigate to="/contracts" replace />}
        />

    
        <Route
          path="/admin"
          element={
            <RoleRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </RoleRoute>
          }
        />

       
        <Route path="/settings" element={<SettingsPage />} />

     
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Route>

      
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
