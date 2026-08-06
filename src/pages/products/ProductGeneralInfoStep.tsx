import { useMemo } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { ProductStatus } from "@/lib/shared-types";
import type { ProductFormValues } from "@/schemas/product.schema";
import { useCategoryTree } from "@/hooks/useCategories";
import { useBrands } from "@/hooks/useBrands";
import { RichTextEditor } from "@/components/RichTextEditor";
import ComponentCard from "@/components/common/ComponentCard";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";

export function ProductGeneralInfoStep() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<ProductFormValues>();

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

  return (
    <ComponentCard title="Thông tin chung">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
          Tên sản phẩm <span className="text-error-500">*</span>
        </label>
        <Input
          placeholder="Ví dụ: Áo sơ mi nam trắng"
          {...register("name")}
          error={!!errors.name}
          hint={errors.name?.message}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
          Slug (bỏ trống để tự sinh)
        </label>
        <Input placeholder="ao-so-mi-nam-trang" {...register("slug")} />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
          Mô tả sản phẩm
        </label>
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <RichTextEditor value={field.value ?? ""} onChange={field.onChange} />
          )}
        />
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
            Chất liệu
          </label>
          <Input placeholder="Ví dụ: Cotton 100%" {...register("material")} />
        </div>
        <div className="flex-1">
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
            Hướng dẫn bảo quản
          </label>
          <Input
            placeholder="Ví dụ: Giặt tay, không dùng thuốc tẩy"
            {...register("careInstructions")}
          />
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
            Danh mục <span className="text-error-500">*</span>
          </label>
          <Controller
            name="categoryId"
            control={control}
            render={({ field }) => (
              <Select
                placeholder="Chọn danh mục"
                options={categoryOptions}
                value={field.value || undefined}
                onChange={(value) => field.onChange(value ?? "")}
              />
            )}
          />
          {errors.categoryId && (
            <p className="mt-1.5 text-xs text-error-500">{errors.categoryId.message}</p>
          )}
        </div>
        <div className="flex-1">
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
            Thương hiệu
          </label>
          <Controller
            name="brandId"
            control={control}
            render={({ field }) => (
              <Select
                allowClear
                placeholder="Chọn thương hiệu"
                options={brandOptions}
                value={field.value || undefined}
                onChange={(value) => field.onChange(value ?? "")}
              />
            )}
          />
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
            Giá gốc <span className="text-error-500">*</span>
          </label>
          <Input
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
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
            Giá khuyến mãi
          </label>
          <Input
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
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
            Trạng thái
          </label>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onChange={(value) =>
                  field.onChange((value as ProductStatus) ?? ProductStatus.DRAFT)
                }
                options={[
                  { value: ProductStatus.DRAFT, label: "Nháp" },
                  { value: ProductStatus.ACTIVE, label: "Đang bán" },
                  { value: ProductStatus.INACTIVE, label: "Ngừng bán" },
                ]}
              />
            )}
          />
        </div>
      </div>
    </ComponentCard>
  );
}
