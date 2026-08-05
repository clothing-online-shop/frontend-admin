import { useBreadcrumb } from "@/hooks/useBreadcrumb";

export default function CustomerList() {
  useBreadcrumb([{ label: "Khách hàng" }]);

  return (
    <div>
      <h3 className="text-2xl font-semibold text-gray-800 dark:text-white/90">Khách hàng</h3>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Quản lý khách hàng sẽ được triển khai ở sprint sau.
      </p>
    </div>
  );
}
