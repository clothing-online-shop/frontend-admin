import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useWatch, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { usePopupDetail, useCreatePopup, useUpdatePopup } from "@/hooks/usePopups";
import { getErrorMessage } from "@/lib/error";
import { visibleFieldError } from "@/lib/form";
import { useToast } from "@/hooks/useToast";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import { popupSchema, type PopupFormValues } from "@/schemas/popup.schema";
import ComponentCard from "@/components/common/ComponentCard";
import { ImageUploader } from "@/components/common/ImageUploader";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import DatePicker from "@/components/form/DatePicker";
import FieldLabel from "@/components/form/FieldLabel";
import Spinner from "@/components/ui/spinner/Spinner";

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

interface PopupFormProps {
  viewOnly?: boolean;
}

export default function PopupForm({ viewOnly = false }: PopupFormProps) {
  const navigate = useNavigate();
  const toast = useToast();
  const { id: editingId } = useParams<{ id: string }>();
  const isEditing = Boolean(editingId);
  const pageTitle = viewOnly ? "Xem popup" : isEditing ? "Sửa popup" : "Thêm popup";
  useBreadcrumb([{ label: "Popup marketing", href: "/popups" }, { label: pageTitle }]);

  const [imagePublicId, setImagePublicId] = useState<string | null>(null);
  const { data: popup, isLoading: isLoadingPopup } = usePopupDetail(editingId);
  const createMutation = useCreatePopup();
  const updateMutation = useUpdatePopup();

  const {
    register,
    control,
    handleSubmit,
    reset,
    trigger,
    formState: { errors, isValid, isSubmitting, dirtyFields, isSubmitted },
  } = useForm<PopupFormValues>({
    resolver: yupResolver(popupSchema),
    defaultValues: EMPTY_VALUES,
    // "onChange" — xem lý do ở BannerForm.tsx.
    mode: "onChange",
  });

  // minDate cho lịch chọn ngày kết thúc bám theo ngày bắt đầu đang chọn.
  const startDateValue = useWatch({ control, name: "startDate" });

  useEffect(() => {
    if (!isEditing) void trigger();
  }, [isEditing, trigger]);

  useEffect(() => {
    if (!popup) return;
    reset({
      eyebrow: popup.eyebrow ?? "",
      title: popup.title,
      description: popup.description ?? "",
      discountCode: popup.discountCode ?? "",
      image: popup.imageUrl ? [popup.imageUrl] : [],
      ctaLabel: popup.ctaLabel ?? "",
      ctaLinkUrl: popup.ctaLinkUrl ?? "",
      startDate: toDateOnly(popup.startDate),
      endDate: toDateOnly(popup.endDate),
    });
    setImagePublicId(popup.imagePublicId);
    void trigger();
  }, [popup, reset, trigger]);

  async function onValid(values: PopupFormValues) {
    const imageChanged = values.image[0] !== popup?.imageUrl;

    try {
      if (isEditing && popup) {
        await updateMutation.mutateAsync({
          id: popup.id,
          payload: {
            eyebrow: values.eyebrow || undefined,
            title: values.title,
            // Chỉ gửi kèm cặp imageUrl/imagePublicId khi ảnh thực sự đổi — giống
            // BannerForm.tsx.
            ...(imageChanged
              ? {
                  imageUrl: values.image[0],
                  imagePublicId: imagePublicId ?? undefined,
                }
              : {}),
            description: values.description || undefined,
            discountCode: values.discountCode || undefined,
            ctaLabel: values.ctaLabel || undefined,
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
          ctaLabel: values.ctaLabel || undefined,
          ctaLinkUrl: values.ctaLinkUrl,
          startDate: values.startDate,
          endDate: values.endDate,
        });
        toast.success("Đã tạo popup.");
      }
      navigate("/popups");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  if (isEditing && isLoadingPopup) {
    return <Spinner className="text-brand-500" />;
  }

  return (
    <form onSubmit={handleSubmit(onValid)}>
      <fieldset disabled={viewOnly} className="m-0 min-w-0 space-y-6 border-0 p-0">
        <ComponentCard title="Thông tin popup">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="min-w-0 space-y-4">
              <Input
                label="Tiêu đề phụ"
                placeholder="Ví dụ: ƯU ĐÃI THÁNG 8"
                {...register("eyebrow")}
                error={!!visibleFieldError(errors.eyebrow?.message, dirtyFields.eyebrow, isSubmitted)}
                hint={visibleFieldError(errors.eyebrow?.message, dirtyFields.eyebrow, isSubmitted)}
              />

              <Input
                label="Tiêu đề chính"
                required
                placeholder="Ví dụ: Giảm 15% đơn từ 800.000đ"
                {...register("title")}
                error={!!visibleFieldError(errors.title?.message, dirtyFields.title, isSubmitted)}
                hint={visibleFieldError(errors.title?.message, dirtyFields.title, isSubmitted)}
              />

              <Input
                label="Mô tả"
                placeholder="Ví dụ: Nhập mã THU26 ở bước thanh toán"
                {...register("description")}
                error={!!visibleFieldError(
                  errors.description?.message,
                  dirtyFields.description,
                  isSubmitted,
                )}
                hint={visibleFieldError(
                  errors.description?.message,
                  dirtyFields.description,
                  isSubmitted,
                )}
              />

              <Input
                label="Mã giảm giá"
                placeholder="Ví dụ: THU26"
                {...register("discountCode")}
                error={!!visibleFieldError(
                  errors.discountCode?.message,
                  dirtyFields.discountCode,
                  isSubmitted,
                )}
                hint={visibleFieldError(
                  errors.discountCode?.message,
                  dirtyFields.discountCode,
                  isSubmitted,
                )}
              />

              <Input
                label="Link đích CTA"
                required
                placeholder="/san-pham"
                {...register("ctaLinkUrl")}
                error={!!visibleFieldError(
                  errors.ctaLinkUrl?.message,
                  dirtyFields.ctaLinkUrl,
                  isSubmitted,
                )}
                hint={visibleFieldError(errors.ctaLinkUrl?.message, dirtyFields.ctaLinkUrl, isSubmitted)}
              />
            </div>

            <div className="min-w-0 space-y-4">
              {/* Tạm ẩn: popup giờ điều hướng bằng click ảnh thay vì nút CTA riêng, xem
                  PromoPopup.tsx (frontend-website). Không xoá field — giữ lại phòng khi cần
                  dùng lại nút CTA riêng. */}
              <div className="hidden">
                <Input
                  label="Nhãn nút CTA"
                  placeholder="Ví dụ: Mua sắm ngay"
                  {...register("ctaLabel")}
                  error={!!errors.ctaLabel}
                  hint={errors.ctaLabel?.message}
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
                      minDate={!isEditing && !viewOnly ? "today" : undefined}
                      disabled={viewOnly}
                      onChange={(_dates, dateStr) => field.onChange(dateStr)}
                      error={!!visibleFieldError(
                        errors.startDate?.message,
                        dirtyFields.startDate,
                        isSubmitted,
                      )}
                      hint={visibleFieldError(
                        errors.startDate?.message,
                        dirtyFields.startDate,
                        isSubmitted,
                      )}
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
                      error={!!visibleFieldError(
                        errors.endDate?.message,
                        dirtyFields.endDate,
                        isSubmitted,
                      )}
                      hint={visibleFieldError(errors.endDate?.message, dirtyFields.endDate, isSubmitted)}
                    />
                  )}
                />
              </div>

              <div>
                <FieldLabel label="Ảnh popup" required />
                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                  Khuyến nghị ảnh có kích thức 400x180
                </p>
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
                {errors.image && (
                  <p className="text-theme-xs mt-1.5 text-error-500">{errors.image.message}</p>
                )}
              </div>
            </div>
          </div>
        </ComponentCard>
      </fieldset>

      <div className="mt-6 flex justify-end gap-3">
        {viewOnly ? (
          <Button type="button" variant="outline" onClick={() => navigate("/popups")}>
            Quay lại
          </Button>
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/popups")}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!isValid || isSubmitting}
              startIcon={isSubmitting ? <Spinner size="sm" /> : undefined}
            >
              Lưu
            </Button>
          </>
        )}
      </div>
    </form>
  );
}
