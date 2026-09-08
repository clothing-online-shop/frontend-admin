import { useMemo, useState } from "react";
import type { Color } from "@/types/shared-types";
import { useColors, useDeleteColor } from "@/hooks/useColors";
import { useDebounce } from "@/hooks/useDebounce";
import { getErrorMessage } from "@/lib/error";
import { useToast } from "@/hooks/useToast";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";
import { DataTable, type DataTableColumn } from "@/components/ui/table/DataTable";
import { PlusIcon, PencilIcon, TrashBinIcon, EyeIcon } from "@/icons";
import ColorFormModal from "./ColorFormModal";

export default function ColorList() {
  const toast = useToast();
  useBreadcrumb([{ label: "Màu sắc" }]);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 500);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Color | null>(null);
  const [viewMode, setViewMode] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Color | null>(null);

  const { data, isLoading } = useColors(search || undefined);
  const deleteMutation = useDeleteColor();

  function openCreate() {
    setEditing(null);
    setViewMode(false);
    setModalOpen(true);
  }

  function openEdit(color: Color) {
    setEditing(color);
    setViewMode(false);
    setModalOpen(true);
  }

  function openView(color: Color) {
    setEditing(color);
    setViewMode(true);
    setModalOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("Đã xóa màu");
      setDeleteTarget(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  const columns = useMemo<DataTableColumn<Color>[]>(
    () => [
      {
        key: "swatch",
        header: "Màu",
        align: "center",
        className: "min-w-24",
        render: (color) => (
          <span
            className="mx-auto block h-8 w-8 rounded-full border border-gray-300 dark:border-gray-700"
            style={{ backgroundColor: color.hexCode }}
          />
        ),
      },
      {
        key: "name",
        header: "Tên",
        align: "center",
        className: "min-w-72",
        render: (color) => (
          <span className="text-sm text-gray-800 dark:text-white/90">{color.name}</span>
        ),
      },
      {
        key: "hexCode",
        header: "Mã màu",
        align: "center",
        className: "min-w-40",
        render: (color) => (
          <span className="text-sm text-gray-700 uppercase dark:text-gray-300">{color.hexCode}</span>
        ),
      },
      {
        key: "actions",
        header: "Thao tác",
        className: "min-w-24",
        stickyRight: true,
        render: (color) => (
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openView(color);
              }}
              className="text-gray-400 transition-colors duration-200 ease-standard hover:text-brand-500"
              aria-label="Xem màu"
            >
              <EyeIcon className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openEdit(color);
              }}
              className="text-gray-400 transition-colors duration-200 ease-standard hover:text-brand-500"
              aria-label="Sửa màu"
            >
              <PencilIcon className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteTarget(color);
              }}
              className="text-gray-400 transition-colors duration-200 ease-standard hover:text-error-500"
              aria-label="Xóa màu"
            >
              <TrashBinIcon className="h-6 w-6" />
            </button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="w-96">
          <Input
            placeholder="Tìm theo tên màu"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <Button variant="primary" startIcon={<PlusIcon className="h-6 w-6" />} onClick={openCreate}>
          Thêm màu
        </Button>
      </div>

      <div className="flex flex-1 flex-col rounded-2xl bg-white">
        <DataTable
          columns={columns}
          rows={data ?? []}
          rowKey={(color) => color.id}
          isLoading={isLoading}
          emptyMessage="Chưa có màu nào."
          onRowClick={openView}
          showIndex
        />
      </div>

      <ColorFormModal
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
        description="Bạn có chắc chắn muốn xóa màu này không? Chỉ xóa được nếu không còn biến thể sản phẩm nào đang dùng màu này."
        confirmText="Đồng ý"
        cancelText="Hủy"
        danger
      />
    </div>
  );
}
