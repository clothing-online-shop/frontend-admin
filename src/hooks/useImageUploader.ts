import { useRef, useState } from "react";
import { deleteImage, uploadImage } from "@/lib/api/upload-api";
import { useToast } from "@/hooks/useToast";

interface UseImageUploaderOptions {
  value: string[];
  onChange: (urls: string[]) => void;
  max: number;
  // Cho phép nơi gọi lưu lại publicId song song với url (vd. để BE dọn ảnh cũ trên
  // Cloudinary khi thay/xóa ảnh) — optional nên không ảnh hưởng chỗ chưa cần theo dõi.
  onPublicIdChange?: (url: string, publicId: string | null) => void;
  // Báo khi đổi thứ tự 2 ảnh (nút trái/phải) — nơi gọi cần swap đúng vị trí này trong
  // mảng publicId song song của họ, nếu không imagePublicIds[i] sẽ lệch khỏi images[i]
  // sau khi sắp xếp lại (moveImage chỉ tự đổi thứ tự `value`, không biết gì về mảng đó).
  onReorder?: (fromIndex: number, toIndex: number) => void;
}

interface UseImageUploaderResult {
  uploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFilesSelected: (files: FileList | null) => void;
  handleRemove: (url: string) => void;
  moveImage: (index: number, direction: -1 | 1) => void;
}

/**
 * Logic upload/xóa/sắp xếp ảnh dùng chung cho mọi field kiểu "mảng URL ảnh" — gọi API
 * upload/xóa (Cloudinary qua lib/api/upload-api), tự nhớ publicId theo url để xóa đúng
 * ảnh trên storage khi bị gỡ khỏi form. Không biết gì về màn hình gọi nó (sản phẩm,
 * danh mục, thương hiệu...) — chỉ nhận value/onChange/max như 1 field bất kỳ.
 */
export function useImageUploader({
  value,
  onChange,
  max,
  onPublicIdChange,
  onReorder,
}: UseImageUploaderOptions): UseImageUploaderResult {
  const [publicIds, setPublicIds] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  // Luôn đọc `value` mới nhất tại thời điểm upload xong, không phải giá trị lúc bắt
  // đầu upload — nếu người dùng xóa 1 ảnh khác trong lúc đang chờ upload, closure của
  // handleFilesSelected vẫn giữ `value` cũ (thiếu lần xóa đó), ghi đè `onChange` phía
  // dưới sẽ vô tình thêm lại ảnh vừa bị xóa.
  const valueRef = useRef(value);
  valueRef.current = value;

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
        onChange([...valueRef.current, ...uploaded]);
      }
    } finally {
      setUploading(false);
    }
  }

  function handleRemove(url: string) {
    // Báo publicId=null TRƯỚC khi đổi value: nơi gọi (vd ProductImagesStep) cần tra
    // cứu vị trí của url trong mảng hiện tại để xóa đúng publicId tương ứng — đổi thứ
    // tự sẽ làm mất url khỏi mảng trước khi tra được vị trí.
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
    onReorder?.(index, target);
  }

  return {
    uploading,
    fileInputRef,
    handleFilesSelected: (files) => void handleFilesSelected(files),
    handleRemove,
    moveImage,
  };
}
