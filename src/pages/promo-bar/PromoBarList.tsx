import { useState } from "react";
import type { PromoBar } from "@/types/shared-types";
import { usePromoBars, useDeletePromoBar, useReorderPromoBars } from "@/hooks/usePromoBars";
import { useDebounce } from "@/hooks/useDebounce";
import { getErrorMessage } from "@/lib/error";
import { useToast } from "@/hooks/useToast";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import { formatDate } from "@/lib/format";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { PROMO_BAR_STATUS_LABEL } from "@/lib/promoBarStatus";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Badge from "@/components/ui/badge/Badge";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";
import Pagination from "@/components/ui/pagination/Pagination";
import Tooltip from "@/components/ui/tooltip/Tooltip";
import { DataTable, type DataTableColumn } from "@/components/ui/table/DataTable";
import { PlusIcon, PencilIcon, TrashBinIcon, AngleUpIcon, AngleDownIcon, EyeIcon } from "@/icons";
import PromoBarFormModal from "./PromoBarFormModal";

export default function PromoBarList() {
  const toast = useToast();
  useBreadcrumb([{ label: "Thanh khuyến mãi" }]);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 500);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PromoBar | null>(null);
  const [viewMode, setViewMode] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PromoBar | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);

  const { data, isLoading } = usePromoBars({ search: search || undefined, page, limit });
  const promoBars = data?.data ?? [];
  const deleteMutation = useDeletePromoBar();
  const reorderMutation = useReorderPromoBars();

  function openCreate() {
    setEditing(null);
    setViewMode(false);
    setModalOpen(true);
  }

  function openEdit(promoBar: PromoBar) {
    setEditing(promoBar);
    setViewMode(false);
    setModalOpen(true);
  }

  function openView(promoBar: PromoBar) {
    setEditing(promoBar);
    setViewMode(true);
    setModalOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("Đã xóa thanh khuyến mãi.");
      setDeleteTarget(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  // Xem giải thích cơ chế đổi thứ tự (hoán đổi sortOrder với hàng liền kề trong trang hiện
  // tại) ở BannerList.tsx — áp dụng y hệt ở đây.
  async function handleMove(index: number, direction: -1 | 1) {
    const target = promoBars[index];
    const neighbor = promoBars[index + direction];
    if (!target || !neighbor) return;

    try {
      await reorderMutation.mutateAsync([
        { id: target.id, sortOrder: neighbor.sortOrder },
        { id: neighbor.id, sortOrder: target.sortOrder },
      ]);
      toast.success("Đã cập nhật thứ tự.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  const columns: DataTableColumn<PromoBar>[] = [
    {
      key: "label",
      header: "Nhãn",
      align: "center",
      className: "min-w-40",
      render: (promoBar) => (
        <span className="text-sm text-gray-800 dark:text-white/90">{promoBar.label}</span>
      ),
    },
    {
      key: "highlight",
      header: "Dòng chữ giảm giá",
      align: "center",
      className: "min-w-52",
      render: (promoBar) => (
        <span className="text-sm text-gray-800 dark:text-white/90">{promoBar.highlight}</span>
      ),
    },
    {
      key: "linkUrl",
      header: "Link đích",
      align: "center",
      className: "min-w-60",
      render: (promoBar) => (
        <span className="text-sm break-all text-gray-700 dark:text-gray-300">
          {promoBar.linkUrl}
        </span>
      ),
    },
    {
      key: "time",
      header: "Thời gian",
      align: "center",
      className: "min-w-60",
      render: (promoBar) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {formatDate(promoBar.startDate)} – {formatDate(promoBar.endDate)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      align: "center",
      className: "min-w-40",
      render: (promoBar) => (
        <Badge color={PROMO_BAR_STATUS_LABEL[promoBar.status].color}>
          {PROMO_BAR_STATUS_LABEL[promoBar.status].label}
        </Badge>
      ),
    },
    {
      key: "order",
      header: "Thứ tự",
      align: "center",
      className: "min-w-40",
      render: (promoBar) => {
        const index = promoBars.findIndex((item) => item.id === promoBar.id);
        return (
          <div className="flex items-center justify-center gap-1">
            <button
              type="button"
              disabled={index <= 0}
              onClick={(e) => {
                e.stopPropagation();
                handleMove(index, -1);
              }}
              className="flex h-8 w-8 items-center justify-center text-gray-400 transition-colors duration-200 ease-standard hover:text-brand-500 disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Đưa lên trên"
            >
              <AngleUpIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              disabled={index === -1 || index >= promoBars.length - 1}
              onClick={(e) => {
                e.stopPropagation();
                handleMove(index, 1);
              }}
              className="flex h-8 w-8 items-center justify-center text-gray-400 transition-colors duration-200 ease-standard hover:text-brand-500 disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Đưa xuống dưới"
            >
              <AngleDownIcon className="h-5 w-5" />
            </button>
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "Thao tác",
      className: "min-w-24",
      stickyRight: true,
      render: (promoBar) => (
        <div className="flex items-center justify-center gap-3">
          <Tooltip content="Xem">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openView(promoBar);
              }}
              className="text-gray-400 transition-colors duration-200 ease-standard hover:text-brand-500"
              aria-label="Xem thanh khuyến mãi"
            >
              <EyeIcon className="h-6 w-6" />
            </button>
          </Tooltip>
          <Tooltip content="Sửa">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openEdit(promoBar);
              }}
              className="text-gray-400 transition-colors duration-200 ease-standard hover:text-brand-500"
              aria-label="Sửa thanh khuyến mãi"
            >
              <PencilIcon className="h-6 w-6" />
            </button>
          </Tooltip>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget(promoBar);
            }}
            className="text-gray-400 transition-colors duration-200 ease-standard hover:text-error-500"
            aria-label="Xóa thanh khuyến mãi"
          >
            <TrashBinIcon className="h-6 w-6" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div className="w-96">
          <Input
            placeholder="Tìm theo nhãn"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Button variant="primary" startIcon={<PlusIcon className="h-6 w-6" />} onClick={openCreate}>
          Thêm thanh khuyến mãi
        </Button>
      </div>

      <div className="flex flex-1 flex-col rounded-2xl bg-white">
        <DataTable
          columns={columns}
          rows={promoBars}
          rowKey={(promoBar) => promoBar.id}
          isLoading={isLoading}
          emptyMessage="Chưa có thanh khuyến mãi nào."
          onRowClick={openView}
          showIndex
          indexOffset={(page - 1) * limit}
        />
        <div className="px-5">
          <Pagination
            page={page}
            pageSize={limit}
            total={data?.meta.total ?? 0}
            onChange={setPage}
            onPageSizeChange={(size) => {
              setLimit(size);
              setPage(1);
            }}
          />
        </div>
      </div>

      <PromoBarFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editing={editing}
        viewOnly={viewMode}
      />

      <ConfirmModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Thông báo"
        description="Bạn có chắc chắn muốn xóa thanh khuyến mãi này không?"
        confirmText="Đồng ý"
        cancelText="Hủy"
        danger
      />
    </div>
  );
}
