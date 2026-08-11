import { useMemo } from "react";
import { ProductStatus } from "@/types/shared-types";
import { useBrands } from "@/hooks/useBrands";
import { PRODUCT_STATUS_LABEL } from "@/lib/productStatus";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import CategoryTreeSelect from "@/components/form/CategoryTreeSelect";

interface ProductFilterBarProps {
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  brandId: string | undefined;
  onBrandIdChange: (value: string | undefined) => void;
  categoryIds: string[];
  onCategoryIdsChange: (ids: string[]) => void;
  status: ProductStatus | undefined;
  onStatusChange: (value: ProductStatus | undefined) => void;
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
      <div className="w-52">
        <Select
          allowClear
          placeholderColor="gray-700"
          placeholder="Trạng thái"
          // Select dùng chung chỉ nhận option.value dạng string — status thật (state +
          // query param) vẫn là number, ép qua lại đúng ở ranh giới UI này.
          value={status !== undefined ? String(status) : undefined}
          onChange={(value) =>
            onStatusChange(value !== undefined ? (Number(value) as ProductStatus) : undefined)
          }
          options={Object.values(ProductStatus).map((value) => ({
            value: String(value),
            label: PRODUCT_STATUS_LABEL[value].label,
          }))}
        />
      </div>
    </div>
  );
}
