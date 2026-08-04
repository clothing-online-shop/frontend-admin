import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/auth-store";
import { isAdminPanelRole } from "@/lib/roles";

// TODO: refine permission checks per role/menu item in a later sprint
export default function PrivateRoute() {
  const user = useAuthStore((state) => state.user);

  if (!user || !isAdminPanelRole(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
