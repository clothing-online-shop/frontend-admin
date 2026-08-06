import { Controller, useFormContext } from "react-hook-form";
import type { ProductFormValues } from "@/schemas/product.schema";
import ComponentCard from "@/components/common/ComponentCard";
import { ImageUploader } from "@/components/ImageUploader";

export function ProductImagesStep() {
  const {
    control,
    getValues,
    setValue,
    formState: { errors },
  } = useFormContext<ProductFormValues>();

  return (
    <ComponentCard title="Ảnh sản phẩm">
      <div>
        <Controller
          name="thumbnail"
          control={control}
          render={({ field }) => (
            <ImageUploader
              value={field.value}
              onChange={field.onChange}
              max={1}
              label="Ảnh đại diện"
              onPublicIdChange={(_url, publicId) =>
                setValue("thumbnailPublicId", publicId ?? undefined)
              }
            />
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
          <ImageUploader
            value={field.value ?? []}
            onChange={field.onChange}
            max={8}
            label="Thư viện ảnh"
            onPublicIdChange={(url, publicId) => {
              const currentPublicIds = getValues("imagePublicIds") ?? [];
              if (publicId) {
                // Ảnh mới upload: onChange sắp nối url vào CUỐI mảng images, nên
                // nối publicId vào cuối imagePublicIds để giữ đúng thứ tự khớp vị trí.
                setValue("imagePublicIds", [...currentPublicIds, publicId]);
                return;
              }
              // Ảnh bị xóa: ImageUploader báo trước khi đổi images, nên field.value
              // ở đây vẫn còn chứa url — tìm đúng vị trí để xóa publicId tương ứng.
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
    </ComponentCard>
  );
}
