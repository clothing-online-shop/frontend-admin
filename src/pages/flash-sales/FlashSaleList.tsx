import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FlashSaleStatus, type FlashSale } from "@/types/shared-types";
import { useDeleteFlashSale, useEndFlashSaleNow, useFlashSales } from "@/hooks/useFlashSales";
import { useDebounce } from "@/hooks/useDebounce";
import { getErrorMessage } from "@/lib/error";
import { useToast } from "@/hooks/useToast";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import { formatDateTime } from "@/lib/format";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { FLASH_SALE_STATUS_LABEL, FLASH_SALE_STATUS_COLOR } from "@/lib/flashSaleStatus";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Badge from "@/components/ui/badge/Badge";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";
import Pagination from "@/components/ui/pagination/Pagination";
import Tooltip from "@/components/ui/tooltip/Tooltip";
import { DataTable, type DataTableColumn } from "@/components/ui/table/DataTable";
import { PlusIcon, PencilIcon, TrashBinIcon, EyeIcon, TimeIcon } from "@/icons";

const STATUS_OPTIONS = Object.values(FlashSaleStatus).map((value) => ({
  value,
  label: FLASH_SALE_STATUS_LABEL[value],
}));

export default function FlashSaleList() {
  const toast = useToast();
  const navigate = useNavigate();
  useBreadcrumb([{ label: "Flash Sale" }]);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 500);
  const [status, setStatus] = useState<FlashSaleStatus | undefined>();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);
  const [deleteTarget, setDeleteTarget] = useState<FlashSale | null>(null);
  const [endNowTarget, setEndNowTarget] = useState<FlashSale | null>(null);

  const { data, isLoading } = useFlashSales({ search: search || undefined, status, page, limit });
  const flashSales = data?.data ?? [];
  const deleteMutation = useDeleteFlashSale();
  const endNowMutation = useEndFlashSaleNow();

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("Đã xóa đợt Flash Sale.");
      setDeleteTarget(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function handleEndNow() {
    if (!endNowTarget) return;
    try {
      await endNowMutation.mutateAsync(endNowTarget.id);
      toast.success("Đã kết thúc sớm đợt Flash Sale.");
      setEndNowTarget(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  const columns: DataTableColumn<FlashSale>[] = [
    {
      key: "name",
      header: "Tên đợt",
      className: "min-w-56",
      render: (flashSale) => (
        <span className="text-sm text-gray-800 dark:text-white/90">{flashSale.name}</span>
      ),
    },
    {
      key: "time",
      header: "Thời gian",
      align: "center",
      className: "min-w-56",
      render: (flashSale) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {formatDateTime(flashSale.startDate)} – {formatDateTime(flashSale.endDate)}
        </span>
      ),
    },
    {
      key: "itemCount",
      header: "Số sản phẩm",
      align: "center",
      render: (flashSale) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">{flashSale.itemCount}</span>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      align: "center",
      className: "min-w-40",
      render: (flashSale) => (
        <Badge color={FLASH_SALE_STATUS_COLOR[flashSale.status]}>
          {FLASH_SALE_STATUS_LABEL[flashSale.status]}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Thao tác",
      className: "min-w-32",
      stickyRight: true,
      render: (flashSale) => {
        const isRunning = flashSale.status === FlashSaleStatus.RUNNING;
        const isEnded = flashSale.status === FlashSaleStatus.ENDED;
        return (
          <div className="flex items-center justify-center gap-3">
            <Tooltip content="Xem">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/flash-sales/${flashSale.id}`);
                }}
                className="text-gray-400 transition-colors duration-200 ease-standard hover:text-brand-500"
                aria-label="Xem đợt Flash Sale"
              >
                <EyeIcon className="h-6 w-6" />
              </button>
            </Tooltip>
            {!isEnded && (
              <Tooltip content="Sửa">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/flash-sales/${flashSale.id}/edit`);
                  }}
                  className="text-gray-400 transition-colors duration-200 ease-standard hover:text-brand-500"
                  aria-label="Sửa đợt Flash Sale"
                >
                  <PencilIcon className="h-6 w-6" />
                </button>
              </Tooltip>
            )}
            {isRunning && (
              <Tooltip content="Kết thúc sớm">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEndNowTarget(flashSale);
                  }}
                  className="text-gray-400 transition-colors duration-200 ease-standard hover:text-warning-500"
                  aria-label="Kết thúc sớm đợt Flash Sale"
                >
                  <TimeIcon className="h-6 w-6" />
                </button>
              </Tooltip>
            )}
            {!isRunning && (
              <Tooltip content="Xóa">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget(flashSale);
                  }}
                  className="text-gray-400 transition-colors duration-200 ease-standard hover:text-error-500"
                  aria-label="Xóa đợt Flash Sale"
                >
                  <TrashBinIcon className="h-6 w-6" />
                </button>
              </Tooltip>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-64">
            <Input
              placeholder="Tìm theo tên đợt Flash Sale"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="w-48">
            <Select
              options={STATUS_OPTIONS}
              value={status}
              onChange={(value) => {
                setStatus(value as FlashSaleStatus | undefined);
                setPage(1);
              }}
              placeholder="Trạng thái"
              allowClear
              placeholderColor="gray-700"
            />
          </div>
        </div>
        <Button
          variant="primary"
          startIcon={<PlusIcon className="h-6 w-6" />}
          onClick={() => navigate("/flash-sales/new")}
        >
          Thêm Flash Sale
        </Button>
      </div>

      <div className="flex flex-1 flex-col rounded-2xl bg-white">
        <DataTable
          columns={columns}
          rows={flashSales}
          rowKey={(flashSale) => flashSale.id}
          isLoading={isLoading}
          emptyMessage="Chưa có đợt Flash Sale nào."
          onRowClick={(flashSale) => navigate(`/flash-sales/${flashSale.id}`)}
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

      <ConfirmModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Thông báo"
        description="Bạn có chắc chắn muốn xóa đợt Flash Sale này không?"
        confirmText="Đồng ý"
        cancelText="Hủy"
        danger
      />

      <ConfirmModal
        open={endNowTarget !== null}
        onClose={() => setEndNowTarget(null)}
        onConfirm={handleEndNow}
        title="Thông báo"
        description="Kết thúc sớm đợt Flash Sale này? Toàn bộ sản phẩm sẽ về lại giá gốc ngay lập tức."
        confirmText="Đồng ý"
        cancelText="Hủy"
      />
    </div>
  );
}
