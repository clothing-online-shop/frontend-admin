import type { AuthUser } from "@/lib/shared-types";

// Mock tạm — backend hiện chỉ trả role "CUSTOMER" | "ADMIN" (xem shared-types.ts).
// WAREHOUSE_STAFF/MARKETING là 2 role mock để FE sẵn sàng hiển thị sidebar theo quyền
// trước khi có màn quản lý phân quyền thật. Khi backend trả các role này qua user.role,
// xoá comment này — không cần đổi gì thêm ở FE.
export type AdminRole = "ADMIN" | "WAREHOUSE_STAFF" | "MARKETING";

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  ADMIN: "Quản trị viên",
  WAREHOUSE_STAFF: "Nhân viên kho",
  MARKETING: "Marketing",
};

const ADMIN_ROLES = Object.keys(ADMIN_ROLE_LABELS) as AdminRole[];

export function isAdminPanelRole(role: AuthUser["role"]): boolean {
  return (ADMIN_ROLES as string[]).includes(role);
}

export function toAdminRole(role: AuthUser["role"]): AdminRole {
  return isAdminPanelRole(role) ? (role as AdminRole) : "ADMIN";
}
