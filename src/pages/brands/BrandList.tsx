import { useMemo, useState } from "react";
import type { Brand } from "@/types/shared-types";
import { useBrands, useDeleteBrand } from "@/hooks/useBrands";
import { useDebounce } from "@/hooks/useDebounce";
import { getErrorMessage } from "@/lib/error";
import { useToast } from "@/hooks/useToast";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";
import { DataTable, type DataTableColumn } from "@/components/ui/table/DataTable";
import { PlusIcon, PencilIcon, TrashBinIcon, EyeIcon } from "@/icons";
import BrandFormModal from "./BrandFormModal";

export default function BrandList() {
  const toast = useToast();
  useBreadcrumb([{ label: "Thương hiệu" }]);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 500);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [viewMode, setViewMode] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Brand | null>(null);

  const { data, isLoading } = useBrands(search || undefined);
  const deleteMutation = useDeleteBrand();

  function openCreate() {
    setEditing(null);
    setViewMode(false);
    setModalOpen(true);
  }

  function openEdit(brand: Brand) {
    setEditing(brand);
    setViewMode(false);
    setModalOpen(true);
  }

  function openView(brand: Brand) {
    setEditing(brand);
    setViewMode(true);
    setModalOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("Đã xóa thương hiệu");
      setDeleteTarget(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  const columns = useMemo<DataTableColumn<Brand>[]>(
    () => [
      {
        key: "logo",
        header: "Logo",
        align: "center",
        className: "min-w-40",
        render: (brand) =>
          brand.logo ? (
            <img
              src={brand.logo}
              className="mx-auto h-32 w-24 rounded-md object-contain"
              alt=""
            />
          ) : (
            <div className="mx-auto h-32 w-24 rounded-md bg-gray-100 dark:bg-gray-800" />
          ),
      },
      {
        key: "name",
        header: "Tên",
        align: "center",
        className: "min-w-72",
        render: (brand) => (
          <span className="text-sm text-gray-800 dark:text-white/90">{brand.name}</span>
        ),
      },
      {
        key: "origin",
        header: "Xuất xứ",
        align: "center",
        className: "min-w-72",
        render: (brand) => (
          <span className="text-sm text-gray-700 dark:text-gray-300">{brand.origin ?? "—"}</span>
        ),
      },
      {
        key: "description",
        header: "Mô tả",
        align: "center",
        className: "min-w-72",
        render: (brand) => (
          <span className="line-clamp-3 w-full text-sm text-gray-700 dark:text-gray-300">
            {brand.description ?? "—"}
          </span>
        ),
      },
      {
        key: "actions",
        header: "Thao tác",
        className: "min-w-24",
        stickyRight: true,
        render: (brand) => (
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openView(brand);
              }}
              className="text-gray-400 transition-colors duration-200 ease-standard hover:text-brand-500"
              aria-label="Xem thương hiệu"
            >
              <EyeIcon className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openEdit(brand);
              }}
              className="text-gray-400 transition-colors duration-200 ease-standard hover:text-brand-500"
              aria-label="Sửa thương hiệu"
            >
              <PencilIcon className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteTarget(brand);
              }}
              className="text-gray-400 transition-colors duration-200 ease-standard hover:text-error-500"
              aria-label="Xóa thương hiệu"
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
            placeholder="Tìm theo tên thương hiệu"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <Button variant="primary" startIcon={<PlusIcon className="h-6 w-6" />} onClick={openCreate}>
          Thêm thương hiệu
        </Button>
      </div>

      <div className="flex flex-1 flex-col rounded-2xl bg-white">
        <DataTable
          columns={columns}
          rows={data ?? []}
          rowKey={(brand) => brand.id}
          isLoading={isLoading}
          emptyMessage="Chưa có thương hiệu nào."
          onRowClick={openView}
        />
      </div>

      <BrandFormModal
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
        description="Bạn có chắc chắn muốn xóa thương hiệu này không?"
        confirmText="Đồng ý"
        cancelText="Hủy"
        danger
      />
    </div>
  );
}
