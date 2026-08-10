import { useMemo, useRef } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { ProductStatus } from "@/types/shared-types";
import type { ProductFormValues } from "@/schemas/product.schema";
import { slugifyPreview } from "@/lib/slug";
import { useCategoryTree } from "@/hooks/useCategories";
import { useBrands } from "@/hooks/useBrands";
import { RichTextEditor } from "@/components/common/RichTextEditor";
import ComponentCard from "@/components/common/ComponentCard";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import FieldLabel from "@/components/form/FieldLabel";

interface ProductGeneralInfoStepProps {
  viewOnly?: boolean;
}

export function ProductGeneralInfoStep({ viewOnly = false }: ProductGeneralInfoStepProps) {
  const {
    register,
    control,
    setValue,
    formState: { errors },
  } = useFormContext<ProductFormValues>();

  // Chỉ đồng bộ slug theo đúng thao tác gõ tên (onChange thật của input), không
  // watch("name") + useEffect — vì reset() lúc load sản phẩm để sửa cũng đổi giá trị
  // "name" và sẽ vô tình kích hoạt effect, ghi đè slug đã lưu ngay khi vào trang dù
  // người dùng chưa đụng gì tới tên. Gắn thẳng vào onChange thì chỉ chạy khi gõ thật.
  const slugTouchedRef = useRef(false);
  const nameField = register("name");
  const slugField = register("slug");

  const { data: categoryTree } = useCategoryTree();
  const categoryOptions = useMemo(() => {
    function flatten(
      nodes: typeof categoryTree = [],
      depth = 0,
    ): { value: string; label: string }[] {
      return (nodes ?? []).flatMap((node) => [
        { value: node.id, label: `${"— ".repeat(depth)}${node.name}` },
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

  const listStatus = [
    { value: String(ProductStatus.DRAFT), label: "Chưa mở bán" },
    { value: String(ProductStatus.ACTIVE), label: "Đang mở bán" },
    { value: String(ProductStatus.INACTIVE), label: "Ngừng kinh doanh" },
  ];

  return (
    <ComponentCard title="Thông tin chung">
      <div>
        <Input
          label="Tên sản phẩm"
          required
          placeholder="Ví dụ: Áo sơ mi nam trắng"
          {...nameField}
          onChange={(e) => {
            nameField.onChange(e);
            if (!slugTouchedRef.current) {
              setValue("slug", slugifyPreview(e.target.value), { shouldValidate: true });
            }
          }}
          error={!!errors.name}
          hint={errors.name?.message}
        />
      </div>

      <div>
        <FieldLabel label="Mô tả sản phẩm" required />
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <RichTextEditor value={field.value ?? ""} onChange={field.onChange} disabled={viewOnly} />
          )}
        />
        {errors.description && (
          <p className="mt-1.5 text-xs text-form-error">{errors.description.message}</p>
        )}
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            label="Chất liệu"
            required
            placeholder="Ví dụ: Cotton 100%"
            {...register("material")}
            error={!!errors.material}
            hint={errors.material?.message}
          />
        </div>
        <div className="flex-1">
          <Input
            label="Hướng dẫn bảo quản"
            placeholder="Ví dụ: Giặt tay, không dùng thuốc tẩy"
            {...register("careInstructions")}
          />
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <Controller
            name="categoryId"
            control={control}
            render={({ field }) => (
              <Select
                label="Danh mục"
                required
                placeholder="Chọn danh mục"
                options={categoryOptions}
                value={field.value || undefined}
                onChange={(value) => field.onChange(value ?? "")}
                error={!!errors.categoryId}
                hint={errors.categoryId?.message}
                disabled={viewOnly}
              />
            )}
          />
        </div>
        <div className="flex-1">
          <Controller
            name="brandId"
            control={control}
            render={({ field }) => (
              <Select
                label="Thương hiệu"
                allowClear
                placeholder="Chọn thương hiệu"
                options={brandOptions}
                value={field.value || undefined}
                onChange={(value) => field.onChange(value ?? "")}
                disabled={viewOnly}
              />
            )}
          />
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            label="Giá gốc"
            required
            type="number"
            min="1000"
            step={1000}
            placeholder="0"
            {...register("basePrice")}
            error={!!errors.basePrice}
            hint={errors.basePrice?.message}
          />
        </div>
        <div className="flex-1">
          <Input
            label="Giá khuyến mãi"
            type="number"
            min="0"
            step={1000}
            placeholder="Bỏ trống nếu không giảm giá"
            {...register("salePrice")}
            error={!!errors.salePrice}
            hint={errors.salePrice?.message}
          />
        </div>
        <div className="flex-1">
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select
                label="Trạng thái"
                required
                // Select dùng chung chỉ nhận option.value dạng string — status thật trong
                // form state vẫn là number, ép qua lại đúng ở ranh giới UI này (giống pattern
                // Select "Số dòng/trang" ở Pagination.tsx).
                value={String(field.value)}
                onChange={(value) =>
                  field.onChange(value !== undefined ? Number(value) : ProductStatus.DRAFT)
                }
                options={listStatus}
                error={!!errors.status}
                hint={errors.status?.message}
                disabled={viewOnly}
              />
            )}
          />
        </div>
      </div>

      <div>
        <Input
          label="URL"
          required
          placeholder="ao-so-mi-nam-trang"
          {...slugField}
          onChange={(e) => {
            slugTouchedRef.current = true;
            slugField.onChange(e);
          }}
          error={!!errors.slug}
          hint={errors.slug?.message}
        />
        <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
          Tự sinh theo tên sản phẩm — có thể sửa tay nếu cần URL khác.
        </p>
      </div>
    </ComponentCard>
  );
}
