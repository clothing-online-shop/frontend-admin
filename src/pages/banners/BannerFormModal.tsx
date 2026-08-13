import { useEffect, useState } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import type { Banner } from "@/types/shared-types";
import { ImageUploader } from "@/components/common/ImageUploader";
import { useCreateBanner, useUpdateBanner } from "@/hooks/useBanners";
import { getErrorMessage } from "@/lib/error";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import DatePicker from "@/components/form/DatePicker";
import FieldLabel from "@/components/form/FieldLabel";
import Spinner from "@/components/ui/spinner/Spinner";
import { useToast } from "@/hooks/useToast";
import { bannerSchema, type BannerFormValues } from "@/schemas/banner.schema";

interface BannerFormModalProps {
  open: boolean;
  onClose: () => void;
  editing: Banner | null;
}

const EMPTY_VALUES: BannerFormValues = {
  title: "",
  image: [],
  linkUrl: "",
  startDate: "",
  endDate: "",
};

// Banner.startDate/endDate về từ API là ISO datetime — cắt về "Y-m-d" để khớp định dạng
// flatpickr đang dùng (giống CollectionFormModal.tsx).
function toDateOnly(iso: string): string {
  return iso.slice(0, 10);
}

export default function BannerFormModal({ open, onClose, editing }: BannerFormModalProps) {
  const toast = useToast();
  const [imagePublicId, setImagePublicId] = useState<string | null>(null);
  const createMutation = useCreateBanner();
  const updateMutation = useUpdateBanner();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BannerFormValues>({
    resolver: yupResolver(bannerSchema),
    defaultValues: EMPTY_VALUES,
  });

  // minDate cho lịch chọn ngày kết thúc bám theo ngày bắt đầu đang chọn, giống
  // CollectionFormModal.tsx.
  const startDateValue = useWatch({ control, name: "startDate" });

  useEffect(() => {
    if (open) {
      reset({
        title: editing?.title ?? "",
        image: editing?.imageUrl ? [editing.imageUrl] : [],
        linkUrl: editing?.linkUrl ?? "",
        startDate: editing?.startDate ? toDateOnly(editing.startDate) : "",
        endDate: editing?.endDate ? toDateOnly(editing.endDate) : "",
      });
      setImagePublicId(editing?.imagePublicId ?? null);
    }
  }, [open, editing, reset]);

  async function onValid(values: BannerFormValues) {
    const imageChanged = values.image[0] !== editing?.imageUrl;

    try {
      if (editing) {
        await updateMutation.mutateAsync({
          id: editing.id,
          payload: {
            title: values.title,
            // Chỉ gửi kèm cặp imageUrl/imagePublicId khi ảnh thực sự đổi — imagePublicId
            // không nullable ở BE nên không có khái niệm "xóa ảnh" ở đây (khác banner
            // của Collection), chỉ có "giữ nguyên" hoặc "thay ảnh mới".
            ...(imageChanged
              ? { imageUrl: values.image[0], imagePublicId: imagePublicId ?? undefined }
              : {}),
            linkUrl: values.linkUrl || null,
            startDate: values.startDate,
            endDate: values.endDate,
          },
        });
        toast.success("Đã cập nhật banner.");
      } else {
        await createMutation.mutateAsync({
          title: values.title,
          imageUrl: values.image[0],
          imagePublicId: imagePublicId ?? "",
          linkUrl: values.linkUrl || undefined,
          startDate: values.startDate,
          endDate: values.endDate,
        });
        toast.success("Đã tạo banner.");
      }
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <Modal isOpen={open} onClose={onClose} className="max-w-lg m-4">
      <form onSubmit={handleSubmit(onValid)} className="p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90">
          {editing ? "Sửa banner" : "Thêm banner"}
        </h3>

        <div className="space-y-4">
          <div>
            <Input
              label="Tiêu đề"
              required
              placeholder="Ví dụ: Sale mùa hè 2026"
              {...register("title")}
              error={!!errors.title}
              hint={errors.title?.message}
            />
          </div>

          <div>
            <Input
              label="Link đích"
              placeholder="https://..."
              {...register("linkUrl")}
              error={!!errors.linkUrl}
              hint={errors.linkUrl?.message}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Controller
              name="startDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  id="banner-start-date"
                  label="Ngày bắt đầu"
                  placeholder="Chọn ngày bắt đầu"
                  defaultDate={field.value || undefined}
                  onChange={(_dates, dateStr) => field.onChange(dateStr)}
                />
              )}
            />
            <Controller
              name="endDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  id="banner-end-date"
                  label="Ngày kết thúc"
                  placeholder="Chọn ngày kết thúc"
                  defaultDate={field.value || undefined}
                  minDate={startDateValue || "today"}
                  onChange={(_dates, dateStr) => field.onChange(dateStr)}
                />
              )}
            />
          </div>
          {(errors.startDate || errors.endDate) && (
            <p className="text-theme-xs -mt-2 text-error-500">
              {errors.startDate?.message ?? errors.endDate?.message}
            </p>
          )}

          <div>
            <FieldLabel label="Ảnh banner" />
            <Controller
              name="image"
              control={control}
              render={({ field }) => (
                <ImageUploader
                  value={field.value}
                  onChange={field.onChange}
                  max={1}
                  onPublicIdChange={(_url, publicId) => setImagePublicId(publicId)}
                />
              )}
            />
            {errors.image && <p className="text-theme-xs mt-1.5 text-error-500">{errors.image.message}</p>}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Hủy
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSaving}
            startIcon={isSaving ? <Spinner size="sm" /> : undefined}
          >
            Lưu
          </Button>
        </div>
      </form>
    </Modal>
  );
}
