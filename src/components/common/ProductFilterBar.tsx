import { useMemo } from "react";
import { ProductStatus } from "@/types/shared-types";
import { useCategoryTree } from "@/hooks/useCategories";
import { useBrands } from "@/hooks/useBrands";
import { PRODUCT_STATUS_LABEL } from "@/lib/productStatus";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";

interface ProductFilterBarProps {
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  brandId: string | undefined;
  onBrandIdChange: (value: string | undefined) => void;
  category: string | undefined;
  onCategoryChange: (value: string | undefined) => void;
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
  category,
  onCategoryChange,
  status,
  onStatusChange,
  className = "",
}: ProductFilterBarProps) {
  const { data: categoryTree } = useCategoryTree();
  const categoryOptions = useMemo(() => {
    // "— " lặp theo depth để thể hiện phân cấp cha/con trong dropdown phẳng — cùng
    // convention với parentOptions ở CategoryFormModal.tsx.
    function flatten(
      nodes: typeof categoryTree = [],
      depth = 0,
    ): { value: string; label: string }[] {
      return (nodes ?? []).flatMap((node) => [
        { value: node.slug, label: `${"— ".repeat(depth)}${node.name}` },
        ...flatten(node.children, depth + 1),
      ]);
    }
    return flatten(categoryTree);
  }, [categoryTree]);

  const { data: brands } = useBrands();
  const brandOptions = useMemo(
    () => (brands ?? []).map((b) => ({ value: b.id, label: b.name })),
    [brands],
  );

  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      <div className="w-65">
        <Input
          placeholder="Tìm theo tên/SKU sản phẩm"
          value={searchInput}
          onChange={(e) => onSearchInputChange(e.target.value)}
        />
      </div>
      <div className="w-48">
        <Select
          allowClear
          placeholder="Thương hiệu"
          options={brandOptions}
          value={brandId}
          onChange={onBrandIdChange}
        />
      </div>
      <div className="w-50">
        <Select
          allowClear
          placeholder="Danh mục"
          options={categoryOptions}
          value={category}
          onChange={onCategoryChange}
        />
      </div>
      <div className="w-40">
        <Select
          allowClear
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
