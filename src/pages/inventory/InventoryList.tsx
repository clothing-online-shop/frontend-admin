import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { InventoryItem } from "@/types/shared-types";
import { useInventory } from "@/hooks/useInventory";
import { useDebounce } from "@/hooks/useDebounce";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { getStockLevelBadge } from "@/lib/inventoryStatus";
import { DataTable, type DataTableColumn } from "@/components/ui/table/DataTable";
import Badge from "@/components/ui/badge/Badge";
import Pagination from "@/components/ui/pagination/Pagination";
import Input from "@/components/form/input/InputField";
import Checkbox from "@/components/form/input/Checkbox";
import Button from "@/components/ui/button/Button";
import StockMovementModal from "./StockMovementModal";

export default function InventoryList() {
  const navigate = useNavigate();
  useBreadcrumb([{ label: "Tồn kho" }]);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 500);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const { data, isLoading } = useInventory({
    search: search || undefined,
    lowStockOnly: lowStockOnly || undefined,
    page,
    limit: DEFAULT_PAGE_SIZE,
  });

  const columns: DataTableColumn<InventoryItem>[] = [
    {
      key: "product",
      header: "Sản phẩm",
      align: "left",
      className: "min-w-56",
      render: (item) => (
        <span className="text-sm text-gray-800 dark:text-white/90">{item.productName}</span>
      ),
    },
    { key: "size", header: "Size", align: "center", render: (item) => item.size },
    { key: "color", header: "Màu", align: "center", render: (item) => item.color },
    { key: "sku", header: "SKU", align: "center", render: (item) => item.sku },
    {
      key: "stock",
      header: "Tồn kho",
      align: "center",
      render: (item) => {
        const badge = getStockLevelBadge(item.stockQuantity, item.lowStockThreshold);
        return (
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm font-semibold text-gray-800 dark:text-white/90">
              {item.stockQuantity}
            </span>
            <Badge color={badge.color}>{badge.label}</Badge>
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "Thao tác",
      align: "center",
      stickyRight: true,
      render: (item) => (
        <Button variant="outline" onClick={() => setSelectedItem(item)}>
          Nhập/Điều chỉnh
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="w-96">
            <Input
              placeholder="Tìm theo tên sản phẩm/SKU"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <Checkbox
            label="Chỉ hiện sắp hết hàng"
            checked={lowStockOnly}
            onChange={(checked) => {
              setLowStockOnly(checked);
              setPage(1);
            }}
          />
        </div>
        <Button variant="outline" onClick={() => navigate("/inventory/history")}>
          Lịch sử
        </Button>
      </div>

      <div className="rounded-2xl bg-white dark:bg-white/[0.03]">
        <DataTable
          columns={columns}
          rows={data?.data ?? []}
          rowKey={(item) => item.variantId}
          isLoading={isLoading}
          emptyMessage="Chưa có biến thể sản phẩm nào."
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

      <StockMovementModal
        open={selectedItem !== null}
        onClose={() => setSelectedItem(null)}
        item={selectedItem}
      />
    </div>
  );
}
