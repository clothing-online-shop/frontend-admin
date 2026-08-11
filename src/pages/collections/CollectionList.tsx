import { useMemo, useState } from "react";
import { CollectionStatus, type Collection } from "@/types/shared-types";
import { useCollections, useDeleteCollection } from "@/hooks/useCollections";
import { useDebounce } from "@/hooks/useDebounce";
import { getErrorMessage } from "@/lib/error";
import { useToast } from "@/hooks/useToast";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import { formatDate } from "@/lib/format";
import { COLLECTION_STATUS_LABEL, COLLECTION_STATUS_COLOR } from "@/lib/collectionStatus";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Badge from "@/components/ui/badge/Badge";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";
import Tooltip from "@/components/ui/tooltip/Tooltip";
import { DataTable, type DataTableColumn } from "@/components/ui/table/DataTable";
import { PlusIcon, PencilIcon, TrashBinIcon, BoxCubeIcon, EyeIcon } from "@/icons";
import CollectionFormModal from "./CollectionFormModal";
import AssignProductsModal from "./AssignProductsModal";

export default function CollectionList() {
  const toast = useToast();
  useBreadcrumb([{ label: "Bộ sưu tập" }]);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 500);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Collection | null>(null);
  const [viewMode, setViewMode] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Collection | null>(null);
  const [assigningCollection, setAssigningCollection] = useState<Collection | null>(null);

  const { data, isLoading } = useCollections({ search: search || undefined });
  const deleteMutation = useDeleteCollection();

  function openCreate() {
    setEditing(null);
    setViewMode(false);
    setModalOpen(true);
  }

  function openEdit(collection: Collection) {
    setEditing(collection);
    setViewMode(false);
    setModalOpen(true);
  }

  function openView(collection: Collection) {
    setEditing(collection);
    setViewMode(true);
    setModalOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("Đã xóa bộ sưu tập");
      setDeleteTarget(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  const columns = useMemo<DataTableColumn<Collection>[]>(
    () => [
      {
        key: "banner",
        header: "Banner",
        align: "center",
        render: (collection) =>
          collection.banner ? (
            // Chỉ cố định chiều cao, chiều rộng auto theo đúng tỉ lệ ảnh banner thật
            // (thường là ảnh ngang) — không object-cover ép khung cố định nên không bị
            // cắt mất nội dung ảnh. mx-auto vì img mặc định display:block (Tailwind
            // preflight) nên text-align:center của align="center" không tự căn được.
            <img src={collection.banner} className="mx-auto h-20 w-auto rounded-md" alt="" />
          ) : (
            <div className="mx-auto h-20 w-32 rounded-md bg-gray-100 dark:bg-gray-800" />
          ),
      },
      {
        key: "name",
        header: "Tên",
        render: (collection) => (
          <span className="text-sm text-gray-800 dark:text-white/90">{collection.name}</span>
        ),
      },
      {
        key: "time",
        header: "Thời gian",
        align: "center",
        render: (collection) => (
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {formatDate(collection.startDate)} – {formatDate(collection.endDate)}
            </span>
          </div>
        ),
      },
      {
        key: "status",
        header: "Trạng thái",
        align: "center",
        render: (collection) => (
          <Badge color={COLLECTION_STATUS_COLOR[collection.status]}>
            {COLLECTION_STATUS_LABEL[collection.status]}
          </Badge>
        ),
      },
      {
        key: "actions",
        header: "Thao tác",
        className: "min-w-24",
        stickyRight: true,
        render: (collection) => {
          // Đã kết thúc: không cho gán sản phẩm/sửa nữa (khớp rule mới ở BE) — chỉ còn
          // xem + xóa, ẩn hẳn 2 icon còn lại thay vì để bấm rồi mới báo lỗi.
          const isEnded = collection.status === CollectionStatus.ENDED;
          return (
            <div className="flex items-center justify-center gap-3">
              <Tooltip content="Xem">
                <button
                  type="button"
                  onClick={() => openView(collection)}
                  className="text-gray-400 transition-colors duration-200 ease-standard hover:text-brand-500"
                  aria-label="Xem bộ sưu tập"
                >
                  <EyeIcon className="h-6 w-6" />
                </button>
              </Tooltip>
              {!isEnded && (
                <Tooltip content="Gán sản phẩm">
                  <button
                    type="button"
                    onClick={() => setAssigningCollection(collection)}
                    className="text-gray-400 transition-colors duration-200 ease-standard hover:text-brand-500"
                    aria-label="Gán sản phẩm vào bộ sưu tập"
                  >
                    <BoxCubeIcon className="h-6 w-6" />
                  </button>
                </Tooltip>
              )}
              {!isEnded && (
                <button
                  type="button"
                  onClick={() => openEdit(collection)}
                  className="text-gray-400 transition-colors duration-200 ease-standard hover:text-brand-500"
                  aria-label="Sửa bộ sưu tập"
                >
                  <PencilIcon className="h-6 w-6" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setDeleteTarget(collection)}
                className="text-gray-400 transition-colors duration-200 ease-standard hover:text-error-500"
                aria-label="Xóa bộ sưu tập"
              >
                <TrashBinIcon className="h-6 w-6" />
              </button>
            </div>
          );
        },
      },
    ],
    [],
  );

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-2xl font-semibold text-gray-800 dark:text-white/90">Bộ sưu tập</h3>
        <Button variant="primary" startIcon={<PlusIcon className="h-6 w-6" />} onClick={openCreate}>
          Thêm bộ sưu tập
        </Button>
      </div>

      <div className="mb-4 w-65">
        <Input
          placeholder="Tìm theo tên bộ sưu tập"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      <div className="flex flex-1 flex-col rounded-2xl bg-white">
        <DataTable
          columns={columns}
          rows={data ?? []}
          rowKey={(collection) => collection.id}
          isLoading={isLoading}
          emptyMessage="Chưa có bộ sưu tập nào."
        />
      </div>

      <CollectionFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editing={editing}
        viewOnly={viewMode}
      />

      <AssignProductsModal
        open={assigningCollection !== null}
        onClose={() => setAssigningCollection(null)}
        collection={assigningCollection}
      />

      <ConfirmModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Thông báo"
        description="Bạn có chắc chắn muốn xóa bộ sưu tập này không?"
        confirmText="Đồng ý"
        cancelText="Hủy"
        danger
      />
    </div>
  );
}
