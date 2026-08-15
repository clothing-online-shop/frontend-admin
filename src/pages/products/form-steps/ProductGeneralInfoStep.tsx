import { useMemo, useRef } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { ProductStatus } from "@/types/shared-types";
import type { ProductFormValues } from "@/schemas/product.schema";
import { slugifyPreview } from "@/lib/slug";
import { visibleFieldError } from "@/lib/form";
import { useBrands } from "@/hooks/useBrands";
import { RichTextEditor } from "@/components/common/RichTextEditor";
import ComponentCard from "@/components/common/ComponentCard";
import Input from "@/components/form/input/InputField";
import CurrencyInput from "@/components/form/input/CurrencyInput";
import Select from "@/components/form/Select";
import CategorySelect from "@/components/form/CategorySelect";
import FieldLabel from "@/components/form/FieldLabel";

interface ProductGeneralInfoStepProps {
  viewOnly?: boolean;
  // true khi user vừa bấm "Lưu" ở bước này (luồng sửa) và validate thất bại — ORed vào
  // isSubmitted để hiện lỗi field dù chưa dirty, vì handleSaveStep() dùng trigger() nên
  // formState.isSubmitted của RHF không tự bật (chỉ handleSubmit() mới bật). Xem ProductForm.tsx.
  saveAttempted?: boolean;
}

export function ProductGeneralInfoStep({
  viewOnly = false,
  saveAttempted = false,
}: ProductGeneralInfoStepProps) {
  const {
    register,
    control,
    setValue,
    formState: { errors, dirtyFields, isSubmitted: isSubmittedFromForm },
  } = useFormContext<ProductFormValues>();
  const isSubmitted = isSubmittedFromForm || saveAttempted;

  // Chỉ đồng bộ slug theo đúng thao tác gõ tên (onChange thật của input), không
  // watch("name") + useEffect — vì reset() lúc load sản phẩm để sửa cũng đổi giá trị
  // "name" và sẽ vô tình kích hoạt effect, ghi đè slug đã lưu ngay khi vào trang dù
  // người dùng chưa đụng gì tới tên. Gắn thẳng vào onChange thì chỉ chạy khi gõ thật.
  const slugTouchedRef = useRef(false);
  const nameField = register("name");
  const slugField = register("slug");

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
          error={!!visibleFieldError(errors.name?.message, dirtyFields.name, isSubmitted)}
          hint={visibleFieldError(errors.name?.message, dirtyFields.name, isSubmitted)}
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
        {visibleFieldError(errors.description?.message, dirtyFields.description, isSubmitted) && (
          <p className="mt-1.5 text-xs text-form-error">
            {visibleFieldError(errors.description?.message, dirtyFields.description, isSubmitted)}
          </p>
        )}
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            label="Chất liệu"
            required
            placeholder="Ví dụ: Cotton 100%"
            {...register("material")}
            error={!!visibleFieldError(errors.material?.message, dirtyFields.material, isSubmitted)}
            hint={visibleFieldError(errors.material?.message, dirtyFields.material, isSubmitted)}
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
              <CategorySelect
                label="Danh mục"
                required
                value={field.value || undefined}
                onChange={(value) => field.onChange(value ?? "")}
                error={!!visibleFieldError(errors.categoryId?.message, dirtyFields.categoryId, isSubmitted)}
                hint={visibleFieldError(errors.categoryId?.message, dirtyFields.categoryId, isSubmitted)}
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
                placeholderColor="gray-400"
              />
            )}
          />
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <Controller
            name="basePrice"
            control={control}
            render={({ field }) => (
              <CurrencyInput
                label="Giá gốc"
                required
                placeholder="0"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={!!visibleFieldError(errors.basePrice?.message, dirtyFields.basePrice, isSubmitted)}
                hint={visibleFieldError(errors.basePrice?.message, dirtyFields.basePrice, isSubmitted)}
                disabled={viewOnly}
              />
            )}
          />
        </div>
        <div className="flex-1">
          <Controller
            name="salePrice"
            control={control}
            render={({ field }) => (
              <CurrencyInput
                label="Giá khuyến mãi"
                placeholder="Bỏ trống nếu không giảm giá"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={!!visibleFieldError(errors.salePrice?.message, dirtyFields.salePrice, isSubmitted)}
                hint={visibleFieldError(errors.salePrice?.message, dirtyFields.salePrice, isSubmitted)}
                disabled={viewOnly}
              />
            )}
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
                error={!!visibleFieldError(errors.status?.message, dirtyFields.status, isSubmitted)}
                hint={visibleFieldError(errors.status?.message, dirtyFields.status, isSubmitted)}
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
          error={!!visibleFieldError(errors.slug?.message, dirtyFields.slug, isSubmitted)}
          hint={visibleFieldError(errors.slug?.message, dirtyFields.slug, isSubmitted)}
        />
        <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
          Tự sinh theo tên sản phẩm — có thể sửa tay nếu cần URL khác.
        </p>
      </div>
    </ComponentCard>
  );
}
