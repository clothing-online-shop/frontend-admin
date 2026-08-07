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
    getValues,
    setValue,
    formState: { errors },
  } = useFormContext<ProductFormValues>();

  return (
    <div className="space-y-6">
      <ComponentCard title="Ảnh đại diện" required>
        <Controller
          name="thumbnail"
          control={control}
          render={({ field }) => (
            <ImageUploader
              value={field.value}
              onChange={field.onChange}
              max={1}
              readOnly={viewOnly}
              onPublicIdChange={(_url, publicId) =>
                setValue("thumbnailPublicId", publicId ?? undefined)
              }
            />
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
              onPublicIdChange={(url, publicId) => {
                const currentPublicIds = getValues("imagePublicIds") ?? [];
                if (publicId) {
                  // Ảnh mới upload: onChange sắp nối url vào CUỐI mảng images, nên nối
                  // publicId vào cuối imagePublicIds để giữ đúng thứ tự khớp vị trí.
                  setValue("imagePublicIds", [...currentPublicIds, publicId]);
                  return;
                }
                // Ảnh bị xóa: ImageUploader báo trước khi đổi images, nên field.value ở
                // đây vẫn còn chứa url — tìm đúng vị trí để xóa publicId tương ứng.
                const currentImages = getValues("images") ?? [];
                const index = currentImages.indexOf(url);
                if (index === -1) return;
                setValue(
                  "imagePublicIds",
                  currentPublicIds.filter((_, i) => i !== index),
                );
              }}
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
