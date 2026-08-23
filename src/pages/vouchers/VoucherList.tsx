import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DiscountType, VoucherStatus, type Voucher } from "@/types/shared-types";
import { useDeleteVoucher, useToggleVoucherActive, useVouchers } from "@/hooks/useVouchers";
import { useDebounce } from "@/hooks/useDebounce";
import { getErrorMessage } from "@/lib/error";
import { useToast } from "@/hooks/useToast";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import { formatDate, formatPrice } from "@/lib/format";
import { VOUCHER_STATUS_LABEL } from "@/lib/voucherStatus";
import { DISCOUNT_TYPE_LABEL, DISCOUNT_TYPE_OPTIONS } from "@/lib/voucherDiscountType";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Switch from "@/components/form/switch/Switch";
import Badge from "@/components/ui/badge/Badge";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";
import Tooltip from "@/components/ui/tooltip/Tooltip";
import { DataTable, type DataTableColumn } from "@/components/ui/table/DataTable";
import { PlusIcon, PencilIcon, TrashBinIcon, EyeIcon } from "@/icons";

// Select dùng chung chỉ nhận option.value dạng string — status thật (state + query param)
// vẫn là number, ép qua lại đúng ở ranh giới UI này (giống ProductFilterBar.tsx).
const STATUS_OPTIONS = Object.values(VoucherStatus).map((value) => ({
  value: String(value),
  label: VOUCHER_STATUS_LABEL[value].label,
}));

function formatDiscountValue(voucher: Voucher): string {
  return voucher.discountType === DiscountType.PERCENTAGE
    ? `${voucher.discountValue}%${
        voucher.maxDiscountAmount ? ` (tối đa ${formatPrice(voucher.maxDiscountAmount)})` : ""
      }`
    : formatPrice(voucher.discountValue);
}

