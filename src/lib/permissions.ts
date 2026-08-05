import type { AdminRole } from "@/lib/roles";

// Config phân quyền menu/tính năng — nhóm role dùng chung, gán vào MENU_ITEMS hoặc
// route thay vì lặp lại mảng string ở nhiều nơi. Đổi quyền cho nhiều màn cùng lúc thì
// chỉ sửa ở đây.
export const ALL_ADMIN_ROLES: AdminRole[] = ["ADMIN", "WAREHOUSE_STAFF", "MARKETING"];
export const INVENTORY_ROLES: AdminRole[] = ["ADMIN", "WAREHOUSE_STAFF"];
export const MARKETING_ROLES: AdminRole[] = ["ADMIN", "MARKETING"];
export const ADMIN_ONLY_ROLES: AdminRole[] = ["ADMIN"];
