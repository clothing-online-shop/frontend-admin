import { Controller, useFormContext } from "react-hook-form";
import type { ProductFormValues } from "@/schemas/product.schema";
import ComponentCard from "@/components/common/ComponentCard";
import { ImageUploader } from "@/components/ImageUploader";

export function ProductImagesStep() {
  const {
    control,
    formState: { errors },
  } = useFormContext<ProductFormValues>();

  return (
    <ComponentCard title="Ảnh sản phẩm">
      <div>
        <Controller
          name="thumbnail"
          control={control}
          render={({ field }) => (
            <ImageUploader value={field.value} onChange={field.onChange} max={1} label="Ảnh đại diện" />
          )}
        />
        {errors.thumbnail && (
          <p className="mt-1.5 text-xs text-form-error">{errors.thumbnail.message}</p>
        )}
      </div>
      <Controller
        name="images"
        control={control}
        render={({ field }) => (
          <ImageUploader value={field.value ?? []} onChange={field.onChange} max={8} label="Thư viện ảnh" />
        )}
      />
    </ComponentCard>
  );
}
