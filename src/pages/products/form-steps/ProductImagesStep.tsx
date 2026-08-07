import { useState } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import type { ProductFormValues } from "@/schemas/product.schema";
import ComponentCard from "@/components/common/ComponentCard";
import { ImageUploader } from "@/components/common/ImageUploader";
import { Modal } from "@/components/ui/modal";

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

  const images = useWatch({ control, name: "images" }) ?? [];
  const variants = useWatch({ control, name: "variants" }) ?? [];
  // Màu lặp lại ở nhiều dòng biến thể (mỗi size 1 dòng) — chỉ cần gán ảnh 1 lần/màu,
  // assignImageToColor bên dưới tự áp cho mọi dòng cùng màu. Danh sách biến thể chỉ vài
  // dòng nên không cần useMemo — variants đổi identity mỗi render (useWatch) nên memo
  // hoá cũng không tiết kiệm được gì.
  const colors = Array.from(
    new Set(variants.map((v) => v.color?.trim()).filter((color): color is string => !!color)),
  );
  const [pickingColor, setPickingColor] = useState<string | null>(null);

  function colorImageUrl(color: string): string | undefined {
    return variants.find((v) => v.color?.trim() === color)?.imageUrl || undefined;
  }

  function assignImageToColor(color: string, url: string | undefined) {
    getValues("variants").forEach((variant, index) => {
      if (variant.color?.trim() === color) {
        setValue(`variants.${index}.imageUrl`, url);
      }
    });
    setPickingColor(null);
  }

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
                  setValue("imagePublicIds", [...currentPublicIds, publicId]);
                  return;
                }
                // đây vẫn còn chứa url — tìm đúng vị trí để xóa publicId tương ứng.
                const currentImages = getValues("images") ?? [];
                const index = currentImages.indexOf(url);
                if (index === -1) return;
                setValue(
                  "imagePublicIds",
                  currentPublicIds.filter((_, i) => i !== index),
                );
              }}
              onReorder={(fromIndex, toIndex) => {
                const currentPublicIds = getValues("imagePublicIds") ?? [];
                const next = [...currentPublicIds];
                [next[fromIndex], next[toIndex]] = [next[toIndex], next[fromIndex]];
                setValue("imagePublicIds", next);
              }}
            />
          )}
        />
        {errors.images && (
          <p className="mt-1.5 text-xs text-form-error">{errors.images.message}</p>
        )}
      </ComponentCard>

      {colors.length > 0 && (
        <ComponentCard title="Ảnh theo màu sắc">
          <p className="mb-4 text-xs text-gray-400 dark:text-gray-500">
            Chọn 1 ảnh trong "Ảnh chi tiết sản phẩm" ở trên làm ảnh đại diện cho từng màu — khi
            khách xem trên website chọn màu, ảnh chính sẽ tự động chuyển đúng ảnh này.
          </p>
          <div className="flex flex-wrap gap-4">
            {colors.map((color) => {
              const url = colorImageUrl(color);
              return (
                <div key={color} className="flex flex-col items-center gap-2">
                  <button
                    type="button"
                    disabled={viewOnly}
                    onClick={() => setPickingColor(color)}
                    className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border border-dashed border-gray-300 text-center text-xs text-gray-400 transition-colors hover:border-brand-400 hover:text-brand-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:text-gray-500"
                  >
                    {url ? (
                      <img src={url} alt={color} className="h-full w-full object-cover" />
                    ) : (
                      <span className="px-1">Chọn ảnh</span>
                    )}
                  </button>
                  <span className="max-w-20 truncate text-xs text-gray-600 dark:text-gray-300" title={color}>
                    {color}
                  </span>
                </div>
              );
            })}
          </div>
        </ComponentCard>
      )}

      <Modal
        isOpen={pickingColor !== null}
        onClose={() => setPickingColor(null)}
        className="max-w-lg p-6"
      >
        <h4 className="mb-4 text-base font-medium text-gray-800 dark:text-white/90">
          Chọn ảnh đại diện cho màu &quot;{pickingColor}&quot;
        </h4>
        {images.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Chưa có ảnh nào trong "Ảnh chi tiết sản phẩm" ở trên — thêm ảnh trước rồi quay lại đây.
          </p>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {images.map((url) => (
              <button
                key={url}
                type="button"
                onClick={() => pickingColor && assignImageToColor(pickingColor, url)}
                className="aspect-square overflow-hidden rounded-lg border border-gray-200 transition-colors hover:border-brand-500 dark:border-gray-700"
              >
                <img src={url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
        {pickingColor && colorImageUrl(pickingColor) && (
          <button
            type="button"
            onClick={() => assignImageToColor(pickingColor, undefined)}
            className="mt-4 text-xs text-error-500 hover:underline"
          >
            Bỏ chọn ảnh cho màu này
          </button>
        )}
      </Modal>
    </div>
  );
}
