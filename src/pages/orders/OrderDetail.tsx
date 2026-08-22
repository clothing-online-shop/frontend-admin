import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { OrderItemDetail, OrderStatus, OrderStatusHistoryEntry } from "@/types/shared-types";
import { useOrderDetail } from "@/hooks/useOrders";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import { formatDateTime, formatPrice } from "@/lib/format";
import {
  ORDER_STATUS_ACTION,
  ORDER_STATUS_LABEL,
  ORDER_STATUS_TRANSITIONS,
  PAYMENT_METHOD_LABEL,
  PAYMENT_STATUS_LABEL,
} from "@/lib/orderStatus";
import { DataTable, type DataTableColumn } from "@/components/ui/table/DataTable";
import ComponentCard from "@/components/common/ComponentCard";
import UpdateOrderStatusModal from "@/components/common/UpdateOrderStatusModal";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Spinner from "@/components/ui/spinner/Spinner";

export default function OrderDetail() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: order, isLoading, isError } = useOrderDetail(id);
  const [targetStatus, setTargetStatus] = useState<OrderStatus | null>(null);

  useBreadcrumb([
    { label: "Đơn hàng", href: "/orders" },
    { label: order?.orderCode ?? "Chi tiết" },
  ]);

  if (isLoading) {
    return <Spinner className="text-brand-500" />;
  }

  if (isError || !order) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <p className="text-sm text-gray-500 dark:text-gray-400">Không tìm thấy đơn hàng.</p>
        <Button variant="outline" onClick={() => navigate("/orders")}>
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  const statusBadge = ORDER_STATUS_LABEL[order.status];
  const paymentStatusBadge = PAYMENT_STATUS_LABEL[order.paymentStatus];
  const paymentMethodBadge = PAYMENT_METHOD_LABEL[order.paymentMethod];

  // Bước tiếp theo trong luồng chính (khác CANCELLED) — PENDING → "Xác nhận đơn",
  // CONFIRMED → "Bắt đầu giao", SHIPPING → "Hoàn tất đơn". null nếu đơn đã ở trạng thái
  // cuối (COMPLETED/CANCELLED), không hiện nút nào cả.
  const nextStatuses = ORDER_STATUS_TRANSITIONS[order.status];
  const forwardStatus = nextStatuses.find((status) => status !== "CANCELLED") ?? null;
  const canCancel = nextStatuses.includes("CANCELLED");

  const itemColumns: DataTableColumn<OrderItemDetail>[] = [
    {
      key: "product",
      header: "Sản phẩm",
      align: "left",
      className: "min-w-72",
      render: (item) => (
        <span className="text-sm text-gray-800 dark:text-white/90">
          {item.productName} — {item.size}/{item.color} ({item.variantSku})
        </span>
      ),
    },
    {
      key: "quantity",
      header: "Số lượng",
      align: "center",
      className: "min-w-24",
      render: (item) => item.quantity,
    },
    {
      key: "priceAtPurchase",
      header: "Đơn giá",
      align: "center",
      className: "min-w-32",
      render: (item) => formatPrice(item.priceAtPurchase),
    },
    {
      key: "lineTotal",
      header: "Thành tiền",
      align: "center",
      className: "min-w-32",
      render: (item) => (
        <span className="font-semibold text-primary/80 dark:text-primary">
          {formatPrice(item.priceAtPurchase * item.quantity)}
        </span>
      ),
    },
  ];

  const historyColumns: DataTableColumn<OrderStatusHistoryEntry>[] = [
    {
      key: "createdAt",
      header: "Thời gian",
      align: "center",
      className: "min-w-40",
      render: (h) => formatDateTime(h.createdAt),
    },
    {
      key: "transition",
      header: "Chuyển trạng thái",
      align: "center",
      className: "min-w-56",
      render: (h) => (
        <div className="flex items-center justify-center gap-2">
          {h.fromStatus ? (
            <Badge color={ORDER_STATUS_LABEL[h.fromStatus].color}>
              {ORDER_STATUS_LABEL[h.fromStatus].label}
            </Badge>
          ) : (
            <span className="text-xs text-gray-400 dark:text-gray-500">Tạo đơn</span>
          )}
          <span className="text-gray-400">→</span>
          <Badge color={ORDER_STATUS_LABEL[h.toStatus].color}>
            {ORDER_STATUS_LABEL[h.toStatus].label}
          </Badge>
        </div>
      ),
    },
    {
      key: "changedByName",
      header: "Người thực hiện",
      align: "center",
      className: "min-w-40",
      render: (h) => h.changedByName ?? "Hệ thống",
    },
    {
      key: "note",
      header: "Ghi chú",
      align: "left",
      className: "min-w-56",
      render: (h) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">{h.note ?? "—"}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <ComponentCard title="Thông tin đơn hàng">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Mã đơn" value={order.orderCode} />
            <Field
              label="Trạng thái"
              value={<Badge color={statusBadge.color}>{statusBadge.label}</Badge>}
            />
            <Field label="Ngày đặt" value={formatDateTime(order.createdAt)} />
            <Field label="Cập nhật gần nhất" value={formatDateTime(order.updatedAt)} />
            <Field
              label="Tổng tiền"
              value={
                <span className="font-semibold text-gray-800 dark:text-white/90">
                  {formatPrice(order.totalAmount)}
                </span>
              }
            />
          </div>
          {(forwardStatus || canCancel) && (
            <div className="flex gap-3">
              {canCancel && (
                <Button
                  variant="outline"
                  className="text-error-500 ring-1 ring-inset ring-error-300 hover:bg-error-50 dark:ring-error-800/50 dark:hover:bg-error-500/10"
                  onClick={() => setTargetStatus("CANCELLED")}
                >
                  Hủy đơn
                </Button>
              )}
              {forwardStatus && (
                <Button variant="primary" onClick={() => setTargetStatus(forwardStatus)}>
                  {ORDER_STATUS_ACTION[forwardStatus]?.buttonLabel}
                </Button>
              )}
            </div>
          )}
        </div>
      </ComponentCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ComponentCard title="Khách hàng">
          <div className="grid grid-cols-1 gap-y-3">
            <Field label="Họ tên" value={order.customer.fullName} />
            <Field label="Email" value={order.customer.email} />
            <Field label="Số điện thoại" value={order.customer.phone ?? "—"} />
          </div>
        </ComponentCard>

        <ComponentCard title="Thanh toán">
          <div className="grid grid-cols-1 gap-y-3 sm:grid-cols-2">
            <Field
              label="Phương thức"
              value={
                paymentMethodBadge ? (
                  <Badge color={paymentMethodBadge.color}>{paymentMethodBadge.label}</Badge>
                ) : (
                  order.paymentMethod
                )
              }
            />
            <Field
              label="Trạng thái thanh toán"
              value={<Badge color={paymentStatusBadge.color}>{paymentStatusBadge.label}</Badge>}
            />
          </div>
        </ComponentCard>
      </div>

      <ComponentCard title="Địa chỉ giao / Vận chuyển">
        {/* Order chưa có mã vận đơn/carrier thật (chưa tích hợp tạo đơn vận chuyển GHN) —
            chỉ hiển thị địa chỉ đã lưu lúc đặt hàng, trạng thái vận chuyển xem ở lịch sử
            trạng thái bên dưới (chuyển sang "Đang giao" = đã bắt đầu vận chuyển). */}
        <p className="text-sm text-gray-700 dark:text-gray-300">{order.shippingAddress}</p>
      </ComponentCard>

      <div className="rounded-2xl bg-white dark:bg-white/[0.03]">
        <div className="px-6 py-5">
          <h3 className="text-base font-medium text-gray-800 dark:text-white/90">Sản phẩm</h3>
        </div>
        <DataTable columns={itemColumns} rows={order.items} rowKey={(item) => item.id} />
      </div>

      <div className="rounded-2xl bg-white dark:bg-white/[0.03]">
        <div className="px-6 py-5">
          <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
            Lịch sử trạng thái
          </h3>
        </div>
        <DataTable
          columns={historyColumns}
          rows={order.statusHistories}
          rowKey={(h) => h.id}
          emptyMessage="Chưa có lịch sử trạng thái."
        />
      </div>

      <UpdateOrderStatusModal
        open={targetStatus !== null}
        onClose={() => setTargetStatus(null)}
        order={{ id: order.id, orderCode: order.orderCode }}
        targetStatus={targetStatus}
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
