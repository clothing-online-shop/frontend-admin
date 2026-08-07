import { useRef, useState } from "react";
import { deleteImage, uploadImage } from "@/lib/api/upload-api";
import Spinner from "@/components/ui/spinner/Spinner";
import { PlusIcon, TrashBinIcon, AngleLeftIcon, AngleRightIcon } from "@/icons";
import { useToast } from "@/hooks/useToast";

interface ImageUploaderProps {
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
  label?: string;
  // Màn xem (view-only): ẩn hẳn nút thêm/xóa/đổi thứ tự ảnh, không chỉ disable — các nút
  // này vô nghĩa khi không có thao tác lưu nào theo sau.
  readOnly?: boolean;
}

export function ImageUploader({ value, onChange, max = 8, label, readOnly = false }: ImageUploaderProps) {
  const [publicIds, setPublicIds] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  async function handleFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploaded: string[] = [];
      const nextPublicIds: Record<string, string> = {};
      for (const file of Array.from(files).slice(0, max - value.length)) {
        try {
          const result = await uploadImage(file);
          uploaded.push(result.url);
          nextPublicIds[result.url] = result.publicId;
        } catch {
          toast.error("Upload ảnh thất bại");
        }
      }
      if (uploaded.length > 0) {
        setPublicIds((prev) => ({ ...prev, ...nextPublicIds }));
        onChange([...value, ...uploaded]);
      }
    } finally {
      setUploading(false);
    }
  }

  function handleRemove(url: string) {
    onChange(value.filter((v) => v !== url));
    const publicId = publicIds[url];
    if (publicId) {
      deleteImage(publicId).catch(() => undefined);
    }
  }

  function moveImage(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  const canReorder = value.length > 1;

  return (
    <div>
      {label ? <div className="mb-3 font-medium text-gray-700 dark:text-gray-300">{label}</div> : null}
      <div className="flex flex-wrap gap-6">
        {value.map((url, index) => (
          <div
            key={url}
            className="group relative h-52 w-52 shrink-0 overflow-hidden rounded-xl border border-gray-200 shadow-theme-xs dark:border-gray-700"
          >
            <img src={url} alt="" className="h-full w-full object-cover" />
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
                  <AngleLeftIcon className="h-5 w-5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => handleRemove(url)}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-error-500 shadow-theme-xs transition-colors hover:bg-error-50"
                aria-label="Xóa ảnh"
              >
                <TrashBinIcon className="h-5 w-5" />
              </button>
              {canReorder && (
                <button
                  type="button"
                  disabled={index === value.length - 1}
                  onClick={() => moveImage(index, 1)}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-gray-700 shadow-theme-xs transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Di chuyển ảnh sang phải"
                >
                  <AngleRightIcon className="h-5 w-5" />
                </button>
              )}
            </div>
            )}
          </div>
        ))}
        {!readOnly && value.length < max ? (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/jpg"
              multiple={max - value.length > 1}
              className="hidden"
              onChange={(e) => {
                void handleFilesSelected(e.target.files);
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
                  <PlusIcon className="h-9 w-9" />
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
