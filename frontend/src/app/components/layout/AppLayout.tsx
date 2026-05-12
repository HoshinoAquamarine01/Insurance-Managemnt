import { ReactNode } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { SidebarProvider } from "../ui/sidebar";
import { Outlet } from "react-router-dom";

interface AppLayoutProps {
  children?: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { isAuthenticated } = useAuth();
  const content = children ?? <Outlet />;

  if (!isAuthenticated) {
    return <>{content}</>;
  }

  return (
    <SidebarProvider>
      <div
        className="relative flex min-h-screen w-full overflow-hidden"
        style={{ backgroundColor: "var(--color-background)" }}
      >
        {/* Subtle decorative gradient overlays (design polish) */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `
              radial-gradient(circle at 10% 15%, rgba(13, 148, 136, 0.03), transparent 30%),
              radial-gradient(circle at 90% 10%, rgba(59, 130, 246, 0.03), transparent 30%),
              radial-gradient(circle at 50% 100%, rgba(17, 24, 39, 0.02), transparent 40%)
            `,
          }}
        />

        {/* Sidebar */}
        <AppSidebar />

        {/* Main Content Area */}
        <div
          className="relative flex flex-1 flex-col"
          style={{ backgroundColor: "var(--color-surface)" }}
        >
          {/* Header */}
          <AppHeader />

          {/* Content */}
          <main
            className="flex-1 overflow-y-auto"
            style={{
              padding: "var(--spacing-lg)",
              backgroundColor: "var(--color-background)",
            }}
          >
            {/* Responsive container with max-width */}
            <div
              className="mx-auto w-full"
              style={{
                maxWidth: "1280px", // 80rem
              }}
            >
              {content}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
