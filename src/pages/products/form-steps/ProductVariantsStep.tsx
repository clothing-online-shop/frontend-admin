import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import type { ProductFormValues } from "@/schemas/product.schema";
import { slugifyPreview } from "@/lib/slug";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import CurrencyInput from "@/components/form/input/CurrencyInput";
import { PlusIcon, TrashBinIcon } from "@/icons";
import { visibleFieldError } from "@/lib/form";

interface ProductVariantsStepProps {
  viewOnly?: boolean;
}

// Độ rộng dùng chung giữa hàng tiêu đề và từng hàng input — đổi ở 1 chỗ là khớp lại
// ngay cả 2 nơi, không lệch cột.
const COLUMN_WIDTH = {
  size: "w-24",
  color: "w-36",
  sku: "w-52",
  price: "w-36",
  stock: "w-24",
};

export function ProductVariantsStep({ viewOnly = false }: ProductVariantsStepProps) {
  const {
    register,
    control,
    getValues,
    setValue,
    trigger,
    formState: { errors, dirtyFields, isSubmitted },
  } = useFormContext<ProductFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "variants" });

  function suggestSku(index: number) {
    const variant = getValues(`variants.${index}`);
    if (!variant || variant.sku) return;
    const baseSlug = getValues("slug") || slugifyPreview(getValues("name") || "");
    if (!baseSlug || !variant.size || !variant.color) return;
    const sku = slugifyPreview(`${baseSlug}-${variant.size}-${variant.color}`).toUpperCase();
    setValue(`variants.${index}.sku`, sku);
  }

  const variantsError = visibleFieldError(
    errors.variants?.message ?? errors.variants?.root?.message,
    !!dirtyFields.variants,
    isSubmitted,
  );

  return (
    <ComponentCard title="Biến thể (size / màu)" required={true}>
      <div className="flex flex-col gap-3">
        {variantsError && <p className="text-base text-form-error">{variantsError}</p>}

        <p className="text-base text-gray-700 font-bold dark:text-gray-500">
          Bỏ trống SKU để tự sinh theo tên sản phẩm + size + màu. Bỏ trống Giá bán để dùng giá
          gốc của sản phẩm.
        </p>

        {fields.length > 0 && (
          <div className="flex items-center gap-3 px-1">
            <span className={`${COLUMN_WIDTH.size} text-base font-medium text-gray-700 dark:text-gray-400`}>
              Size <span className="text-error-500">*</span>
            </span>
            <span className={`${COLUMN_WIDTH.color} text-base font-medium text-gray-700 dark:text-gray-400`}>
              Màu sắc <span className="text-error-500">*</span>
            </span>
            <span className={`${COLUMN_WIDTH.sku} text-base font-medium text-gray-700 dark:text-gray-400`}>
              SKU
            </span>
            <span className={`${COLUMN_WIDTH.price} text-base font-medium text-gray-700 dark:text-gray-400`}>
              Giá bán
            </span>
            <span className={`${COLUMN_WIDTH.stock} text-base font-medium text-gray-700 dark:text-gray-400`}>
              Tồn kho
            </span>
          </div>
        )}

        {fields.map((field, index) => {
          const sizeField = register(`variants.${index}.size`);
          const colorField = register(`variants.${index}.color`);
          const skuField = register(`variants.${index}.sku`);
          const rowLabel = `biến thể dòng ${index + 1}`;

          return (
            <div key={field.id} className="flex flex-wrap items-end gap-3">
              <div className={COLUMN_WIDTH.size}>
                <Input
                  placeholder="M"
                  aria-label={`Size ${rowLabel}`}
                  {...sizeField}
                  onChange={(e) => {
                    sizeField.onChange(e);
                    // Rule "no-duplicate-variants" ở product.schema.ts gắn trên field
                    // "variants" (mảng), không phải "variants.N.size" — RHF mode "onChange"
                    // chỉ tự re-validate đúng field vừa đổi, không tự lan sang field cha
                    // dạng mảng nên lỗi trùng lặp không tự mất dù đã sửa đúng. Gọi trigger()
                    // tường minh để yêu cầu RHF chạy lại đúng rule đó (không phải tự viết
                    // validate mới, vẫn dùng lại Yup schema).
                    void trigger("variants");
                  }}
                  onBlur={(e) => {
                    sizeField.onBlur(e);
                    suggestSku(index);
                  }}
                  error={
                    !!visibleFieldError(
                      errors.variants?.[index]?.size?.message,
                      dirtyFields.variants?.[index]?.size,
                      isSubmitted,
                    )
                  }
                />
              </div>
              <div className={COLUMN_WIDTH.color}>
                <Input
                  placeholder="Đen"
                  aria-label={`Màu sắc ${rowLabel}`}
                  {...colorField}
                  onChange={(e) => {
                    colorField.onChange(e);
                    void trigger("variants");
                  }}
                  onBlur={(e) => {
                    colorField.onBlur(e);
                    suggestSku(index);
                  }}
                  error={
                    !!visibleFieldError(
                      errors.variants?.[index]?.color?.message,
                      dirtyFields.variants?.[index]?.color,
                      isSubmitted,
                    )
                  }
                />
              </div>
              <div className={COLUMN_WIDTH.sku}>
                <Input
                  placeholder="Tự sinh"
                  aria-label={`SKU ${rowLabel}`}
                  {...skuField}
                  onChange={(e) => {
                    // Ép in hoa ngay lúc gõ (không đợi blur) — áp dụng cho cả SKU tự sinh
                    // lẫn admin gõ tay trực tiếp, đảm bảo luôn nhất quán in hoa.
                    e.target.value = e.target.value.toUpperCase();
                    skuField.onChange(e);
                  }}
                />
              </div>
              <div className={COLUMN_WIDTH.price}>
                <Controller
                  name={`variants.${index}.price`}
                  control={control}
                  render={({ field }) => (
                    <CurrencyInput
                      placeholder="Theo giá gốc"
                      ariaLabel={`Giá bán ${rowLabel}`}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                    />
                  )}
                />
              </div>
              <div className={COLUMN_WIDTH.stock}>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  aria-label={`Tồn kho ${rowLabel}`}
                  {...register(`variants.${index}.stockQuantity`)}
                />
              </div>
              {!viewOnly && (
                <Button
                  type="button"
                  variant="outline"
                  className="!px-2.5 !py-2.5 !text-error-500 hover:!bg-error-50"
                  onClick={() => {
                    remove(index);
                    void trigger("variants");
                  }}
                  aria-label={`Xóa ${rowLabel}`}
                >
                  <TrashBinIcon className="h-6 w-6" />
                </Button>
              )}
            </div>
          );
        })}
        {!viewOnly && (
          <Button
            type="button"
            variant="outline"
            startIcon={<PlusIcon className="h-6 w-6" />}
            onClick={() => append({ size: "", color: "", sku: "", price: undefined, stockQuantity: 0 })}
            className="self-start"
          >
            Thêm biến thể
          </Button>
        )}
      </div>
    </ComponentCard>
  );
}
