import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { CustomerOrderSummary } from "@/types/shared-types";
import { useCustomer, useUpdateCustomerStatus } from "@/hooks/useCustomers";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import { useToast } from "@/hooks/useToast";
import { USER_STATUS_LABEL } from "@/lib/userStatus";
import { ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL } from "@/lib/orderStatus";
import { formatDate, formatPrice } from "@/lib/format";
import { getErrorMessage } from "@/lib/error";
import { DataTable, type DataTableColumn } from "@/components/ui/table/DataTable";
import ComponentCard from "@/components/common/ComponentCard";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Spinner from "@/components/ui/spinner/Spinner";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";

export default function CustomerDetail() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const { data: customer, isLoading, isError } = useCustomer(id);
  const updateStatusMutation = useUpdateCustomerStatus();
  const [confirmingLock, setConfirmingLock] = useState(false);

  useBreadcrumb([
    { label: "Khách hàng", href: "/customers" },
    { label: customer?.fullName ?? "Chi tiết" },
  ]);

  async function handleConfirmToggleLock() {
    if (!customer) return;
    const nextStatus = customer.status === "ACTIVE" ? "BANNED" : "ACTIVE";
    try {
      await updateStatusMutation.mutateAsync({ id: customer.id, payload: { status: nextStatus } });
      success(nextStatus === "BANNED" ? "Đã khóa tài khoản khách hàng." : "Đã mở khóa tài khoản khách hàng.");
      setConfirmingLock(false);
    } catch (err) {
      showError(getErrorMessage(err));
    }
  }

  if (isLoading) {
    return <Spinner className="text-brand-500" />;
  }

  if (isError || !customer) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <p className="text-sm text-gray-500 dark:text-gray-400">Không tìm thấy khách hàng.</p>
        <Button variant="outline" onClick={() => navigate("/customers")}>
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  const statusBadge = USER_STATUS_LABEL[customer.status];

  const orderColumns: DataTableColumn<CustomerOrderSummary>[] = [
    { key: "orderCode", header: "Mã đơn", align: "left", className: "min-w-40", render: (o) => o.orderCode },
    {
      key: "status",
      header: "Trạng thái đơn",
      align: "center",
      className: "min-w-36",
      render: (o) => {
        const badge = ORDER_STATUS_LABEL[o.status];
        return <Badge color={badge.color}>{badge.label}</Badge>;
      },
    },
    {
      key: "paymentStatus",
      header: "Thanh toán",
      align: "center",
      className: "min-w-36",
      render: (o) => {
        const badge = PAYMENT_STATUS_LABEL[o.paymentStatus];
        return <Badge color={badge.color}>{badge.label}</Badge>;
      },
    },
    { key: "itemCount", header: "Số SP", align: "center", className: "min-w-20", render: (o) => o.itemCount },
    {
      key: "totalAmount",
      header: "Tổng tiền",
      align: "right",
      className: "min-w-32",
      render: (o) => formatPrice(o.totalAmount),
    },
    {
      key: "createdAt",
      header: "Ngày đặt",
      align: "center",
      className: "min-w-32",
      render: (o) => formatDate(o.createdAt),
    },
  ];

  return (
    <div className="space-y-6">
      <ComponentCard title="Hồ sơ khách hàng">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
            <Field label="Họ tên" value={customer.fullName} />
            <Field label="Email" value={customer.email} />
            <Field label="Số điện thoại" value={customer.phone ?? "-"} />
            <Field
              label="Trạng thái"
              value={<Badge color={statusBadge.color}>{statusBadge.label}</Badge>}
            />
            <Field
              label="Xác thực email"
              value={customer.emailVerifiedAt ? formatDate(customer.emailVerifiedAt) : "Chưa xác thực"}
            />
            <Field label="Ngày tạo" value={formatDate(customer.createdAt)} />
          </div>
          <Button
            variant={customer.status === "ACTIVE" ? "outline" : "primary"}
            onClick={() => setConfirmingLock(true)}
          >
            {customer.status === "ACTIVE" ? "Khóa tài khoản" : "Mở khóa tài khoản"}
          </Button>
        </div>
      </ComponentCard>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ComponentCard title="Tổng số đơn">
          <p className="text-2xl font-semibold text-gray-800 dark:text-white/90">{customer.totalOrders}</p>
        </ComponentCard>
        <ComponentCard title="Tổng giá trị đã mua">
          <p className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            {formatPrice(customer.totalSpent)}
          </p>
        </ComponentCard>
      </div>

      <div className="rounded-2xl bg-white dark:bg-white/[0.03]">
        <div className="px-6 py-5">
          <h3 className="text-base font-medium text-gray-800 dark:text-white/90">Lịch sử đơn hàng</h3>
        </div>
        <DataTable
          columns={orderColumns}
          rows={customer.orders}
          rowKey={(o) => o.id}
          emptyMessage="Khách hàng chưa có đơn hàng nào."
        />
      </div>

      <ConfirmModal
        open={confirmingLock}
        onClose={() => setConfirmingLock(false)}
        onConfirm={handleConfirmToggleLock}
        title={customer.status === "ACTIVE" ? "Khóa tài khoản khách hàng" : "Mở khóa tài khoản khách hàng"}
        description={
          customer.status === "ACTIVE"
            ? `Khách hàng "${customer.fullName}" sẽ không thể đăng nhập hoặc đặt hàng sau khi bị khóa.`
            : `Khách hàng "${customer.fullName}" sẽ đăng nhập/đặt hàng được như bình thường.`
        }
        confirmText={customer.status === "ACTIVE" ? "Khóa" : "Mở khóa"}
        danger={customer.status === "ACTIVE"}
      />
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <div className="mt-1 text-sm text-gray-800 dark:text-white/90">{value}</div>
    </div>
  );
}
