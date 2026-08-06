import { useBreadcrumb } from "@/hooks/useBreadcrumb";

export default function Settings() {
  useBreadcrumb([{ label: "Cấu hình" }]);

  return (
    <div>
      <h3 className="text-2xl font-semibold text-gray-800 dark:text-white/90">Cấu hình</h3>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Cấu hình hệ thống sẽ được triển khai ở sprint sau.
      </p>
    </div>
  );
}
