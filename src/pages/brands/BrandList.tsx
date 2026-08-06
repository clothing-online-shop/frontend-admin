import { useMemo, useState } from "react";
import type { Brand } from "@/lib/shared-types";
import { useBrands, useDeleteBrand } from "@/hooks/useBrands";
import { useDebounce } from "@/hooks/useDebounce";
import { getErrorMessage } from "@/lib/error";
import { useToast } from "@/hooks/useToast";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";
import { DataTable, type DataTableColumn } from "@/components/ui/table/DataTable";
import { PlusIcon, PencilIcon, TrashBinIcon } from "@/icons";
import BrandFormModal from "./BrandFormModal";

export default function BrandList() {
  const toast = useToast();
  useBreadcrumb([{ label: "Thương hiệu" }]);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 500);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Brand | null>(null);

  const { data, isLoading } = useBrands(search || undefined);
  const deleteMutation = useDeleteBrand();

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(brand: Brand) {
    setEditing(brand);
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
        render: (brand) =>
          brand.logo ? (
            <img src={brand.logo} className="h-10 w-10 rounded-md object-cover" alt="" />
          ) : (
            <div className="h-10 w-10 rounded-md bg-gray-100 dark:bg-gray-800" />
          ),
      },
      {
        key: "name",
        header: "Tên",
        render: (brand) => (
          <span className="text-sm text-gray-800 dark:text-white/90">{brand.name}</span>
        ),
      },
      {
        key: "origin",
        header: "Xuất xứ",
        render: (brand) => (
          <span className="text-sm text-gray-700 dark:text-gray-300">{brand.origin ?? "—"}</span>
        ),
      },
      {
        key: "description",
        header: "Mô tả",
        render: (brand) => (
          <span className="line-clamp-1 max-w-xs text-sm text-gray-700 dark:text-gray-300">
            {brand.description ?? "—"}
          </span>
        ),
      },
      {
        key: "actions",
        header: "",
        render: (brand) => (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => openEdit(brand)}
              className="text-gray-400 transition-colors duration-200 ease-standard hover:text-brand-500"
              aria-label="Sửa thương hiệu"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setDeleteTarget(brand)}
              className="text-gray-400 transition-colors duration-200 ease-standard hover:text-error-500"
              aria-label="Xóa thương hiệu"
            >
              <TrashBinIcon className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-2xl font-semibold text-gray-800 dark:text-white/90">Thương hiệu</h3>
        <Button variant="primary" startIcon={<PlusIcon className="h-4 w-4" />} onClick={openCreate}>
          Thêm thương hiệu
        </Button>
      </div>

      <div className="mb-4 w-65">
        <Input
          placeholder="Tìm theo tên thương hiệu"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      <div className="flex flex-1 flex-col rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <DataTable
          columns={columns}
          rows={data ?? []}
          rowKey={(brand) => brand.id}
          isLoading={isLoading}
          emptyMessage="Chưa có thương hiệu nào."
        />
      </div>

      <BrandFormModal open={modalOpen} onClose={() => setModalOpen(false)} editing={editing} />

      <ConfirmModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Xóa thương hiệu này?"
        danger
      />
    </div>
  );
}
