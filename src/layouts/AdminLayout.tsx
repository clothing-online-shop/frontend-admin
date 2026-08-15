import { useMemo } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth-store";
import { useBreadcrumbStore } from "@/store/breadcrumb-store";
import { ADMIN_ROLE_LABELS, toAdminRole, type AdminRole } from "@/lib/roles";
import { ADMIN_ONLY_ROLES, ALL_ADMIN_ROLES, INVENTORY_ROLES, MARKETING_ROLES} from "@/lib/permissions";
import { useToast } from "@/hooks/useToast";
import {
  PieChartIcon,
  BoxIcon,
  BoxIconLine,
  BoxCubeIcon,
  GridIcon,
  FolderIcon,
  ListIcon,
  GroupIcon,
  PageIcon,
  PlugInIcon,
  AngleRightIcon,
} from "@/icons";

interface MenuItem {
  key: string;
  icon: typeof PieChartIcon;
  label: string;
  allow: AdminRole[];
}

function getInitial(name: string | undefined): string {
  return (name?.trim()?.[0] ?? "?").toUpperCase();
}

const MENU_ITEMS: MenuItem[] = [
  { key: "/dashboard", icon: PieChartIcon, label: "Trang chủ", allow: ALL_ADMIN_ROLES },
  { key: "/products", icon: BoxIcon, label: "Sản phẩm", allow: INVENTORY_ROLES },
  { key: "/categories", icon: GridIcon, label: "Danh mục", allow: INVENTORY_ROLES },
  { key: "/brands", icon: BoxCubeIcon, label: "Thương hiệu", allow: INVENTORY_ROLES },
  { key: "/banners", icon: PageIcon, label: "Banner trang chủ", allow: MARKETING_ROLES },
  { key: "/collections", icon: FolderIcon, label: "Bộ sưu tập", allow: MARKETING_ROLES },
  { key: "/orders", icon: ListIcon, label: "Đơn hàng", allow: INVENTORY_ROLES },
  { key: "/inventory", icon: BoxIconLine, label: "Tồn kho", allow: INVENTORY_ROLES },
  { key: "/customers", icon: GroupIcon, label: "Khách hàng", allow: MARKETING_ROLES },
  { key: "/cms-content", icon: PageIcon, label: "Nội dung CMS", allow: MARKETING_ROLES },
  { key: "/settings", icon: PlugInIcon, label: "Cấu hình", allow: ADMIN_ONLY_ROLES },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const toast = useToast();
  const breadcrumbItems = useBreadcrumbStore((state) => state.items);
  const role = toAdminRole(user?.role ?? "ADMIN");

  const menuItems = useMemo(
    () => MENU_ITEMS.filter((item) => item.allow.includes(role)),
    [role],
  );

  const selectedKey = useMemo(() => {
    const match = menuItems.find((item) => location.pathname.startsWith(item.key));
    return match?.key ?? "/dashboard";
  }, [location.pathname, menuItems]);

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-72 shrink-0 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="px-6 py-6 text-lg font-semibold text-gray-800 dark:text-white/90">
          Trang quản trị
        </div>
        <nav className="flex-1 space-y-2 px-4">
          {menuItems.map((item) => {
            const isActive = item.key === selectedKey;
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => navigate(item.key)}
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-colors duration-200 ease-standard ${isActive
                  ? "bg-brand-50 text-brand-600 dark:bg-brand-500/[0.2] dark:text-brand-400"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
                  }`}
              >
                <Icon
                  className={`h-7 w-7 shrink-0 transition-colors duration-200 ease-standard ${isActive
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

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 bg-white px-6 py-3 dark:border-gray-800 dark:bg-gray-900">
          <nav className="flex items-center gap-1.5 text-base">
            <Link
              to="/dashboard"
              className="text-gray-800 font-medium transition-colors duration-200 ease-standard hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              Trang chủ
            </Link>
            {breadcrumbItems.map((item, index) => {
              const isLast = index === breadcrumbItems.length - 1;
              return (
                <span key={`${item.label}-${index}`} className="flex items-center gap-1.5">
                  <AngleRightIcon className="size-5 text-gray-400" />
                  {item.href && !isLast ? (
                    <Link
                      to={item.href}
                      className="text-gray-800 font-medium transition-colors duration-200 ease-standard hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span
                      className={
                        isLast
                          ? "font-medium text-gray-800 dark:text-white/90"
                          : "text-gray-500 dark:text-gray-400"
                      }
                    >
                      {item.label}
                    </span>
                  )}
                </span>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {/* Mock tạm — role lấy thẳng từ user session lúc đăng nhập, xem @/lib/roles.ts */}
            <div className="flex items-center gap-2.5 rounded-full border border-gray-200 py-1 pl-1 pr-3 dark:border-gray-800">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                {getInitial(user?.fullName)}
              </div>
              <div className="leading-tight">
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">{user?.fullName}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{ADMIN_ROLE_LABELS[role]}</p>
              </div>
            </div>

            <button
              type="button"
              aria-label="Đăng xuất"
              title="Đăng xuất"
              onClick={() => {
                logout();
                toast.success("Đã đăng xuất");
                navigate("/login");
              }}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors duration-200 ease-standard hover:bg-error-50 hover:text-error-600 dark:text-gray-500 dark:hover:bg-error-500/10 dark:hover:text-error-400"
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M15 17l5-5-5-5M20 12H9M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </header>
        <main className="flex min-w-0 flex-1 flex-col bg-white p-6 dark:bg-gray-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
}