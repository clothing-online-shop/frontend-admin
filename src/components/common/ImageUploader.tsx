import Spinner from "@/components/ui/spinner/Spinner";
import { PlusIcon, TrashBinIcon, AngleLeftIcon, AngleRightIcon } from "@/icons";
import { useImageUploader } from "@/hooks/useImageUploader";

interface ImageUploaderProps {
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
  label?: string;
  // Màn xem (view-only): ẩn hẳn nút thêm/xóa/đổi thứ tự ảnh, không chỉ disable — các nút
  // này vô nghĩa khi không có thao tác lưu nào theo sau.
  readOnly?: boolean;
  // Cho phép nơi gọi lưu lại publicId song song với url (vd. để BE dọn ảnh cũ trên
  // Cloudinary khi thay/xóa ảnh) — optional nên không ảnh hưởng chỗ chưa cần theo dõi.
  onPublicIdChange?: (url: string, publicId: string | null) => void;
  // Báo khi đổi thứ tự 2 ảnh — xem giải thích ở useImageUploader.ts.
  onReorder?: (fromIndex: number, toIndex: number) => void;
}

export function ImageUploader({
  value,
  onChange,
  max = 8,
  label,
  readOnly = false,
  onPublicIdChange,
  onReorder,
}: ImageUploaderProps) {
  const { uploading, fileInputRef, handleFilesSelected, handleRemove, moveImage } = useImageUploader({
    value,
    onChange,
    max,
    onPublicIdChange,
    onReorder,
  });

  const canReorder = value.length > 1;

  return (
    <div>
      {label ? <div className="mb-3 font-medium text-gray-700 dark:text-gray-300">{label}</div> : null}
      <div className="flex flex-wrap gap-6">
        {value.map((url, index) => (
          <div
            key={url}
            className="group relative h-52 shrink-0 overflow-hidden rounded-xl border border-gray-200 shadow-theme-xs dark:border-gray-700"
          >
            {/* Chỉ cố định chiều cao, chiều rộng để auto theo tỉ lệ ảnh thật (không phải
                object-contain trong khung vuông) — viền ôm sát khít ảnh, không còn khoảng
                trống 2 bên với ảnh dọc/hẹp hơn khung. */}
            <img src={url} alt="" className="h-full w-auto" />
            {!readOnly && (
            <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/0 opacity-0 transition-all duration-200 ease-standard group-hover:bg-black/40 group-hover:opacity-100">
              {canReorder && (
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => moveImage(index, -1)}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-gray-700 shadow-theme-xs transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Di chuyển ảnh sang trái"
                >
                  <AngleLeftIcon className="h-7 w-7" />
                </button>
              )}
              <button
                type="button"
                onClick={() => handleRemove(url)}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-error-500 shadow-theme-xs transition-colors hover:bg-error-50"
                aria-label="Xóa ảnh"
              >
                <TrashBinIcon className="h-7 w-7" />
              </button>
              {canReorder && (
                <button
                  type="button"
                  disabled={index === value.length - 1}
                  onClick={() => moveImage(index, 1)}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-gray-700 shadow-theme-xs transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Di chuyển ảnh sang phải"
                >
                  <AngleRightIcon className="h-7 w-7" />
                </button>
              )}
            </div>
            )}
          </div>
        ))}
        {readOnly && value.length === 0 && (
          <div className="flex h-52 w-52 shrink-0 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 text-sm text-gray-400 dark:border-gray-700 dark:text-gray-500">
            Chưa có ảnh
          </div>
        )}
        {!readOnly && value.length < max ? (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/jpg"
              multiple={max - value.length > 1}
              className="hidden"
              onChange={(e) => {
                handleFilesSelected(e.target.files);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex h-52 w-52 shrink-0 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 text-base text-gray-500 transition-colors duration-200 ease-standard hover:border-brand-400 hover:text-brand-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-400"
            >
              {uploading ? (
                <Spinner className="text-brand-500" />
              ) : (
                <>
                  <PlusIcon className="h-11 w-11" />
                  <span>Thêm ảnh</span>
                </>
              )}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
