import { useBreadcrumb } from "@/hooks/useBreadcrumb";

export default function OrderList() {
  useBreadcrumb([{ label: "Đơn hàng" }]);

  return (
    <div>
      <h3 className="text-2xl font-semibold text-gray-800 dark:text-white/90">Đơn hàng</h3>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Danh sách/lọc/cập nhật trạng thái đơn hàng sẽ được triển khai ở Sprint 5.
      </p>
    </div>
  );
}
