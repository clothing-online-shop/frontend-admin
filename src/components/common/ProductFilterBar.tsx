import { useMemo } from "react";
import { ProductStatus } from "@/types/shared-types";
import type { ProductSort } from "@/types/products-api.types";
import { useBrands } from "@/hooks/useBrands";
import { PRODUCT_STATUS_LABEL } from "@/lib/productStatus";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import CategoryTreeSelect from "@/components/form/CategoryTreeSelect";

const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: "newest", label: "Mới nhất" },
  { value: "price_asc", label: "Giá tăng dần" },
  { value: "price_desc", label: "Giá giảm dần" },
  { value: "best_selling", label: "Bán chạy nhất (30 ngày)" },
];

const FEATURED_OPTIONS = [
  { value: "true", label: "Nổi bật" },
  { value: "false", label: "Không nổi bật" },
];

interface ProductFilterBarProps {
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  brandId: string | undefined;
  onBrandIdChange: (value: string | undefined) => void;
  categoryIds: string[];
  onCategoryIdsChange: (ids: string[]) => void;
  status?: ProductStatus | undefined;
  onStatusChange?: (value: ProductStatus | undefined) => void;
  // Ẩn bộ lọc "Trạng thái" — dùng khi nơi gọi đã tự khóa cứng status (vd
  // AssignProductsModal chỉ cho gán sản phẩm đang mở bán, không cần cho admin tự đổi sang
  // trạng thái khác). Mặc định true (giữ nguyên hành vi cũ cho ProductList.tsx).
  showStatusFilter?: boolean;
  // "Nổi bật"/"Sắp xếp" chỉ cần ở màn danh sách chính (ProductList.tsx) — AssignProductsModal
  // (chọn sản phẩm gán vào bộ sưu tập) không truyền 2 cặp prop này nên tự ẩn, không bắt
  // buộc mọi nơi dùng ProductFilterBar phải quan tâm 2 bộ lọc này.
  isFeatured?: boolean | undefined;
  onIsFeaturedChange?: (value: boolean | undefined) => void;
  sort?: ProductSort | undefined;
  onSortChange?: (value: ProductSort | undefined) => void;
  className?: string;
}

// Thanh lọc sản phẩm dùng chung — ProductList.tsx (màn danh sách) và AssignProductsModal
// (dialog gán sản phẩm vào bộ sưu tập) đều cần đúng bộ lọc search/thương hiệu/danh
// mục/trạng thái này, tách ra 1 chỗ để sửa 1 lần áp dụng cả 2 nơi. Component chỉ nhận
// value/onChange (không tự giữ state) — nơi gọi tự quyết định side-effect riêng (vd
// reset trang về 1 khi đổi filter).
export default function ProductFilterBar({
  searchInput,
  onSearchInputChange,
  brandId,
  onBrandIdChange,
  categoryIds,
  onCategoryIdsChange,
  status,
  onStatusChange,
  showStatusFilter = true,
  isFeatured,
  onIsFeaturedChange,
  sort,
  onSortChange,
  className = "",
}: ProductFilterBarProps) {
  const { data: brands } = useBrands();
  const brandOptions = useMemo(
    () => (brands ?? []).map((b) => ({ value: b.id, label: b.name })),
    [brands],
  );

  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      <div className="w-96">
        <Input
          placeholder="Tìm theo tên/SKU sản phẩm"
          value={searchInput}
          onChange={(e) => onSearchInputChange(e.target.value)}
        />
      </div>
      <div className="w-48">
        <Select
          allowClear
          placeholderColor="gray-700"
          placeholder="Thương hiệu"
          options={brandOptions}
          value={brandId}
          onChange={onBrandIdChange}
        />
      </div>
      <div className="w-64">
        <CategoryTreeSelect placeholder="Danh mục" value={categoryIds} onChange={onCategoryIdsChange} />
      </div>
      {showStatusFilter && (
        <div className="w-52">
          <Select
            allowClear
            placeholderColor="gray-700"
            placeholder="Trạng thái"
            // Select dùng chung chỉ nhận option.value dạng string — status thật (state +
            // query param) vẫn là number, ép qua lại đúng ở ranh giới UI này.
            value={status !== undefined ? String(status) : undefined}
            onChange={(value) =>
              onStatusChange?.(value !== undefined ? (Number(value) as ProductStatus) : undefined)
            }
            options={Object.values(ProductStatus).map((value) => ({
              value: String(value),
              label: PRODUCT_STATUS_LABEL[value].label,
            }))}
          />
        </div>
      )}
      {onIsFeaturedChange && (
        <div className="w-44">
          <Select
            allowClear
            placeholderColor="gray-700"
            placeholder="Nổi bật"
            value={isFeatured !== undefined ? String(isFeatured) : undefined}
            onChange={(value) => onIsFeaturedChange(value !== undefined ? value === "true" : undefined)}
            options={FEATURED_OPTIONS}
          />
        </div>
      )}
      {onSortChange && (
        <div className="w-56">
          <Select
            allowClear
            placeholderColor="gray-700"
            placeholder="Sắp xếp"
            value={sort}
            onChange={(value) => onSortChange(value as ProductSort | undefined)}
            options={SORT_OPTIONS}
          />
        </div>
      )}
    </div>
  );
}
