import { useState } from "react";
import type { Collection, CollectionStatus } from "@/types/shared-types";
import { useCollections, useDeleteCollection } from "@/hooks/useCollections";
import { useDebounce } from "@/hooks/useDebounce";
import { getErrorMessage } from "@/lib/error";
import { useToast } from "@/hooks/useToast";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import { formatDate } from "@/lib/format";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Spinner from "@/components/ui/spinner/Spinner";
import Badge from "@/components/ui/badge/Badge";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { PlusIcon, PencilIcon, TrashBinIcon } from "@/icons";
import CollectionFormModal from "./CollectionFormModal";

const STATUS_LABEL: Record<CollectionStatus, string> = {
  UPCOMING: "Chưa diễn ra",
  RUNNING: "Đang chạy",
  ENDED: "Đã kết thúc",
};

const STATUS_COLOR: Record<CollectionStatus, "info" | "success" | "light"> = {
  UPCOMING: "info",
  RUNNING: "success",
  ENDED: "light",
};

export default function CollectionList() {
  const toast = useToast();
  useBreadcrumb([{ label: "Bộ sưu tập" }]);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 500);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Collection | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Collection | null>(null);

  const { data, isLoading } = useCollections(search || undefined);
  const deleteMutation = useDeleteCollection();

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(collection: Collection) {
    setEditing(collection);
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

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-2xl font-semibold text-gray-800 dark:text-white/90">Bộ sưu tập</h3>
        <Button variant="primary" startIcon={<PlusIcon className="h-4 w-4" />} onClick={openCreate}>
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

      <div className="flex flex-1 flex-col rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
              <TableRow>
                {["Banner", "Tên", "Thời gian", "Trạng thái", ""].map((heading) => (
                  <TableCell
                    key={heading}
                    isHeader
                    className="px-5 py-3 text-start text-theme-sm font-medium text-gray-500 dark:text-gray-400"
                  >
                    {heading}
                  </TableCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {isLoading ? (
                <TableRow>
                  <TableCell className="px-5 py-8 text-center" colSpan={5}>
                    <Spinner className="mx-auto" />
                  </TableCell>
                </TableRow>
              ) : (data ?? []).length === 0 ? (
                <TableRow>
                  <TableCell className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400" colSpan={5}>
                    Chưa có bộ sưu tập nào.
                  </TableCell>
                </TableRow>
              ) : (
                (data ?? []).map((collection) => (
                  <TableRow key={collection.id}>
                    <TableCell className="px-5 py-3">
                      {collection.banner ? (
                        <img
                          src={collection.banner}
                          className="h-10 w-16 rounded-md object-cover"
                          alt=""
                        />
                      ) : (
                        <div className="h-10 w-16 rounded-md bg-gray-100 dark:bg-gray-800" />
                      )}
                    </TableCell>
                    <TableCell className="px-5 py-3 text-sm text-gray-800 dark:text-white/90">
                      {collection.name}
                    </TableCell>
                    <TableCell className="px-5 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {formatDate(collection.startDate)} – {formatDate(collection.endDate)}
                    </TableCell>
                    <TableCell className="px-5 py-3">
                      <Badge color={STATUS_COLOR[collection.status]}>
                        {STATUS_LABEL[collection.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => openEdit(collection)}
                          className="text-gray-400 transition-colors duration-200 ease-standard hover:text-brand-500"
                          aria-label="Sửa bộ sưu tập"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(collection)}
                          className="text-gray-400 transition-colors duration-200 ease-standard hover:text-error-500"
                          aria-label="Xóa bộ sưu tập"
                        >
                          <TrashBinIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <CollectionFormModal open={modalOpen} onClose={() => setModalOpen(false)} editing={editing} />

      <ConfirmModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Xóa bộ sưu tập này?"
        danger
      />
    </div>
  );
}
