import { useMemo } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth-store";
import { useToast } from "@/hooks/useToast";
import Button from "@/components/ui/button/Button";
import {
  PieChartIcon,
  BoxIcon,
  GridIcon,
  ListIcon,
  GroupIcon,
  PageIcon,
  PlugInIcon,
} from "@/icons";

const MENU_ITEMS = [
  { key: "/dashboard", icon: PieChartIcon, label: "Dashboard" },
  { key: "/products", icon: BoxIcon, label: "Sản phẩm" },
  { key: "/categories", icon: GridIcon, label: "Danh mục" },
  { key: "/orders", icon: ListIcon, label: "Đơn hàng" },
  { key: "/customers", icon: GroupIcon, label: "Khách hàng" },
  { key: "/cms-content", icon: PageIcon, label: "Nội dung CMS" },
  { key: "/settings", icon: PlugInIcon, label: "Cấu hình" },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const toast = useToast();

  const selectedKey = useMemo(() => {
    const match = MENU_ITEMS.find((item) => location.pathname.startsWith(item.key));
    return match?.key ?? "/dashboard";
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-72 shrink-0 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="px-6 py-6 text-lg font-semibold text-gray-800 dark:text-white/90">
          Clothing Shop CMS
        </div>
        <nav className="flex-1 space-y-2 px-4">
          {MENU_ITEMS.map((item) => {
            const isActive = item.key === selectedKey;
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => navigate(item.key)}
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-brand-50 text-brand-500 dark:bg-brand-500/[0.12] dark:text-brand-400"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
                }`}
              >
                <Icon
                  className={`h-5 w-5 shrink-0 ${
                    isActive
                      ? "text-brand-500 dark:text-brand-400"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-end gap-4 border-b border-gray-200 bg-white px-6 py-3 dark:border-gray-800 dark:bg-gray-900">
          <span className="text-sm text-gray-700 dark:text-gray-300">{user?.fullName}</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              logout();
              toast.success("Đã đăng xuất");
              navigate("/login");
            }}
            startIcon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M15 17l5-5-5-5M20 12H9M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
          >
            Đăng xuất
          </Button>
        </header>
        <main className="flex-1 bg-gray-50 p-6 dark:bg-gray-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