export default function VoucherList() {
  const toast = useToast();
  const navigate = useNavigate();
  useBreadcrumb([{ label: "Voucher" }]);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 500);
  const [status, setStatus] = useState<VoucherStatus | undefined>();
  const [discountType, setDiscountType] = useState<DiscountType | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Voucher | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const { data, isLoading } = useVouchers({ search: search || undefined, status, discountType });
  const vouchers = data ?? [];
  const deleteMutation = useDeleteVoucher();
  const toggleMutation = useToggleVoucherActive();

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("Đã xóa voucher.");
      setDeleteTarget(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function handleToggleActive(voucher: Voucher) {
    setTogglingId(voucher.id);
    try {
      await toggleMutation.mutateAsync(voucher.id);
      toast.success(voucher.isActive ? "Đã tắt voucher." : "Đã bật voucher.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setTogglingId(null);
    }
  }

  const columns: DataTableColumn<Voucher>[] = [
    {
      key: "image",
      header: "Ảnh",
      align: "center",
      className: "min-w-24",
      render: (voucher) =>
        voucher.imageUrl ? (
          <img src={voucher.imageUrl} className="mx-auto h-12 w-12 rounded-md object-cover" alt="" />
        ) : (
          <span className="text-sm text-gray-400">—</span>
        ),
    },
    {
      key: "code",
      header: "Mã voucher",
      align: "center",
      className: "min-w-40",
      render: (voucher) => (
        <span className="font-medium text-sm text-gray-800 dark:text-white/90">
          {voucher.code}
        </span>
      ),
    },
    {
      key: "discountType",
      header: "Loại giảm",
      align: "center",
      className: "min-w-56",
      render: (voucher) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {DISCOUNT_TYPE_LABEL[voucher.discountType]}
        </span>
      ),
    },
    {
      key: "discountValue",
      header: "Giá trị giảm",
      align: "center",
      className: "min-w-48",
      render: (voucher) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {formatDiscountValue(voucher)}
        </span>
      ),
    },
    {
      key: "minOrderValue",
      header: "Đơn tối thiểu",
      align: "center",
      className: "min-w-36",
      render: (voucher) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {voucher.minOrderValue > 0 ? formatPrice(voucher.minOrderValue) : "—"}
        </span>
      ),
    },
    {
      key: "time",
      header: "Thời hạn",
      align: "center",
      className: "min-w-96",
      render: (voucher) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {formatDate(voucher.startsAt)} –{" "}
          {voucher.expiresAt ? formatDate(voucher.expiresAt) : "Không giới hạn"}
        </span>
      ),
    },
    {
      key: "totalUsage",
      header: "Tổng lượt dùng",
      align: "center",
      className: "min-w-28",
      render: (voucher) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {voucher.usedCount}/{voucher.usageLimit ?? "∞"}
        </span>
      ),
    },
    {
      key: "perCustomerLimit",
      header: "Lượt dùng/khách",
      align: "center",
      className: "min-w-28",
      render: (voucher) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {voucher.perCustomerLimit ?? "∞"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      align: "center",
      className: "min-w-72",
      render: (voucher) => (
        <Badge color={VOUCHER_STATUS_LABEL[voucher.status].color}>
          {VOUCHER_STATUS_LABEL[voucher.status].label}
        </Badge>
      ),
    },
    {
      key: "active",
      header: "Hoạt động",
      align: "center",
      className: "min-w-24",
      render: (voucher) => (
        // stopPropagation — dòng bảng đã gắn onRowClick điều hướng sang trang chi tiết,
        // không được để việc bật/tắt nhanh ở đây vô tình kích hoạt điều hướng đó.
        <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
          <Switch
            label=""
            checked={voucher.isActive}
            disabled={togglingId === voucher.id}
            onChange={() => handleToggleActive(voucher)}
          />
        </div>
      ),
    },
    {
      key: "actions",
      header: "Thao tác",
      className: "min-w-32",
      stickyRight: true,
      render: (voucher) => (
        <div className="flex items-center justify-center gap-3">
          <Tooltip content="Xem">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/vouchers/${voucher.id}`);
              }}
              className="text-gray-400 transition-colors duration-200 ease-standard hover:text-brand-500"
              aria-label="Xem voucher"
            >
              <EyeIcon className="h-6 w-6" />
            </button>
          </Tooltip>
          <Tooltip content="Sửa">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/vouchers/${voucher.id}/edit`);
              }}
              className="text-gray-400 transition-colors duration-200 ease-standard hover:text-brand-500"
              aria-label="Sửa voucher"
            >
              <PencilIcon className="h-6 w-6" />
            </button>
          </Tooltip>
          <Tooltip content={voucher.usedCount > 0 ? "Đã có lượt dùng, không thể xóa" : "Xóa"}>
            <button
              type="button"
              disabled={voucher.usedCount > 0}
              onClick={(e) => {
                e.stopPropagation();
                setDeleteTarget(voucher);
              }}
              className="text-gray-400 transition-colors duration-200 ease-standard hover:text-error-500 disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Xóa voucher"
            >
              <TrashBinIcon className="h-6 w-6" />
            </button>
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-64">
            <Input
              placeholder="Tìm theo mã voucher"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <div className="w-48">
            <Select
              options={DISCOUNT_TYPE_OPTIONS}
              value={discountType}
              onChange={(value) => setDiscountType(value as DiscountType | undefined)}
              placeholder="Loại giảm giá"
              allowClear
              placeholderColor="gray-700"
            />
          </div>
          <div className="w-48">
            <Select
              options={STATUS_OPTIONS}
              value={status !== undefined ? String(status) : undefined}
              onChange={(value) =>
                setStatus(value !== undefined ? (Number(value) as VoucherStatus) : undefined)
              }
              placeholder="Tất cả trạng thái"
              allowClear
              placeholderColor="gray-700"
            />
          </div>
        </div>
        <Button
          variant="primary"
          startIcon={<PlusIcon className="h-6 w-6" />}
          onClick={() => navigate("/vouchers/new")}
        >
          Thêm voucher
        </Button>
      </div>

      <div className="flex flex-1 flex-col rounded-2xl bg-white">
        <DataTable
          columns={columns}
          rows={vouchers}
          rowKey={(voucher) => voucher.id}
          isLoading={isLoading}
          emptyMessage="Chưa có voucher nào."
          onRowClick={(voucher) => navigate(`/vouchers/${voucher.id}`)}
          showIndex
        />
      </div>

      <ConfirmModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Thông báo"
        description="Bạn có chắc chắn muốn xóa voucher này không?"
        confirmText="Đồng ý"
        cancelText="Hủy"
        danger
      />
    </div>
  );
}
