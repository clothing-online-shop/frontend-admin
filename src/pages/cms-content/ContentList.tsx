import { useBreadcrumb } from "@/hooks/useBreadcrumb";

export default function ContentList() {
  useBreadcrumb([{ label: "Nội dung CMS" }]);

  return (
    <div>
      <h3 className="text-2xl font-semibold text-gray-800 dark:text-white/90">Nội dung CMS</h3>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Quản lý banner/bài viết/trang nội dung sẽ được triển khai ở Sprint 6.
      </p>
    </div>
  );
}
