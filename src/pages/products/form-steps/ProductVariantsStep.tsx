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
  // true khi user vừa bấm "Lưu" ở bước này (luồng sửa) và validate thất bại — xem
  // ProductGeneralInfoStep.tsx để biết lý do cần cờ này thay vì chỉ dùng isSubmitted.
  saveAttempted?: boolean;
}

// Độ rộng dùng chung giữa hàng tiêu đề và từng hàng input — đổi ở 1 chỗ là khớp lại
// ngay cả 2 nơi, không lệch cột.
const COLUMN_WIDTH = {
  size: "w-24",
  color: "w-36",
  sku: "w-52",
  price: "w-36",
  stock: "w-24",
  weight: "w-28",
};

export function ProductVariantsStep({
  viewOnly = false,
  saveAttempted = false,
}: ProductVariantsStepProps) {
  const {
    register,
    control,
    getValues,
    setValue,
    trigger,
    formState: { errors, dirtyFields, isSubmitted: isSubmittedFromForm },
  } = useFormContext<ProductFormValues>();
  const isSubmitted = isSubmittedFromForm || saveAttempted;
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

  // size/color dùng chung 1 kiểu wiring: onChange tự trigger("variants") lại (rule
  // "no-duplicate-variants" gắn trên field mảng cha, không tự re-validate theo field con —
  // xem comment gốc trước đây ở onChange của size), onBlur tự gợi ý SKU, error tra theo
  // đúng field. Trước đây lặp lại y hệt cho từng field, chỉ khác mỗi field key.
  function variantFieldProps(index: number, key: "size" | "color") {
    const field = register(`variants.${index}.${key}`);
    return {
      ...field,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        field.onChange(e);
        void trigger("variants");
      },
      onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
        field.onBlur(e);
        suggestSku(index);
      },
      error: !!visibleFieldError(
        errors.variants?.[index]?.[key]?.message,
        dirtyFields.variants?.[index]?.[key],
        isSubmitted,
      ),
    };
  }

  return (
    <ComponentCard title="Biến thể (size / màu)" required={true}>
      <div className="flex flex-col gap-3">
        {variantsError && <p className="text-xs text-form-error">{variantsError}</p>}

        <p className="text-xs text-gray-700 font-bold dark:text-gray-500">
          Bỏ trống SKU để tự sinh theo tên sản phẩm + size + màu. Bỏ trống Giá bán để dùng giá
          gốc của sản phẩm. Tồn kho chỉ nhập được lúc thêm biến thể mới — biến thể đã có, vào
          trang Tồn kho để nhập/xuất/điều chỉnh (luôn có lịch sử, không sửa trực tiếp ở đây).
          Khối lượng bắt buộc khi thêm biến thể mới — biến thể đã có, bỏ trống để giữ nguyên
          khối lượng cũ.
        </p>

        {fields.length > 0 && (
          <div className="flex items-center gap-3 px-1">
            <span className={`${COLUMN_WIDTH.size} text-xs font-medium text-gray-700 dark:text-gray-400`}>
              Size <span className="text-error-500">*</span>
            </span>
            <span className={`${COLUMN_WIDTH.color} text-xs font-medium text-gray-700 dark:text-gray-400`}>
              Màu sắc <span className="text-error-500">*</span>
            </span>
            <span className={`${COLUMN_WIDTH.sku} text-xs font-medium text-gray-700 dark:text-gray-400`}>
              SKU
            </span>
            <span className={`${COLUMN_WIDTH.price} text-xs font-medium text-gray-700 dark:text-gray-400`}>
              Giá bán
            </span>
            <span className={`${COLUMN_WIDTH.stock} text-xs font-medium text-gray-700 dark:text-gray-400`}>
              Tồn kho
            </span>
            <span className={`${COLUMN_WIDTH.weight} text-xs font-medium text-gray-700 dark:text-gray-400`}>
              Khối lượng (g)
            </span>
          </div>
        )}

        {fields.map((field, index) => {
          const skuField = register(`variants.${index}.sku`);
          const rowLabel = `biến thể dòng ${index + 1}`;
          // Có id => biến thể đã lưu ở BE — BE giờ bỏ qua stockQuantity gửi kèm khi sửa
          // biến thể đã có (xem products.service.ts syncVariants()), khoá input ở đây cho
          // khớp, tránh admin tưởng sửa được nhưng lưu xong tồn kho vẫn không đổi.
          const isExistingVariant = !!getValues(`variants.${index}.id`);

          return (
            <div key={field.id} className="flex flex-wrap items-end gap-3">
              <div className={COLUMN_WIDTH.size}>
                <Input
                  placeholder="M"
                  aria-label={`Size ${rowLabel}`}
                  {...variantFieldProps(index, "size")}
                />
              </div>
              <div className={COLUMN_WIDTH.color}>
                <Input
                  placeholder="Đen"
                  aria-label={`Màu sắc ${rowLabel}`}
                  {...variantFieldProps(index, "color")}
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
                  aria-label={
                    isExistingVariant
                      ? `Tồn kho ${rowLabel} (chỉ xem — sửa tại trang Tồn kho)`
                      : `Tồn kho ${rowLabel}`
                  }
                  disabled={isExistingVariant}
                  {...register(`variants.${index}.stockQuantity`)}
                />
              </div>
              <div className={COLUMN_WIDTH.weight}>
                <Input
                  type="number"
                  min="1"
                  placeholder="300"
                  aria-label={`Khối lượng ${rowLabel}`}
                  {...register(`variants.${index}.weight`)}
                  error={!!visibleFieldError(
                    errors.variants?.[index]?.weight?.message,
                    dirtyFields.variants?.[index]?.weight,
                    isSubmitted,
                  )}
                  hint={visibleFieldError(
                    errors.variants?.[index]?.weight?.message,
                    dirtyFields.variants?.[index]?.weight,
                    isSubmitted,
                  )}
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
            onClick={() =>
              append({
                size: "",
                color: "",
                sku: "",
                price: undefined,
                stockQuantity: 0,
                weight: undefined,
              })
            }
            className="self-start"
          >
            Thêm biến thể
          </Button>
        )}
      </div>
    </ComponentCard>
  );
}
