import { useState } from "react";
import type { StockMovement, StockMovementType } from "@/types/shared-types";
import { useStockHistory } from "@/hooks/useInventory";
import { useDebounce } from "@/hooks/useDebounce";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import { formatDateTime } from "@/lib/format";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { STOCK_MOVEMENT_TYPE_LABEL } from "@/lib/inventoryStatus";
import { DataTable, type DataTableColumn } from "@/components/ui/table/DataTable";
import Badge from "@/components/ui/badge/Badge";
import Pagination from "@/components/ui/pagination/Pagination";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import DatePicker from "@/components/form/DatePicker";

const TYPE_OPTIONS = Object.entries(STOCK_MOVEMENT_TYPE_LABEL).map(([value, { label }]) => ({
  value,
  label,
}));

export default function InventoryHistory() {
  useBreadcrumb([{ label: "Tồn kho", href: "/inventory" }, { label: "Lịch sử" }]);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 500);
  const [type, setType] = useState<StockMovementType | undefined>(undefined);
  const [from, setFrom] = useState<string | undefined>(undefined);
  const [to, setTo] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useStockHistory({
    productId: undefined,
    variantId: undefined,
    type,
    from,
    to,
    page,
    limit: DEFAULT_PAGE_SIZE,
  });

  // API lọc theo productId/SKU không có ô tìm kiếm riêng ở BE (GET /inventory/history chỉ
  // nhận variantId/productId chính xác, không có `search`) — lọc theo tên/SKU ngay trên
  // trang này bằng cách so khớp phía client trên trang dữ liệu đang có, chấp nhận chỉ lọc
  // trong phạm vi 1 trang thay vì toàn bộ lịch sử (đủ dùng, tránh phải thêm search vào BE
  // cho 1 tính năng phụ chưa ai yêu cầu rõ — YAGNI).
  const filteredRows = (data?.data ?? []).filter((movement) => {
    if (!search) return true;
    const haystack = `${movement.productName} ${movement.sku}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  const columns: DataTableColumn<StockMovement>[] = [
    {
      key: "createdAt",
      header: "Thời gian",
      align: "center",
      render: (movement) => formatDateTime(movement.createdAt),
    },
    {
      key: "product",
      header: "Sản phẩm / Biến thể",
      align: "center",
      className: "min-w-56",
      render: (movement) => (
        <span className="text-sm text-gray-800 dark:text-white/90">
          {movement.productName} — {movement.size}/{movement.color} ({movement.sku})
        </span>
      ),
    },
    {
      key: "type",
      header: "Loại",
      align: "center",
      render: (movement) => (
        <Badge color={STOCK_MOVEMENT_TYPE_LABEL[movement.type].color}>
          {STOCK_MOVEMENT_TYPE_LABEL[movement.type].label}
        </Badge>
      ),
    },
    {
      key: "quantity",
      header: "Số lượng thay đổi",
      align: "center",
      render: (movement) => (
        <span
          className={
            movement.quantity >= 0
              ? "text-sm font-semibold text-success-600"
              : "text-sm font-semibold text-error-600"
          }
        >
          {movement.quantity >= 0 ? `+${movement.quantity}` : movement.quantity}
        </span>
      ),
    },
    {
      key: "note",
      header: "Lý do / Ghi chú",
      align: "center",
      className: "min-w-56",
      render: (movement) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">{movement.note ?? "—"}</span>
      ),
    },
    {
      key: "createdBy",
      header: "Người thực hiện",
      align: "center",
      render: (movement) => movement.createdByName,
    },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="w-72">
          <Input
            placeholder="Tìm theo tên sản phẩm/SKU (trang hiện tại)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <div className="w-48">
          <Select
            allowClear
            placeholderColor="gray-700"
            placeholder="Loại giao dịch"
            options={TYPE_OPTIONS}
            value={type}
            onChange={(value) => {
              setType(value as StockMovementType | undefined);
              setPage(1);
            }}
          />
        </div>
        <div className="w-44">
          <DatePicker
            id="history-from"
            placeholder="Từ ngày"
            onChange={(_dates, dateStr) => {
              // DatePicker chỉ trả "YYYY-MM-DD" — BE so sánh trực tiếp bằng new Date(), gửi
              // nguyên chuỗi này sẽ thành 00:00 UTC (07:00 giờ VN), cắt mất vài giờ đầu ngày
              // theo giờ local.
              setFrom(dateStr ? `${dateStr}T00:00:00.000` : undefined);
              setPage(1);
            }}
          />
        </div>
        <div className="w-44">
          <DatePicker
            id="history-to"
            placeholder="Đến ngày"
            onChange={(_dates, dateStr) => {
              // Tương tự from — phải đẩy tới cuối ngày, nếu không BE sẽ cắt mất toàn bộ giao
              // dịch trong chính ngày được chọn (00:00 UTC là điểm cắt, không phải cuối ngày).
              setTo(dateStr ? `${dateStr}T23:59:59.999` : undefined);
              setPage(1);
            }}
          />
        </div>
      </div>

      <div className="rounded-2xl bg-white dark:bg-white/[0.03]">
        <DataTable
          columns={columns}
          rows={filteredRows}
          rowKey={(movement) => movement.id}
          isLoading={isLoading}
          emptyMessage="Chưa có giao dịch kho nào."
        />
        <div className="px-5">
          <Pagination
            page={page}
            pageSize={DEFAULT_PAGE_SIZE}
            total={data?.meta.total ?? 0}
            onChange={setPage}
          />
        </div>
      </div>
    </div>
  );
}
