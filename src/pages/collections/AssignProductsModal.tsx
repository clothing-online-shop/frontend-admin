import { useEffect, useMemo, useRef, useState } from "react";
import type { Collection, ProductListItem, ProductStatus } from "@/types/shared-types";
import { useProductsAdmin } from "@/hooks/useProducts";
import { useAssignCollectionProducts } from "@/hooks/useCollections";
import { useCategoryNameMap } from "@/hooks/useCategories";
import { useBrandNameMap } from "@/hooks/useBrands";
import { useDebounce } from "@/hooks/useDebounce";
import { getErrorMessage } from "@/lib/error";
import { useToast } from "@/hooks/useToast";
import { formatPrice } from "@/lib/format";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { PRODUCT_STATUS_LABEL } from "@/lib/productStatus";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Spinner from "@/components/ui/spinner/Spinner";
import Badge from "@/components/ui/badge/Badge";
import Checkbox from "@/components/form/input/Checkbox";
import Pagination from "@/components/ui/pagination/Pagination";
import { DataTable, type DataTableColumn } from "@/components/ui/table/DataTable";
import ProductFilterBar from "@/components/common/ProductFilterBar";

interface AssignProductsModalProps {
  open: boolean;
  onClose: () => void;
  collection: Collection | null;
}

// Chọn nhiều sản phẩm cho 1 bộ sưu tập — bê nguyên bộ lọc của màn danh sách sản phẩm
// (ProductFilterBar) vào đây để lọc/tìm cho dễ chọn, đúng yêu cầu. Lựa chọn giữ trong 1
// Set nên chọn ở trang này, lọc/chuyển trang khác vẫn không mất, tới khi bấm "Lưu" mới
// gọi PUT /collections/:id/products thay thế TOÀN BỘ danh sách sản phẩm của bộ sưu tập.
export default function AssignProductsModal({ open, onClose, collection }: AssignProductsModalProps) {
  const toast = useToast();
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 500);
  const [brandId, setBrandId] = useState<string | undefined>(undefined);
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<ProductStatus | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const seededRef = useRef(false);
  const categoryNameById = useCategoryNameMap();
  const brandNameById = useBrandNameMap();

  // Reset sạch state mỗi lần mở dialog (hoặc đổi sang bộ sưu tập khác trong khi đang mở)
  // — không giữ lại filter/lựa chọn dở dang từ lần mở trước.
  useEffect(() => {
    if (!open) return;
    setSearchInput("");
    setBrandId(undefined);
    setCategory(undefined);
    setStatus(undefined);
    setPage(1);
    setSelectedIds(new Set());
    seededRef.current = false;
  }, [open, collection?.id]);

  // Nạp trước toàn bộ id sản phẩm ĐANG thuộc bộ sưu tập (limit cao để lấy hết trong 1
  // lần, không phân trang) để tick sẵn — tận dụng luôn filter collectionIds đã có.
  // includeDeleted: true — nếu bỏ, 1 sản phẩm đã bị xóa mềm nhưng vẫn đang thuộc bộ sưu
  // tập này sẽ không được tick sẵn, và do "Lưu" thay thế TOÀN BỘ danh sách
  // (assignProducts()), bấm Lưu mà không đụng gì cũng vô tình gỡ mất sản phẩm đó khỏi
  // bộ sưu tập. Picker chính bên dưới KHÔNG truyền includeDeleted — sản phẩm đã xóa vẫn
  // không được CHỌN MỚI.
  const { data: assignedData } = useProductsAdmin(
    { collectionIds: collection?.id, limit: 1000, includeDeleted: true },
    { enabled: open && !!collection },
  );

  useEffect(() => {
    if (open && assignedData && !seededRef.current) {
      setSelectedIds(new Set(assignedData.data.map((product) => product.id)));
      seededRef.current = true;
    }
  }, [open, assignedData]);

  // search chỉ đổi khi debounce chốt giá trị — khác brandId/category/status (reset trang
  // ngay trong onChange), phải theo dõi riêng bằng effect, nếu không đứng ở trang 3 rồi
  // gõ tìm kiếm ra kết quả ít hơn sẽ lọt vào trang trống dù có sản phẩm khớp ở trang 1.
  useEffect(() => {
    setPage(1);
  }, [search]);

  const { data, isLoading } = useProductsAdmin(
    {
      search: search || undefined,
      brandId,
      category,
      status,
      page,
      limit: DEFAULT_PAGE_SIZE,
    },
    { enabled: open },
  );

  const assignMutation = useAssignCollectionProducts();

  function toggleProduct(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  const visibleIds = useMemo(() => (data?.data ?? []).map((product) => product.id), [data]);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));

  function toggleAllVisible(checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of visibleIds) {
        if (checked) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }

  async function handleSave() {
    if (!collection) return;
    try {
      await assignMutation.mutateAsync({
        collectionId: collection.id,
        payload: { productIds: [...selectedIds] },
      });
      toast.success("Đã cập nhật sản phẩm cho bộ sưu tập");
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  const columns: DataTableColumn<ProductListItem>[] = [
    {
      key: "select",
      header: "",
      align: "center",
      className: "w-12",
      render: (product) => (
        <Checkbox
          checked={selectedIds.has(product.id)}
          onChange={(checked) => toggleProduct(product.id, checked)}
        />
      ),
    },
    {
      key: "thumbnail",
      header: "Ảnh",
      className: "w-20",
      render: (product) =>
        product.thumbnail ? (
          <img src={product.thumbnail} className="h-14 w-14 rounded-md object-cover" alt="" />
        ) : (
          <div className="h-14 w-14 rounded-md bg-gray-100 dark:bg-gray-800" />
        ),
    },
    {
      key: "name",
      header: "Tên sản phẩm",
      className: "min-w-56",
      render: (product) => (
        <span className="text-sm text-gray-800 dark:text-white/90">{product.name}</span>
      ),
    },
    {
      key: "brand",
      header: "Thương hiệu",
      align: "center",
      className: "min-w-36",
      render: (product) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {(product.brandId && brandNameById.get(product.brandId)) ?? "—"}
        </span>
      ),
    },
    {
      key: "category",
      header: "Danh mục",
      align: "center",
      className: "min-w-40",
      render: (product) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {categoryNameById.get(product.categoryId) ?? "—"}
        </span>
      ),
    },
    {
      key: "price",
      header: "Giá",
      align: "center",
      render: (product) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {formatPrice(product.salePrice ?? product.basePrice)}
        </span>
      ),
    },
    {
      key: "stock",
      header: "Tồn kho",
      align: "center",
      render: (product) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">{product.totalStock}</span>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      align: "center",
      render: (product) => (
        <Badge color={PRODUCT_STATUS_LABEL[product.status].color}>
          {PRODUCT_STATUS_LABEL[product.status].label}
        </Badge>
      ),
    },
  ];

  return (
    <Modal isOpen={open} onClose={onClose} className="m-4 max-w-7xl">
      <div className="flex max-h-[85vh] flex-col">
        <div className="border-b border-gray-100 px-6 py-5 dark:border-gray-800">
          <div className="flex min-h-9.5 flex-col justify-center pr-12 sm:min-h-11">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Gán sản phẩm vào bộ sưu tập
            </h3>
            {collection && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{collection.name}</p>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Chỉ mount khi mở dialog — ProductFilterBar tự fetch category/brand riêng,
              nếu render sẵn cả lúc đóng thì mỗi lần vào màn Bộ sưu tập sẽ tự bắn API dù
              chưa ai bấm "Gán sản phẩm" (children trong JSX luôn được dựng trước khi
              Modal quyết định có hiện hay không). */}
          {open && (
            <div className="mb-4 flex items-center justify-between gap-3">
              <ProductFilterBar
                searchInput={searchInput}
                onSearchInputChange={setSearchInput}
                brandId={brandId}
                onBrandIdChange={(value) => {
                  setBrandId(value);
                  setPage(1);
                }}
                category={category}
                onCategoryChange={(value) => {
                  setCategory(value);
                  setPage(1);
                }}
                status={status}
                onStatusChange={(value) => {
                  setStatus(value);
                  setPage(1);
                }}
              />
            </div>
          )}

          {!isLoading && visibleIds.length > 0 && (
            <div className="mb-2">
              <Checkbox
                label="Chọn tất cả sản phẩm đang hiển thị"
                checked={allVisibleSelected}
                onChange={toggleAllVisible}
              />
            </div>
          )}

          <DataTable
            columns={columns}
            rows={data?.data ?? []}
            rowKey={(product) => product.id}
            isLoading={isLoading}
            emptyMessage="Không tìm thấy sản phẩm phù hợp."
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
            Đã chọn {selectedIds.size} sản phẩm
          </span>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={assignMutation.isPending}>
              Hủy
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleSave}
              disabled={assignMutation.isPending}
              startIcon={assignMutation.isPending ? <Spinner size="sm" /> : undefined}
            >
              Lưu
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
