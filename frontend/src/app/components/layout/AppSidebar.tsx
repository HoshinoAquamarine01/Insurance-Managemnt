import { useAuth, UserRole } from "../../contexts/AuthContext";
import { Link } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarFooter,
} from "../ui/sidebar";
import {
  FileText,
  LayoutDashboard,
  FilePlus,
  FileEdit,
  History,
  User,
  DollarSign,
  CreditCard,
  BarChart3,
  Eye,
  Shield,
  Settings,
  LogOut,
  Users,
  Activity,
} from "lucide-react";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Separator } from "../ui/separator";

interface MenuItem {
  title: string;
  icon: React.ElementType;
  path: string;
}

interface MenuSection {
  label: string;
  items: MenuItem[];
}

const menuByRole: Record<UserRole, MenuSection[]> = {
  creator: [
    {
      label: "Tổng quan",
      items: [
        { title: "Bảng điều khiển", icon: LayoutDashboard, path: "/dashboard" },
      ],
    },
    {
      label: "Hợp đồng",
      items: [
        { title: "Tạo hợp đồng", icon: FilePlus, path: "/contracts/create" },
        {
          title: "Tạo người được bảo hiểm",
          icon: Users,
          path: "/customers/create",
        },
        { title: "Hợp đồng của tôi", icon: FileText, path: "/contracts" },
        {
          title: "Lịch sử hợp đồng",
          icon: History,
          path: "/contracts/history",
        },
      ],
    },
    {
      label: "Tài khoản",
      items: [
        { title: "Hồ sơ", icon: User, path: "/profile" },
        { title: "Cài đặt", icon: Settings, path: "/settings" },
      ],
    },
  ],
  insured: [
    {
      label: "Tổng quan",
      items: [
        { title: "Bảng điều khiển", icon: LayoutDashboard, path: "/dashboard" },
      ],
    },
    {
      label: "Bảo hiểm của tôi",
      items: [
        { title: "Chi tiết hợp đồng", icon: FileText, path: "/my-contract" },
        {
          title: "Đóng phí theo kỳ",
          icon: CreditCard,
          path: "/payments/sepay",
        },
        { title: "Lịch sử thanh toán", icon: DollarSign, path: "/payments" },
        { title: "Tình trạng bảo hiểm", icon: Shield, path: "/status" },
      ],
    },
    {
      label: "Tài khoản",
      items: [
        { title: "Hồ sơ", icon: User, path: "/profile" },
        { title: "Cài đặt", icon: Settings, path: "/settings" },
      ],
    },
  ],
  accountant: [
    {
      label: "Tổng quan",
      items: [
        { title: "Bảng điều khiển", icon: LayoutDashboard, path: "/dashboard" },
      ],
    },
    {
      label: "Tài chính",
      items: [
        { title: "Tất cả hợp đồng", icon: FileText, path: "/contracts" },
        {
          title: "Xác nhận thanh toán",
          icon: CreditCard,
          path: "/payments/confirm",
        },
        { title: "Theo dõi thanh toán", icon: DollarSign, path: "/payments" },
        { title: "Báo cáo tài chính", icon: BarChart3, path: "/reports" },
      ],
    },
    {
      label: "Tài khoản",
      items: [
        { title: "Hồ sơ", icon: User, path: "/profile" },
        { title: "Cài đặt", icon: Settings, path: "/settings" },
      ],
    },
  ],
  supervisor: [
    {
      label: "Tổng quan",
      items: [
        { title: "Bảng điều khiển", icon: LayoutDashboard, path: "/dashboard" },
        { title: "Tổng quan hợp đồng", icon: Eye, path: "/contracts/overview" },
      ],
    },
    {
      label: "Giám sát",
      items: [
        { title: "Tất cả hợp đồng", icon: FileText, path: "/contracts" },
        { title: "Chi tiết hợp đồng", icon: Eye, path: "/contracts/details" },
      ],
    },
    {
      label: "Tài khoản",
      items: [
        { title: "Hồ sơ", icon: User, path: "/profile" },
        { title: "Cài đặt", icon: Settings, path: "/settings" },
      ],
    },
  ],
  admin: [
    {
      label: "Tổng quan",
      items: [
        {
          title: "Bảng điều khiển admin",
          icon: LayoutDashboard,
          path: "/admin",
        },
      ],
    },
    {
      label: "Quản trị",
      items: [
        { title: "Người dùng", icon: Users, path: "/admin?tab=users" },
        {
          title: "Loại bảo hiểm",
          icon: Shield,
          path: "/admin?tab=insurance-types",
        },
        { title: "Hợp đồng", icon: FileText, path: "/admin?tab=contracts" },
        {
          title: "Phân công",
          icon: Users,
          path: "/admin?tab=assignments",
        },
        {
          title: "Nhật ký hoạt động",
          icon: Activity,
          path: "/admin?tab=activity",
        },
      ],
    },
    {
      label: "Tài khoản",
      items: [
        { title: "Hồ sơ", icon: User, path: "/profile" },
        { title: "Cài đặt", icon: Settings, path: "/settings" },
      ],
    },
  ],
};

const roleColors: Record<UserRole, { bg: string; text: string }> = {
  creator: { bg: "bg-[#047857]", text: "text-white" },
  insured: { bg: "bg-[#0284c7]", text: "text-white" },
  accountant: { bg: "bg-[#d97706]", text: "text-white" },
  supervisor: { bg: "bg-[#7c3aed]", text: "text-white" },
  admin: { bg: "bg-[#111827]", text: "text-white" },
};

export function AppSidebar() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const menuSections = menuByRole[user.role];
  const roleColor = roleColors[user.role];

  return (
    <Sidebar>
      <SidebarHeader className="p-5 lg:p-6">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-2xl ${roleColor.bg}`}
          >
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2
              className="font-display tracking-tight"
              style={{ fontSize: "1.25rem", fontWeight: 600 }}
            >
              Bảo hiểm
            </h2>
            <p className="opacity-60" style={{ fontSize: "0.8125rem" }}>
              Hệ thống quản lý
            </p>
          </div>
        </div>
      </SidebarHeader>

      <Separator className="bg-sidebar-border" />

      <SidebarContent className="px-4 py-5">
        {menuSections.map((section, idx) => (
          <SidebarGroup key={idx}>
            <SidebarGroupLabel className="px-3 text-[0.72rem] uppercase tracking-[0.18em] opacity-50">
              {section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item, itemIdx) => (
                  <SidebarMenuItem key={`${idx}-${itemIdx}`}>
                    <SidebarMenuButton asChild>
                      <Link
                        to={item.path}
                        className="flex items-center gap-3 rounded-xl px-3 py-3"
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="rounded-2xl bg-sidebar-accent p-4 shadow-inner">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-11 w-11">
              <AvatarFallback className={`${roleColor.bg} ${roleColor.text}`}>
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p
                className="font-medium truncate"
                style={{ fontSize: "0.875rem" }}
              >
                {user.name}
              </p>
              <p
                className="opacity-60 truncate capitalize"
                style={{ fontSize: "0.75rem" }}
              >
                {user.role}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-sidebar-border px-3 py-2.5 text-sm transition-colors hover:bg-sidebar-ring"
          >
            <LogOut className="h-4 w-4" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
