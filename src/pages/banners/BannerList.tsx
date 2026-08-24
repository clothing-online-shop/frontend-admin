import { useState } from "react";
import type { Banner } from "@/types/shared-types";
import { useBanners, useDeleteBanner, useReorderBanners } from "@/hooks/useBanners";
import { useDebounce } from "@/hooks/useDebounce";
import { getErrorMessage } from "@/lib/error";
import { useToast } from "@/hooks/useToast";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import { formatDate } from "@/lib/format";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { BANNER_STATUS_LABEL } from "@/lib/bannerStatus";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Badge from "@/components/ui/badge/Badge";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";
import Pagination from "@/components/ui/pagination/Pagination";
import Tooltip from "@/components/ui/tooltip/Tooltip";
import { DataTable, type DataTableColumn } from "@/components/ui/table/DataTable";
import { PlusIcon, PencilIcon, TrashBinIcon, AngleUpIcon, AngleDownIcon, EyeIcon } from "@/icons";
import BannerFormModal from "./BannerFormModal";

export default function BannerList() {
  const toast = useToast();
  useBreadcrumb([{ label: "Banner trang chủ" }]);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 500);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [viewMode, setViewMode] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);

  const { data, isLoading } = useBanners({ search: search || undefined, page, limit });
  const banners = data?.data ?? [];
  const deleteMutation = useDeleteBanner();
  const reorderMutation = useReorderBanners();

  function openCreate() {
    setEditing(null);
    setViewMode(false);
    setModalOpen(true);
  }

  function openEdit(banner: Banner) {
    setEditing(banner);
    setViewMode(false);
    setModalOpen(true);
  }

  function openView(banner: Banner) {
    setEditing(banner);
    setViewMode(true);
    setModalOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("Đã xóa banner.");
      setDeleteTarget(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  // Danh sách đã sắp theo sortOrder từ BE — đổi thứ tự bằng cách hoán đổi sortOrder với
  // hàng liền kề trong mảng hiện tại, không cần component drag riêng (không đáng xây với
  // hiệu suất công việc nhỏ của màn này — codebase chỉ có DragTree dạng cây cho danh mục).
  // Từ khi có phân trang: chỉ hoán đổi được với hàng liền kề TRONG CÙNG TRANG — banner đầu/
  // cuối trang không đổi được sang trang liền kề (nút lên/xuống tự disable ở 2 đầu mỗi
  // trang). Chấp nhận được vì số banner trang chủ thực tế luôn nhỏ (vừa 1 trang).
  async function handleMove(index: number, direction: -1 | 1) {
    const target = banners[index];
    const neighbor = banners[index + direction];
    if (!target || !neighbor) return;

    try {
      await reorderMutation.mutateAsync([
        { id: target.id, sortOrder: neighbor.sortOrder },
        { id: neighbor.id, sortOrder: target.sortOrder },
      ]);
      toast.success("Đã cập nhật thứ tự banner.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  const columns: DataTableColumn<Banner>[] = [
    {
      key: "image",
      header: "Ảnh",
      align: "center",
      className: "min-w-40",
      render: (banner) => (
        <img src={banner.imageUrl} className="mx-auto h-20 w-auto rounded-md" alt="" />
      ),
    },
    {
      key: "title",
      header: "Tiêu đề",
      align: "center",
      className: "min-w-72",
      render: (banner) => (
        <span className="text-sm text-gray-800 dark:text-white/90">{banner.title}</span>
      ),
    },
    {
      key: "linkUrl",
      header: "Link đích",
      align: "center",
      className: "min-w-72",
      render: (banner) =>
        banner.linkUrl ? (
          <span className="text-sm break-all text-gray-700 dark:text-gray-300">
            {banner.linkUrl}
          </span>
        ) : (
          <span className="text-sm text-gray-400">—</span>
        ),
    },
    {
      key: "time",
      header: "Thời gian",
      align: "center",
      className: "min-w-60",

      render: (banner) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {formatDate(banner.startDate)} – {formatDate(banner.endDate)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      align: "center",
      className: "min-w-40",

      render: (banner) => (
        <Badge color={BANNER_STATUS_LABEL[banner.status].color}>
          {BANNER_STATUS_LABEL[banner.status].label}
        </Badge>
      ),
    },
    {
      key: "order",
      header: "Thứ tự",
      align: "center",
      className: "min-w-40",

      render: (banner) => {
        const index = banners.findIndex((item) => item.id === banner.id);
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
              aria-label="Đưa banner lên trên"
            >
              <AngleUpIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              disabled={index === -1 || index >= banners.length - 1}
              onClick={(e) => {
                e.stopPropagation();
                handleMove(index, 1);
              }}
              className="flex h-8 w-8 items-center justify-center text-gray-400 transition-colors duration-200 ease-standard hover:text-brand-500 disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Đưa banner xuống dưới"
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
      render: (banner) => (
        <div className="flex items-center justify-center gap-3">
          <Tooltip content="Xem">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openView(banner);
              }}
              className="text-gray-400 transition-colors duration-200 ease-standard hover:text-brand-500"
              aria-label="Xem banner"
            >
              <EyeIcon className="h-6 w-6" />
            </button>
          </Tooltip>
          <Tooltip content="Sửa">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openEdit(banner);
              }}
              className="text-gray-400 transition-colors duration-200 ease-standard hover:text-brand-500"
              aria-label="Sửa banner"
            >
              <PencilIcon className="h-6 w-6" />
            </button>
          </Tooltip>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget(banner);
            }}
            className="text-gray-400 transition-colors duration-200 ease-standard hover:text-error-500"
            aria-label="Xóa banner"
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
            placeholder="Tìm theo tiêu đề banner"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Button variant="primary" startIcon={<PlusIcon className="h-6 w-6" />} onClick={openCreate}>
          Thêm banner
        </Button>
      </div>

      <div className="flex flex-1 flex-col rounded-2xl bg-white">
        <DataTable
          columns={columns}
          rows={banners}
          rowKey={(banner) => banner.id}
          isLoading={isLoading}
          emptyMessage="Chưa có banner nào."
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

      <BannerFormModal
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
        description="Bạn có chắc chắn muốn xóa banner này không?"
        confirmText="Đồng ý"
        cancelText="Hủy"
        danger
      />
    </div>
  );
}
