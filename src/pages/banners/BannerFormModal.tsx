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
  viewOnly?: boolean;
}

const EMPTY_VALUES: BannerFormValues = {
  title: "",
  subtitle: "",
  image: [],
  linkUrl: "",
  ctaLabel: "",
  ctaLinkUrl: "",
  startDate: "",
  endDate: "",
};

// Banner.startDate/endDate về từ API là ISO datetime — cắt về "Y-m-d" để khớp định dạng
// flatpickr đang dùng (giống CollectionFormModal.tsx).
function toDateOnly(iso: string): string {
  return iso.slice(0, 10);
}

export default function BannerFormModal({
  open,
  onClose,
  editing,
  viewOnly = false,
}: BannerFormModalProps) {
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
        subtitle: editing?.subtitle ?? "",
        image: editing?.imageUrl ? [editing.imageUrl] : [],
        linkUrl: editing?.linkUrl ?? "",
        ctaLabel: editing?.ctaLabel ?? "",
        ctaLinkUrl: editing?.ctaLinkUrl ?? "",
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
            subtitle: values.subtitle || undefined,
            linkUrl: values.linkUrl || null,
            ctaLabel: values.ctaLabel || undefined,
            ctaLinkUrl: values.ctaLinkUrl || undefined,
            startDate: values.startDate,
            endDate: values.endDate,
          },
        });
        toast.success("Đã cập nhật banner.");
      } else {
        await createMutation.mutateAsync({
          title: values.title,
          subtitle: values.subtitle || undefined,
          imageUrl: values.image[0],
          imagePublicId: imagePublicId ?? "",
          linkUrl: values.linkUrl || undefined,
          ctaLabel: values.ctaLabel || undefined,
          ctaLinkUrl: values.ctaLinkUrl || undefined,
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
          {viewOnly ? "Xem banner" : editing ? "Sửa banner" : "Thêm banner"}
        </h3>

        {/* fieldset disabled tự vô hiệu hoá Input/nút bấm trong ImageUploader khi xem —
            DatePicker vẫn cần truyền disabled riêng vì flatpickr tự mở lịch bằng JS, không
            dựa theo input[disabled] của trình duyệt (khớp CollectionFormModal.tsx). */}
        <fieldset disabled={viewOnly} className="m-0 min-w-0 space-y-4 border-0 p-0">
          <div>
            <Input
              label="Tiêu đề"
              required
              disabled={viewOnly}
              placeholder="Ví dụ: Sale mùa hè 2026"
              {...register("title")}
              error={!!errors.title}
              hint={errors.title?.message}
            />
          </div>

          <div>
            <Input
              label="Phụ đề"
              disabled={viewOnly}
              placeholder="Ví dụ: Ưu đãi tới 50% cho bộ sưu tập mới"
              {...register("subtitle")}
              error={!!errors.subtitle}
              hint={errors.subtitle?.message}
            />
          </div>

          <div>
            <Input
              label="Link đích (CTA chính)"
              disabled={viewOnly}
              placeholder="https://..."
              {...register("linkUrl")}
              error={!!errors.linkUrl}
              hint={errors.linkUrl?.message}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nhãn CTA phụ"
              disabled={viewOnly}
              placeholder="Ví dụ: Xem thêm"
              {...register("ctaLabel")}
              error={!!errors.ctaLabel}
              hint={errors.ctaLabel?.message}
            />
            <Input
              label="Link đích CTA phụ"
              disabled={viewOnly}
              placeholder="https://..."
              {...register("ctaLinkUrl")}
              error={!!errors.ctaLinkUrl}
              hint={errors.ctaLinkUrl?.message}
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
                  required
                  placeholder="Chọn ngày bắt đầu"
                  defaultDate={field.value || undefined}
                  // Chỉ chặn quá khứ khi TẠO MỚI — banner đang sửa có thể đã RUNNING/ENDED,
                  // startDate lúc đó vốn dĩ đã ở quá khứ; đặt minDate="today" trong trường hợp
                  // đó khiến flatpickr âm thầm bỏ qua defaultDate nằm trước minDate (giống
                  // gotcha đã ghi chú ở CollectionFormModal.tsx).
                  minDate={!editing && !viewOnly ? "today" : undefined}
                  disabled={viewOnly}
                  onChange={(_dates, dateStr) => field.onChange(dateStr)}
                  error={!!errors.startDate}
                  hint={errors.startDate?.message}
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
                  required
                  placeholder="Chọn ngày kết thúc"
                  defaultDate={field.value || undefined}
                  minDate={startDateValue || "today"}
                  disabled={viewOnly}
                  onChange={(_dates, dateStr) => field.onChange(dateStr)}
                  error={!!errors.endDate}
                  hint={errors.endDate?.message}
                />
              )}
            />
          </div>

          <div>
            <FieldLabel label="Ảnh banner" required />
            <Controller
              name="image"
              control={control}
              render={({ field }) => (
                <ImageUploader
                  value={field.value}
                  onChange={field.onChange}
                  max={1}
                  readOnly={viewOnly}
                  onPublicIdChange={(_url, publicId) => setImagePublicId(publicId)}
                />
              )}
            />
            {errors.image && <p className="text-theme-xs mt-1.5 text-error-500">{errors.image.message}</p>}
          </div>
        </fieldset>

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            {viewOnly ? "Đóng" : "Hủy"}
          </Button>
          {!viewOnly && (
            <Button
              type="submit"
              variant="primary"
              disabled={isSaving}
              startIcon={isSaving ? <Spinner size="sm" /> : undefined}
            >
              Lưu
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}
