import { useRef, useState } from "react";
import { deleteImage, uploadImage } from "@/lib/upload-api";
import Button from "@/components/ui/button/Button";
import Spinner from "@/components/ui/spinner/Spinner";
import { PlusIcon, TrashBinIcon, AngleLeftIcon, AngleRightIcon } from "@/icons";
import { useToast } from "@/hooks/useToast";

interface ImageUploaderProps {
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
  label?: string;
  // Cho phép nơi gọi lưu lại publicId song song với url (vd. để BE dọn ảnh cũ
  // trên Cloudinary khi thay/xóa ảnh) — optional nên không ảnh hưởng chỗ đã
  // dùng ImageUploader mà chưa cần theo dõi publicId.
  onPublicIdChange?: (url: string, publicId: string | null) => void;
}

export function ImageUploader({ value, onChange, max = 8, label, onPublicIdChange }: ImageUploaderProps) {
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
          onPublicIdChange?.(result.url, result.publicId);
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
    // Báo publicId=null TRƯỚC khi đổi value: nơi gọi (vd ProductImagesStep) cần
    // tra cứu vị trí của url trong mảng `images` hiện tại để xóa đúng publicId
    // tương ứng — đổi thứ tự sẽ làm mất url khỏi mảng trước khi tra được vị trí.
    onPublicIdChange?.(url, null);
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

  return (
    <div>
      {label ? <div className="mb-2 font-medium text-gray-700 dark:text-gray-300">{label}</div> : null}
      <div className="flex flex-wrap gap-4">
        {value.map((url, index) => (
          <div key={url} className="flex flex-col items-center gap-1.5">
            <div className="h-24 w-24 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
              <img src={url} alt="" className="h-full w-full object-cover" />
            </div>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="!px-2 !py-1.5"
                disabled={index === 0}
                onClick={() => moveImage(index, -1)}
              >
                <AngleLeftIcon className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="!px-2 !py-1.5 !text-error-500 hover:!bg-error-50"
                onClick={() => handleRemove(url)}
              >
                <TrashBinIcon className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="!px-2 !py-1.5"
                disabled={index === value.length - 1}
                onClick={() => moveImage(index, 1)}
              >
                <AngleRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        {value.length < max ? (
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
              className="flex h-24 w-24 items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 text-sm text-gray-500 transition hover:border-brand-400 hover:text-brand-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-400"
            >
              {uploading ? <Spinner size="sm" /> : <PlusIcon className="h-5 w-5" />}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
