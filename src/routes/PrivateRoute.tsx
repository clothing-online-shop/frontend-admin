import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/auth-store";

// TODO: refine permission checks per role/menu item in a later sprint
export default function PrivateRoute() {
  const user = useAuthStore((state) => state.user);

  if (!user || user.role !== "ADMIN") {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
