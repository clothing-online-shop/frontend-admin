import ComponentCard from "@/components/common/ComponentCard";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";

const STATS = [
  { label: "Doanh thu hôm nay", value: "0đ" },
  { label: "Đơn hàng mới", value: "0" },
  { label: "Sản phẩm", value: "0" },
];

export default function Dashboard() {
  useBreadcrumb([]);

  return (
    <div>
      <h3 className="text-2xl font-semibold text-gray-800 dark:text-white/90">Trang chủ</h3>
      <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">Môi trường UAT — dữ liệu thử nghiệm</p>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {STATS.map((stat) => (
          <ComponentCard key={stat.label} title={stat.label}>
            <p className="text-2xl font-semibold text-gray-800 dark:text-white/90">{stat.value}</p>
          </ComponentCard>
        ))}
      </div>
      <p className="mt-6 text-sm text-gray-500 dark:text-gray-400 text-center">
        Tính năng chờ phát triển.</p>
    </div>
  );
}
