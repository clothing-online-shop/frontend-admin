import { useState } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import type { ProductFormValues } from "@/schemas/product.schema";
import ComponentCard from "@/components/common/ComponentCard";
import { ImageUploader } from "@/components/common/ImageUploader";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { PlusIcon, TrashBinIcon, CheckLineIcon } from "@/icons";
import { visibleFieldError } from "@/lib/form";

interface ProductImagesStepProps {
  viewOnly?: boolean;
}

export function ProductImagesStep({ viewOnly = false }: ProductImagesStepProps) {
  const {
    control,
    getValues,
    setValue,
    formState: { errors, dirtyFields, isSubmitted },
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

  // Màn xem (viewOnly): chỉ hiện màu đã có ảnh, ẩn hẳn ô "Chọn ảnh" trống — không có thao
  // tác nào theo sau nên ô trống ở đây vô nghĩa, giống cách ImageUploader ẩn nút thêm/xóa
  // khi readOnly.
  const visibleColors = viewOnly ? colors.filter((color) => colorImageUrl(color)) : colors;

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
        {visibleFieldError(errors.thumbnail?.message, dirtyFields.thumbnail, isSubmitted) && (
          <p className="mt-1.5 text-xs text-form-error">
            {visibleFieldError(errors.thumbnail?.message, dirtyFields.thumbnail, isSubmitted)}
          </p>
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
                // Ảnh bị xóa có thể đang được gán làm ảnh đại diện cho 1 màu ở khối "Ảnh
                // theo màu sắc" — gỡ luôn, không thì màu đó vẫn hiển thị ảnh đã không còn
                // tồn tại trong gallery nữa.
                getValues("variants").forEach((variant, i) => {
                  if (variant.imageUrl === url) {
                    setValue(`variants.${i}.imageUrl`, undefined);
                  }
                });
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
        {visibleFieldError(errors.images?.message, dirtyFields.images, isSubmitted) && (
          <p className="mt-1.5 text-xs text-form-error">
            {visibleFieldError(errors.images?.message, dirtyFields.images, isSubmitted)}
          </p>
        )}
      </ComponentCard>

      {visibleColors.length > 0 && (
        <ComponentCard title="Ảnh theo màu sắc">
          <div className="flex flex-wrap gap-5">
            {visibleColors.map((color) => {
              const url = colorImageUrl(color);
              return (
                <div key={color} className="flex flex-col items-center gap-2">
                  <div
                    className={`group relative h-28 shrink-0 overflow-hidden rounded-xl border border-gray-200 shadow-theme-xs dark:border-gray-700 ${
                      url ? "" : "w-28"
                    }`}
                  >
                    {url ? (
                      <>
                        {/* Chỉ cố định chiều cao, chiều rộng auto theo tỉ lệ ảnh thật —
                            viền ôm sát khít ảnh, không cắt góc và không có khoảng trống. */}
                        <img src={url} alt={color} className="h-full w-auto" />
                        {!viewOnly && (
                          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition-all duration-200 ease-standard group-hover:bg-black/40 group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={() => setPickingColor(color)}
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-gray-700 shadow-theme-xs transition-colors hover:bg-white"
                              aria-label={`Đổi ảnh cho màu ${color}`}
                            >
                              <PlusIcon className="h-6 w-6" />
                            </button>
                            <button
                              type="button"
                              onClick={() => assignImageToColor(color, undefined)}
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-error-500 shadow-theme-xs transition-colors hover:bg-error-50"
                              aria-label={`Bỏ ảnh cho màu ${color}`}
                            >
                              <TrashBinIcon className="h-6 w-6" />
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <button
                        type="button"
                        disabled={viewOnly}
                        onClick={() => setPickingColor(color)}
                        className="flex h-full w-full flex-col items-center justify-center gap-1 border border-dashed border-gray-300 text-xs text-gray-400 transition-colors hover:border-brand-400 hover:text-brand-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:text-gray-500"
                      >
                        <PlusIcon className="h-7 w-7" />
                        <span>Chọn ảnh</span>
                      </button>
                    )}
                  </div>
                  <span
                    className="max-w-28 truncate text-sm text-gray-700 dark:text-gray-300"
                    title={color}
                  >
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
        className="max-w-3xl p-6"
      >
        <h4 className="mb-1 text-base font-medium text-gray-800 dark:text-white/90">
          Chọn ảnh đại diện cho màu &quot;{pickingColor}&quot;
        </h4>
        <p className="mb-4 text-xs text-gray-400 dark:text-gray-500">
          Ảnh này sẽ hiển thị khi khách chọn màu &quot;{pickingColor}&quot; ở trang sản phẩm.
        </p>
        {images.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Chưa có ảnh nào trong "Ảnh chi tiết sản phẩm" ở trên — thêm ảnh trước rồi quay lại đây.
          </p>
        ) : (
          <div className="flex max-h-[60vh] flex-wrap gap-4 overflow-y-auto py-1">
            {images.map((url) => {
              const isSelected = pickingColor ? colorImageUrl(pickingColor) === url : false;
              return (
                <button
                  key={url}
                  type="button"
                  onClick={() => pickingColor && assignImageToColor(pickingColor, url)}
                  className={`relative h-40 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                    isSelected
                      ? "border-brand-500 ring-2 ring-brand-500/30"
                      : "border-gray-200 hover:border-brand-400 dark:border-gray-700"
                  }`}
                >
                  {/* Chỉ cố định chiều cao, chiều rộng auto theo tỉ lệ ảnh thật — viền ôm
                      sát khít ảnh, không có khoảng trống như khi ép khung vuông cố định. */}
                  <img src={url} alt="" className="h-full w-auto" />
                  {isSelected && (
                    <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-white">
                      <CheckLineIcon className="h-6 w-6" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
        {pickingColor && colorImageUrl(pickingColor) && (
          <div className="mt-4 flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="!text-error-500 hover:!bg-error-50"
              onClick={() => assignImageToColor(pickingColor, undefined)}
            >
              Bỏ chọn ảnh cho màu này
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
