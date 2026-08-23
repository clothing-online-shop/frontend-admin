import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Customer } from "@/types/shared-types";
import { useCustomers, useUpdateCustomerStatus } from "@/hooks/useCustomers";
import { useDebounce } from "@/hooks/useDebounce";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import { useToast } from "@/hooks/useToast";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { USER_STATUS_LABEL } from "@/lib/userStatus";
import { formatDate, formatPrice } from "@/lib/format";
import { getErrorMessage } from "@/lib/error";
import { DataTable, type DataTableColumn } from "@/components/ui/table/DataTable";
import Badge from "@/components/ui/badge/Badge";
import Pagination from "@/components/ui/pagination/Pagination";
import Input from "@/components/form/input/InputField";
import Tooltip from "@/components/ui/tooltip/Tooltip";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";
import { LockIcon, LockOpenIcon } from "@/icons";

export default function CustomerList() {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  useBreadcrumb([{ label: "Khách hàng" }]);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 500);
  const [page, setPage] = useState(1);
  const [lockTarget, setLockTarget] = useState<Customer | null>(null);

  const { data, isLoading } = useCustomers({
    search: search || undefined,
    page,
    limit: DEFAULT_PAGE_SIZE,
  });
  const updateStatusMutation = useUpdateCustomerStatus();

  async function handleConfirmToggleLock() {
    if (!lockTarget) return;
    const nextStatus = lockTarget.status === "ACTIVE" ? "BANNED" : "ACTIVE";
    try {
      await updateStatusMutation.mutateAsync({ id: lockTarget.id, payload: { status: nextStatus } });
      success(nextStatus === "BANNED" ? "Đã khóa tài khoản khách hàng." : "Đã mở khóa tài khoản khách hàng.");
      setLockTarget(null);
    } catch (err) {
      showError(getErrorMessage(err));
    }
  }

  const columns: DataTableColumn<Customer>[] = [
    {
      key: "fullName",
      header: "Tên",
      align: "left",
      className: "min-w-48",
      render: (c) => <span className="text-sm text-gray-800 dark:text-white/90">{c.fullName}</span>,
    },
    { key: "email", header: "Email", align: "left", className: "min-w-56", render: (c) => c.email },
    { key: "phone", header: "SĐT", align: "center", className: "min-w-36", render: (c) => c.phone ?? "-" },
    {
      key: "status",
      header: "Trạng thái",
      align: "center",
      className: "min-w-40",
      render: (c) => {
        const badge = USER_STATUS_LABEL[c.status];
        return <Badge color={badge.color}>{badge.label}</Badge>;
      },
    },
    {
      key: "totalOrders",
      header: "Tổng đơn",
      align: "center",
      className: "min-w-28",
      render: (c) => c.totalOrders,
    },
    {
      key: "totalSpent",
      header: "Tổng chi tiêu",
      align: "right",
      className: "min-w-36",
      render: (c) => formatPrice(c.totalSpent),
    },
    {
      key: "createdAt",
      header: "Ngày tạo",
      align: "center",
      className: "min-w-32",
      render: (c) => formatDate(c.createdAt),
    },
    {
      key: "actions",
      header: "Thao tác",
      align: "center",
      className: "min-w-24",
      stickyRight: true,
      render: (c) => (
        <Tooltip content={c.status === "ACTIVE" ? "Khóa" : "Mở khóa"}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLockTarget(c);
            }}
            className="text-gray-400 transition-colors duration-200 ease-standard hover:text-brand-500"
            aria-label={c.status === "ACTIVE" ? "Khóa tài khoản" : "Mở khóa tài khoản"}
          >
            {c.status === "ACTIVE" ? <LockOpenIcon className="h-5 w-5" /> : <LockIcon className="h-5 w-5" />}
          </button>
        </Tooltip>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4 w-96">
        <Input
          placeholder="Tìm theo tên/SĐT/email"
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <div className="rounded-2xl bg-white dark:bg-white/[0.03]">
        <DataTable
          columns={columns}
          rows={data?.data ?? []}
          rowKey={(c) => c.id}
          isLoading={isLoading}
          emptyMessage="Chưa có khách hàng nào."
          onRowClick={(c) => navigate(`/customers/${c.id}`)}
          showIndex
          indexOffset={(page - 1) * DEFAULT_PAGE_SIZE}
        />
        <div className="px-5">
          <Pagination page={page} pageSize={DEFAULT_PAGE_SIZE} total={data?.meta.total ?? 0} onChange={setPage} />
        </div>
      </div>

      <ConfirmModal
        open={lockTarget !== null}
        onClose={() => setLockTarget(null)}
        onConfirm={handleConfirmToggleLock}
        title={lockTarget?.status === "ACTIVE" ? "Khóa tài khoản khách hàng" : "Mở khóa tài khoản khách hàng"}
        description={
          lockTarget?.status === "ACTIVE"
            ? `Khách hàng "${lockTarget?.fullName}" sẽ không thể đăng nhập hoặc đặt hàng sau khi bị khóa.`
            : `Khách hàng "${lockTarget?.fullName}" sẽ đăng nhập/đặt hàng được như bình thường.`
        }
        confirmText={lockTarget?.status === "ACTIVE" ? "Khóa" : "Mở khóa"}
        danger={lockTarget?.status === "ACTIVE"}
      />
    </div>
  );
}
