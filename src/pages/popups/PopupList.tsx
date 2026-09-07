import { useState } from "react";
import type { Popup } from "@/types/shared-types";
import { usePopups, useDeletePopup, useReorderPopups } from "@/hooks/usePopups";
import { useDebounce } from "@/hooks/useDebounce";
import { getErrorMessage } from "@/lib/error";
import { useToast } from "@/hooks/useToast";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import { formatDate } from "@/lib/format";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { POPUP_STATUS_LABEL } from "@/lib/popupStatus";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Badge from "@/components/ui/badge/Badge";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";
import Pagination from "@/components/ui/pagination/Pagination";
import Tooltip from "@/components/ui/tooltip/Tooltip";
import { DataTable, type DataTableColumn } from "@/components/ui/table/DataTable";
import { PlusIcon, PencilIcon, TrashBinIcon, AngleUpIcon, AngleDownIcon, EyeIcon } from "@/icons";
import PopupFormModal from "./PopupFormModal";

export default function PopupList() {
  const toast = useToast();
  useBreadcrumb([{ label: "Popup marketing" }]);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 500);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Popup | null>(null);
  const [viewMode, setViewMode] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Popup | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);

  const { data, isLoading } = usePopups({ search: search || undefined, page, limit });
  const popups = data?.data ?? [];
  const deleteMutation = useDeletePopup();
  const reorderMutation = useReorderPopups();

  function openCreate() {
    setEditing(null);
    setViewMode(false);
    setModalOpen(true);
  }

  function openEdit(popup: Popup) {
    setEditing(popup);
    setViewMode(false);
    setModalOpen(true);
  }

  function openView(popup: Popup) {
    setEditing(popup);
    setViewMode(true);
    setModalOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("Đã xóa popup.");
      setDeleteTarget(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  // Xem giải thích cơ chế đổi thứ tự (hoán đổi sortOrder với hàng liền kề trong trang hiện
  // tại) ở BannerList.tsx — áp dụng y hệt ở đây. Chỉ 1 popup hiển thị tại 1 thời điểm
  // (sortOrder thấp nhất trong các popup RUNNING) nên thứ tự này là mức ưu tiên hiển thị.
  async function handleMove(index: number, direction: -1 | 1) {
    const target = popups[index];
    const neighbor = popups[index + direction];
    if (!target || !neighbor) return;

    try {
      await reorderMutation.mutateAsync([
        { id: target.id, sortOrder: neighbor.sortOrder },
        { id: neighbor.id, sortOrder: target.sortOrder },
      ]);
      toast.success("Đã cập nhật thứ tự popup.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  const columns: DataTableColumn<Popup>[] = [
    {
      key: "image",
      header: "Ảnh",
      align: "center",
      className: "min-w-40",
      render: (popup) => (
        <img src={popup.imageUrl} className="mx-auto h-20 w-auto rounded-md" alt="" />
      ),
    },
    {
      key: "title",
      header: "Tiêu đề",
      align: "center",
      className: "min-w-72",
      render: (popup) => (
        <span className="text-sm text-gray-800 dark:text-white/90">{popup.title}</span>
      ),
    },
    {
      key: "discountCode",
      header: "Mã giảm giá",
      align: "center",
      className: "min-w-40",
      render: (popup) =>
        popup.discountCode ? (
          <span className="text-sm text-gray-700 dark:text-gray-300">{popup.discountCode}</span>
        ) : (
          <span className="text-sm text-gray-400">—</span>
        ),
    },
    {
      key: "time",
      header: "Thời gian",
      align: "center",
      className: "min-w-60",
      render: (popup) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {formatDate(popup.startDate)} – {formatDate(popup.endDate)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      align: "center",
      className: "min-w-40",
      render: (popup) => (
        <Badge color={POPUP_STATUS_LABEL[popup.status].color}>
          {POPUP_STATUS_LABEL[popup.status].label}
        </Badge>
      ),
    },
    {
      key: "order",
      header: "Ưu tiên hiển thị",
      align: "center",
      className: "min-w-40",
      render: (popup) => {
        const index = popups.findIndex((item) => item.id === popup.id);
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
              aria-label="Đưa popup lên trên"
            >
              <AngleUpIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              disabled={index === -1 || index >= popups.length - 1}
              onClick={(e) => {
                e.stopPropagation();
                handleMove(index, 1);
              }}
              className="flex h-8 w-8 items-center justify-center text-gray-400 transition-colors duration-200 ease-standard hover:text-brand-500 disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Đưa popup xuống dưới"
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
      render: (popup) => (
        <div className="flex items-center justify-center gap-3">
          <Tooltip content="Xem">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openView(popup);
              }}
              className="text-gray-400 transition-colors duration-200 ease-standard hover:text-brand-500"
              aria-label="Xem popup"
            >
              <EyeIcon className="h-6 w-6" />
            </button>
          </Tooltip>
          <Tooltip content="Sửa">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openEdit(popup);
              }}
              className="text-gray-400 transition-colors duration-200 ease-standard hover:text-brand-500"
              aria-label="Sửa popup"
            >
              <PencilIcon className="h-6 w-6" />
            </button>
          </Tooltip>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget(popup);
            }}
            className="text-gray-400 transition-colors duration-200 ease-standard hover:text-error-500"
            aria-label="Xóa popup"
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
            placeholder="Tìm theo tiêu đề popup"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Button variant="primary" startIcon={<PlusIcon className="h-6 w-6" />} onClick={openCreate}>
          Thêm popup
        </Button>
      </div>

      <div className="flex flex-1 flex-col rounded-2xl bg-white">
        <DataTable
          columns={columns}
          rows={popups}
          rowKey={(popup) => popup.id}
          isLoading={isLoading}
          emptyMessage="Chưa có popup nào."
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

      <PopupFormModal
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
        description="Bạn có chắc chắn muốn xóa popup này không?"
        confirmText="Đồng ý"
        cancelText="Hủy"
        danger
      />
    </div>
  );
}
