import { useEffect, useState } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import type { Popup } from "@/types/shared-types";
import { ImageUploader } from "@/components/common/ImageUploader";
import { useCreatePopup, useUpdatePopup } from "@/hooks/usePopups";
import { getErrorMessage } from "@/lib/error";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import DatePicker from "@/components/form/DatePicker";
import FieldLabel from "@/components/form/FieldLabel";
import Spinner from "@/components/ui/spinner/Spinner";
import { useToast } from "@/hooks/useToast";
import { popupSchema, type PopupFormValues } from "@/schemas/popup.schema";

interface PopupFormModalProps {
  open: boolean;
  onClose: () => void;
  editing: Popup | null;
  viewOnly?: boolean;
}

const EMPTY_VALUES: PopupFormValues = {
  eyebrow: "",
  title: "",
  description: "",
  discountCode: "",
  image: [],
  ctaLabel: "",
  ctaLinkUrl: "",
  startDate: "",
  endDate: "",
};

// Popup.startDate/endDate về từ API là ISO datetime — cắt về "Y-m-d" để khớp định dạng
// flatpickr đang dùng (giống BannerForm.tsx).
function toDateOnly(iso: string): string {
  return iso.slice(0, 10);
}

export default function PopupFormModal({
  open,
  onClose,
  editing,
  viewOnly = false,
}: PopupFormModalProps) {
  const toast = useToast();
  const [imagePublicId, setImagePublicId] = useState<string | null>(null);
  const createMutation = useCreatePopup();
  const updateMutation = useUpdatePopup();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PopupFormValues>({
    resolver: yupResolver(popupSchema),
    defaultValues: EMPTY_VALUES,
  });

  // minDate cho lịch chọn ngày kết thúc bám theo ngày bắt đầu đang chọn, giống
  // BannerForm.tsx.
  const startDateValue = useWatch({ control, name: "startDate" });

  useEffect(() => {
    if (open) {
      reset({
        eyebrow: editing?.eyebrow ?? "",
        title: editing?.title ?? "",
        description: editing?.description ?? "",
        discountCode: editing?.discountCode ?? "",
        image: editing?.imageUrl ? [editing.imageUrl] : [],
        ctaLabel: editing?.ctaLabel ?? "",
        ctaLinkUrl: editing?.ctaLinkUrl ?? "",
        startDate: editing?.startDate ? toDateOnly(editing.startDate) : "",
        endDate: editing?.endDate ? toDateOnly(editing.endDate) : "",
      });
      setImagePublicId(editing?.imagePublicId ?? null);
    }
  }, [open, editing, reset]);

  async function onValid(values: PopupFormValues) {
    const imageChanged = values.image[0] !== editing?.imageUrl;

    try {
      if (editing) {
        await updateMutation.mutateAsync({
          id: editing.id,
          payload: {
            eyebrow: values.eyebrow || undefined,
            title: values.title,
            // Chỉ gửi kèm cặp imageUrl/imagePublicId khi ảnh thực sự đổi — giống
            // BannerForm.tsx.
            ...(imageChanged
              ? { imageUrl: values.image[0], imagePublicId: imagePublicId ?? undefined }
              : {}),
            description: values.description || undefined,
            discountCode: values.discountCode || undefined,
            ctaLabel: values.ctaLabel,
            ctaLinkUrl: values.ctaLinkUrl,
            startDate: values.startDate,
            endDate: values.endDate,
          },
        });
        toast.success("Đã cập nhật popup.");
      } else {
        await createMutation.mutateAsync({
          eyebrow: values.eyebrow || undefined,
          title: values.title,
          description: values.description || undefined,
          discountCode: values.discountCode || undefined,
          imageUrl: values.image[0],
          imagePublicId: imagePublicId ?? "",
          ctaLabel: values.ctaLabel,
          ctaLinkUrl: values.ctaLinkUrl,
          startDate: values.startDate,
          endDate: values.endDate,
        });
        toast.success("Đã tạo popup.");
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
          {viewOnly ? "Xem popup" : editing ? "Sửa popup" : "Thêm popup"}
        </h3>

        <fieldset disabled={viewOnly} className="m-0 min-w-0 space-y-4 border-0 p-0">
          <div>
            <Input
              label="Tiêu đề phụ"
              disabled={viewOnly}
              placeholder="Ví dụ: ƯU ĐÃI THÁNG 8"
              {...register("eyebrow")}
              error={!!errors.eyebrow}
              hint={errors.eyebrow?.message}
            />
          </div>

          <div>
            <Input
              label="Tiêu đề chính"
              required
              disabled={viewOnly}
              placeholder="Ví dụ: Giảm 15% đơn từ 800.000đ"
              {...register("title")}
              error={!!errors.title}
              hint={errors.title?.message}
            />
          </div>

          <div>
            <Input
              label="Mô tả"
              disabled={viewOnly}
              placeholder="Ví dụ: Nhập mã THU26 ở bước thanh toán"
              {...register("description")}
              error={!!errors.description}
              hint={errors.description?.message}
            />
          </div>

          <div>
            <Input
              label="Mã giảm giá"
              disabled={viewOnly}
              placeholder="Ví dụ: THU26"
              {...register("discountCode")}
              error={!!errors.discountCode}
              hint={errors.discountCode?.message}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nhãn nút CTA"
              required
              disabled={viewOnly}
              placeholder="Ví dụ: Mua sắm ngay"
              {...register("ctaLabel")}
              error={!!errors.ctaLabel}
              hint={errors.ctaLabel?.message}
            />
            <Input
              label="Link đích CTA"
              required
              disabled={viewOnly}
              placeholder="/san-pham"
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
                  id="popup-start-date"
                  label="Ngày bắt đầu"
                  required
                  placeholder="Chọn ngày bắt đầu"
                  defaultDate={field.value || undefined}
                  // Chỉ chặn quá khứ khi TẠO MỚI — xem lý do ở BannerForm.tsx.
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
                  id="popup-end-date"
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
            <FieldLabel label="Ảnh popup" required />
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
