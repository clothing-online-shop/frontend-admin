import { useFieldArray, useFormContext } from "react-hook-form";
import type { ProductFormValues } from "@/schemas/product.schema";
import { slugifyPreview } from "@/lib/slug";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import { PlusIcon, TrashBinIcon } from "@/icons";

export function ProductVariantsStep() {
  const {
    register,
    control,
    getValues,
    setValue,
    formState: { errors },
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

  const variantsError = errors.variants?.message ?? errors.variants?.root?.message;

  return (
    <ComponentCard title="Biến thể (size / màu)">
      <div className="flex flex-col gap-3">
        {variantsError && <p className="text-xs text-form-error">{variantsError}</p>}
        {fields.map((field, index) => {
          const sizeField = register(`variants.${index}.size`);
          const colorField = register(`variants.${index}.color`);

          return (
            <div key={field.id} className="flex flex-wrap items-end gap-3">
              <div className="w-28">
                <Input
                  placeholder="Size"
                  {...sizeField}
                  onBlur={(e) => {
                    sizeField.onBlur(e);
                    suggestSku(index);
                  }}
                  error={!!errors.variants?.[index]?.size}
                />
              </div>
              <div className="w-32">
                <Input
                  placeholder="Màu sắc"
                  {...colorField}
                  onBlur={(e) => {
                    colorField.onBlur(e);
                    suggestSku(index);
                  }}
                  error={!!errors.variants?.[index]?.color}
                />
              </div>
              <div className="w-50">
                <Input placeholder="SKU (tự sinh)" {...register(`variants.${index}.sku`)} />
              </div>
              <div className="w-50">
                <Input
                  type="number"
                  placeholder="Giá (= giá gốc nếu bỏ trống)"
                  {...register(`variants.${index}.price`)}
                />
              </div>
              <div className="w-30">
                <Input
                  type="number"
                  min="0"
                  placeholder="Tồn kho"
                  {...register(`variants.${index}.stockQuantity`)}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                className="!px-2.5 !py-2.5 !text-error-500 hover:!bg-error-50"
                onClick={() => remove(index)}
              >
                <TrashBinIcon className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
        <Button
          type="button"
          variant="outline"
          startIcon={<PlusIcon className="h-4 w-4" />}
          onClick={() => append({ size: "", color: "", sku: "", price: undefined, stockQuantity: 0 })}
          className="self-start"
        >
          Thêm biến thể
        </Button>
      </div>
    </ComponentCard>
  );
}
