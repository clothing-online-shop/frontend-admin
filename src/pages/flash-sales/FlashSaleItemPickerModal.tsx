import { useEffect, useMemo, useState } from "react";
import type { InventoryItem } from "@/types/shared-types";
import { useInventory } from "@/hooks/useInventory";
import { useDebounce } from "@/hooks/useDebounce";
import { formatPrice } from "@/lib/format";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Checkbox from "@/components/form/input/Checkbox";
import Pagination from "@/components/ui/pagination/Pagination";
import { DataTable, type DataTableColumn } from "@/components/ui/table/DataTable";
import type { FlashSaleItemFormValue } from "@/schemas/flash-sale.schema";

interface FlashSaleItemPickerModalProps {
  open: boolean;
  onClose: () => void;
  // Biến thể ĐÃ có trong form (Task 8) — ẩn khỏi danh sách chọn, tránh admin bấm chọn lại
  // 1 biến thể đã thêm rồi (BE cũng chặn trùng qua unique([flashSaleId, productVariantId])
  // nhưng chặn sớm ở UI vẫn tốt hơn để tận dụng, không đợi lỗi 409 mới biết).
  excludeVariantIds: string[];
  onConfirm: (items: FlashSaleItemFormValue[]) => void;
}

function toFormValue(item: InventoryItem): FlashSaleItemFormValue {
  return {
    productVariantId: item.variantId,
    sku: item.sku,
    size: item.size,
    color: item.color,
    productName: item.productName,
    thumbnail: item.thumbnail,
    price: item.price,
    stockQuantity: item.stockQuantity,
    // Bỏ trống — bắt buộc admin tự nhập giá sale/số lượng cho từng dòng ở bảng chính (Task
    // 8), không tự đoán giá trị mặc định (vd 90% giá gốc) vì đây là quyết định kinh doanh,
    // không phải suy luận được từ dữ liệu sẵn có.
    salePrice: undefined as unknown as number,
    quantityLimit: undefined as unknown as number,
  };
}

export default function FlashSaleItemPickerModal({
  open,
  onClose,
  excludeVariantIds,
  onConfirm,
}: FlashSaleItemPickerModalProps) {
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 500);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Map<string, InventoryItem>>(new Map());

  useEffect(() => {
    if (!open) return;
    setSearchInput("");
    setPage(1);
    setSelectedIds(new Map());
  }, [open]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const { data, isLoading } = useInventory({
    search: search || undefined,
    page,
    limit: DEFAULT_PAGE_SIZE,
  });

  const excludeSet = useMemo(() => new Set(excludeVariantIds), [excludeVariantIds]);
  // Ẩn hẳn (không chỉ disable) biến thể đã có trong form — đơn giản hơn cho admin, không cần
  // giải thích vì sao 1 dòng bị khoá không bấm được.
  const rows = useMemo(
    () => (data?.data ?? []).filter((item) => !excludeSet.has(item.variantId)),
    [data, excludeSet],
  );

  function toggle(item: InventoryItem, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Map(prev);
      if (checked) next.set(item.variantId, item);
      else next.delete(item.variantId);
      return next;
    });
  }

  function handleConfirm() {
    onConfirm([...selectedIds.values()].map(toFormValue));
    onClose();
  }

  const columns: DataTableColumn<InventoryItem>[] = [
    {
      key: "select",
      header: "",
      align: "center",
      className: "w-12",
      render: (item) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={selectedIds.has(item.variantId)}
            onChange={(checked) => toggle(item, checked)}
          />
        </div>
      ),
    },
    {
      key: "thumbnail",
      header: "Ảnh",
      className: "w-20",
      render: (item) =>
        item.thumbnail ? (
          <img src={item.thumbnail} className="h-14 w-14 rounded-md object-cover" alt="" />
        ) : (
          <div className="h-14 w-14 rounded-md bg-gray-100 dark:bg-gray-800" />
        ),
    },
    {
      key: "product",
      header: "Sản phẩm",
      className: "min-w-56",
      render: (item) => (
        <div>
          <p className="text-sm text-gray-800 dark:text-white/90">{item.productName}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            SKU: {item.sku} · {item.size} / {item.color}
          </p>
        </div>
      ),
    },
    {
      key: "price",
      header: "Giá gốc",
      align: "center",
      render: (item) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {formatPrice(item.price)}
        </span>
      ),
    },
    {
      key: "stock",
      header: "Tồn kho",
      align: "center",
      render: (item) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">{item.stockQuantity}</span>
      ),
    },
  ];

  return (
    <Modal isOpen={open} onClose={onClose} className="m-4 max-w-5xl">
      <div className="flex max-h-[85vh] flex-col">
        <div className="border-b border-gray-100 px-6 py-5 dark:border-gray-800">
          <div className="flex min-h-9.5 items-center pr-12 sm:min-h-11">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Chọn sản phẩm/biến thể tham gia
            </h3>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="mb-4 w-64">
            <Input
              placeholder="Tìm theo tên sản phẩm hoặc SKU"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(item) => item.variantId}
            isLoading={isLoading}
            emptyMessage="Không tìm thấy biến thể phù hợp."
            onRowClick={(item) => toggle(item, !selectedIds.has(item.variantId))}
          />
          <Pagination
            page={page}
            pageSize={DEFAULT_PAGE_SIZE}
            total={data?.meta.total ?? 0}
            onChange={setPage}
          />
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-6 py-4 dark:border-gray-800">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Đã chọn {selectedIds.size} biến thể
          </span>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={selectedIds.size === 0}
              onClick={handleConfirm}
            >
              Thêm đã chọn
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
