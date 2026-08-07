import { Controller, useFormContext } from "react-hook-form";
import type { ProductFormValues } from "@/schemas/product.schema";
import ComponentCard from "@/components/common/ComponentCard";
import { ImageUploader } from "@/components/common/ImageUploader";

interface ProductImagesStepProps {
  viewOnly?: boolean;
}

export function ProductImagesStep({ viewOnly = false }: ProductImagesStepProps) {
  const {
    control,
    formState: { errors },
  } = useFormContext<ProductFormValues>();

  return (
    <div className="space-y-6">
      <ComponentCard title="Ảnh đại diện" required>
        <Controller
          name="thumbnail"
          control={control}
          render={({ field }) => (
            <ImageUploader value={field.value} onChange={field.onChange} max={1} readOnly={viewOnly} />
          )}
        />
        {errors.thumbnail && (
          <p className="mt-1.5 text-xs text-form-error">{errors.thumbnail.message}</p>
        )}
      </ComponentCard>

      <ComponentCard title="Ảnh chi tiết sản phẩm" required>
        <Controller
          name="images"
          control={control}
          render={({ field }) => (
            <ImageUploader
              value={field.value ?? []}
              onChange={field.onChange}
              max={8}
              readOnly={viewOnly}
            />
          )}
        />
        {errors.images && (
          <p className="mt-1.5 text-xs text-form-error">{errors.images.message}</p>
        )}
      </ComponentCard>
    </div>
  );
}
