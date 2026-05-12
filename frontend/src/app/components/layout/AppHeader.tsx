import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Search, ChevronDown } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { SidebarTrigger } from "../ui/sidebar";
import { useAuth } from "../../contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";
import { LogOut, User, Settings } from "lucide-react";

export function AppHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setKeyword(params.get("q") || "");
  }, [location.search]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const params = new URLSearchParams();
    const trimmed = keyword.trim();
    if (trimmed) {
      params.set("q", trimmed);
    }

    if (user?.role === "insured") {
      navigate({
        pathname: "/payments",
        search: params.toString() ? `?${params.toString()}` : "",
      });
      return;
    }

    if (user?.role === "accountant") {
      navigate({
        pathname: "/dashboard",
        search: params.toString() ? `?${params.toString()}` : "",
      });
      return;
    }

    if (user?.role === "admin") {
      params.set("tab", "contracts");
      navigate({
        pathname: "/admin",
        search: `?${params.toString()}`,
      });
      return;
    }

    navigate({
      pathname: "/contracts",
      search: params.toString() ? `?${params.toString()}` : "",
    });
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getRoleColor = () => {
    switch (user?.role) {
      case "creator":
        return "bg-[#d1fae5] text-[#047857]";
      case "insured":
        return "bg-[#dbeafe] text-[#0284c7]";
      case "accountant":
        return "bg-[#fef3c7] text-[#d97706]";
      case "supervisor":
        return "bg-[#ede9fe] text-[#7c3aed]";
      case "admin":
        return "bg-gray-200 text-gray-800";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  const getRoleLabel = () => {
    switch (user?.role) {
      case "creator":
        return "Người tạo hợp đồng";
      case "insured":
        return "Người được bảo hiểm";
      case "accountant":
        return "Kế toán";
      case "supervisor":
        return "Giám sát";
      case "admin":
        return "Quản trị viên";
      default:
        return user?.role || "Người dùng";
    }
  };

  return (
    <header className="relative z-20 min-h-[4.5rem] border-b border-border/80 bg-card/95 px-4 py-3 shadow-sm backdrop-blur-sm sm:px-6 lg:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <SidebarTrigger className="hover:bg-secondary" />
        <form
          className="relative hidden w-full max-w-xl md:block"
          onSubmit={handleSubmit}
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm hợp đồng, khách hàng..."
            className="h-11 border border-border/50 bg-white/60 pl-10 pr-4 shadow-sm transition-all focus:bg-white focus:shadow-md"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </form>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-11 gap-2 px-2 sm:px-3 hover:bg-secondary"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="hidden sm:flex flex-col items-end min-w-0">
                  <span className="text-sm font-medium truncate">
                    {user?.name || "Người dùng"}
                  </span>
                  <span
                    className={`text-xs rounded px-1.5 py-0.5 ${getRoleColor()}`}
                  >
                    {getRoleLabel()}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 flex-shrink-0 opacity-70" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <div className="px-2 py-1.5 sm:hidden">
              <p className="font-medium">{user?.name || "Người dùng"}</p>
              <p
                className={`text-xs rounded px-1.5 py-0.5 inline-block mt-1 ${getRoleColor()}`}
              >
                {getRoleLabel()}
              </p>
            </div>
            {!window.matchMedia("(min-width: 640px)").matches && (
              <>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem asChild>
              <a href="/profile" className="cursor-pointer">
                <User className="w-4 h-4 mr-2" />
                Hồ sơ của tôi
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href="/settings" className="cursor-pointer">
                <Settings className="w-4 h-4 mr-2" />
                Cài đặt
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
              <LogOut className="w-4 h-4 mr-2" />
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
