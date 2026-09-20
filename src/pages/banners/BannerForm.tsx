import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useWatch, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  useBannerDetail,
  useCreateBanner,
  useUpdateBanner,
} from "@/hooks/useBanners";
import { getErrorMessage } from "@/lib/error";
import { visibleFieldError } from "@/lib/form";
import { useToast } from "@/hooks/useToast";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import { bannerSchema, type BannerFormValues } from "@/schemas/banner.schema";
import ComponentCard from "@/components/common/ComponentCard";
import { ImageUploader } from "@/components/common/ImageUploader";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import DatePicker from "@/components/form/DatePicker";
import FieldLabel from "@/components/form/FieldLabel";
import Spinner from "@/components/ui/spinner/Spinner";

const EMPTY_VALUES: BannerFormValues = {
  eyebrow: "",
  title: "",
  description: "",
  image: [],
  linkUrl: "",
  ctaLabel: "",
  ctaLinkUrl: "",
  startDate: "",
  endDate: "",
};

// Banner.startDate/endDate về từ API là ISO datetime — cắt về "Y-m-d" để khớp định dạng
// flatpickr đang dùng (giống VoucherForm.tsx/CollectionFormModal.tsx).
function toDateOnly(iso: string): string {
  return iso.slice(0, 10);
}

interface BannerFormProps {
  viewOnly?: boolean;
}

export default function BannerForm({ viewOnly = false }: BannerFormProps) {
  const navigate = useNavigate();
  const toast = useToast();
  const { id: editingId } = useParams<{ id: string }>();
  const isEditing = Boolean(editingId);
  const pageTitle = viewOnly
    ? "Xem banner"
    : isEditing
      ? "Sửa banner"
      : "Thêm banner";
  useBreadcrumb([
    { label: "Banner trang chủ", href: "/banners" },
    { label: pageTitle },
  ]);

  const [imagePublicId, setImagePublicId] = useState<string | null>(null);
  const { data: banner, isLoading: isLoadingBanner } =
    useBannerDetail(editingId);
  const createMutation = useCreateBanner();
  const updateMutation = useUpdateBanner();

  const {
    register,
    control,
    handleSubmit,
    reset,
    trigger,
    formState: { errors, isValid, isSubmitting, dirtyFields, isSubmitted },
  } = useForm<BannerFormValues>({
    resolver: yupResolver(bannerSchema),
    defaultValues: EMPTY_VALUES,
    // "onChange" — isValid phải cập nhật ngay khi gõ/chọn, không đợi tới lần submit đầu
    // tiên, để nút "Lưu" disable đúng lúc còn thiếu trường bắt buộc thay vì chỉ báo lỗi
    // sau khi bấm (giống VoucherForm.tsx).
    mode: "onChange",
  });

  // minDate cho lịch chọn ngày kết thúc bám theo ngày bắt đầu đang chọn.
  const startDateValue = useWatch({ control, name: "startDate" });

  // formState.isValid (dùng với resolver) không tự tính đúng ngay khi mount nếu chưa có
  // tương tác nào — phải tự trigger() 1 lần để nút "Lưu" disable đúng ngay từ đầu ở màn
  // thêm mới (còn trống các trường bắt buộc), giống VoucherForm.tsx.
  useEffect(() => {
    if (!isEditing) void trigger();
  }, [isEditing, trigger]);

  useEffect(() => {
    if (!banner) return;
    reset({
      eyebrow: banner.eyebrow ?? "",
      title: banner.title,
      description: banner.description ?? "",
      image: banner.imageUrl ? [banner.imageUrl] : [],
      linkUrl: banner.linkUrl ?? "",
      ctaLabel: banner.ctaLabel ?? "",
      ctaLinkUrl: banner.ctaLinkUrl ?? "",
      startDate: toDateOnly(banner.startDate),
      endDate: toDateOnly(banner.endDate),
    });
    setImagePublicId(banner.imagePublicId);
    void trigger();
  }, [banner, reset, trigger]);

  async function onValid(values: BannerFormValues) {
    const imageChanged = values.image[0] !== banner?.imageUrl;

    try {
      if (isEditing && banner) {
        await updateMutation.mutateAsync({
          id: banner.id,
          payload: {
            eyebrow: values.eyebrow || undefined,
            title: values.title,
            // Chỉ gửi kèm cặp imageUrl/imagePublicId khi ảnh thực sự đổi — imagePublicId
            // không nullable ở BE nên không có khái niệm "xóa ảnh" ở đây (khác banner
            // của Collection), chỉ có "giữ nguyên" hoặc "thay ảnh mới".
            ...(imageChanged
              ? {
                  imageUrl: values.image[0],
                  imagePublicId: imagePublicId ?? undefined,
                }
              : {}),
            description: values.description || undefined,
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
          eyebrow: values.eyebrow || undefined,
          title: values.title,
          description: values.description || undefined,
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
      navigate("/banners");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  if (isEditing && isLoadingBanner) {
    return <Spinner className="text-brand-500" />;
  }

  return (
    <form onSubmit={handleSubmit(onValid)}>
      {/* fieldset disabled tự vô hiệu hoá mọi input/select/button form-native bên trong ở
          màn xem — không cần tự truyền disabled/readOnly cho từng field riêng lẻ, giống
          VoucherForm.tsx. ImageUploader vẫn cần readOnly riêng để ẩn hẳn nút thêm/xóa ảnh
          thay vì chỉ vô hiệu hoá, DatePicker vẫn cần disabled riêng vì flatpickr tự mở
          lịch bằng JS, không dựa theo input[disabled] của trình duyệt. */}
      <fieldset
        disabled={viewOnly}
        className="m-0 min-w-0 space-y-6 border-0 p-0"
      >
        <ComponentCard title="Thông tin banner">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <Input
                label="Tiêu đề phụ"
                placeholder="Ví dụ: BỘ SƯU TẬP THU 2026"
                {...register("eyebrow")}
                error={
                  !!visibleFieldError(
                    errors.eyebrow?.message,
                    dirtyFields.eyebrow,
                    isSubmitted,
                  )
                }
                hint={visibleFieldError(
                  errors.eyebrow?.message,
                  dirtyFields.eyebrow,
                  isSubmitted,
                )}
              />

              <Input
                label="Tiêu đề chính"
                required
                placeholder="Ví dụ: Sale mùa hè 2026"
                {...register("title")}
                error={
                  !!visibleFieldError(
                    errors.title?.message,
                    dirtyFields.title,
                    isSubmitted,
                  )
                }
                hint={visibleFieldError(
                  errors.title?.message,
                  dirtyFields.title,
                  isSubmitted,
                )}
              />

              <Input
                label="Mô tả"
                placeholder="Ví dụ: Ưu đãi tới 50% cho bộ sưu tập mới"
                {...register("description")}
                error={
                  !!visibleFieldError(
                    errors.description?.message,
                    dirtyFields.description,
                    isSubmitted,
                  )
                }
                hint={visibleFieldError(
                  errors.description?.message,
                  dirtyFields.description,
                  isSubmitted,
                )}
              />

              <Input
                label="Link đích (CTA chính)"
                placeholder="https://..."
                {...register("linkUrl")}
                error={
                  !!visibleFieldError(
                    errors.linkUrl?.message,
                    dirtyFields.linkUrl,
                    isSubmitted,
                  )
                }
                hint={visibleFieldError(
                  errors.linkUrl?.message,
                  dirtyFields.linkUrl,
                  isSubmitted,
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Nhãn CTA phụ"
                  placeholder="Ví dụ: Xem thêm"
                  {...register("ctaLabel")}
                  error={
                    !!visibleFieldError(
                      errors.ctaLabel?.message,
                      dirtyFields.ctaLabel,
                      isSubmitted,
                    )
                  }
                  hint={visibleFieldError(
                    errors.ctaLabel?.message,
                    dirtyFields.ctaLabel,
                    isSubmitted,
                  )}
                />
                <Input
                  label="Link đích CTA phụ"
                  placeholder="https://..."
                  {...register("ctaLinkUrl")}
                  error={
                    !!visibleFieldError(
                      errors.ctaLinkUrl?.message,
                      dirtyFields.ctaLinkUrl,
                      isSubmitted,
                    )
                  }
                  hint={visibleFieldError(
                    errors.ctaLinkUrl?.message,
                    dirtyFields.ctaLinkUrl,
                    isSubmitted,
                  )}
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
                      // Chỉ chặn quá khứ khi TẠO MỚI — banner đang sửa có thể đã
                      // RUNNING/ENDED, startDate lúc đó vốn dĩ đã ở quá khứ; đặt
                      // minDate="today" trong trường hợp đó khiến flatpickr âm thầm bỏ
                      // qua defaultDate nằm trước minDate.
                      minDate={!isEditing && !viewOnly ? "today" : undefined}
                      disabled={viewOnly}
                      onChange={(_dates, dateStr) => field.onChange(dateStr)}
                      error={
                        !!visibleFieldError(
                          errors.startDate?.message,
                          dirtyFields.startDate,
                          isSubmitted,
                        )
                      }
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
                      id="banner-end-date"
                      label="Ngày kết thúc"
                      required
                      placeholder="Chọn ngày kết thúc"
                      defaultDate={field.value || undefined}
                      minDate={startDateValue || "today"}
                      disabled={viewOnly}
                      onChange={(_dates, dateStr) => field.onChange(dateStr)}
                      error={
                        !!visibleFieldError(
                          errors.endDate?.message,
                          dirtyFields.endDate,
                          isSubmitted,
                        )
                      }
                      hint={visibleFieldError(
                        errors.endDate?.message,
                        dirtyFields.endDate,
                        isSubmitted,
                      )}
                    />
                  )}
                />
              </div>
            </div>

            <div>
              <FieldLabel label="Ảnh banner" required />
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                Khuyến nghị ảnh có kích thức 1200x600
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
                    onPublicIdChange={(_url, publicId) =>
                      setImagePublicId(publicId)
                    }
                  />
                )}
              />
              {errors.image && (
                <p className="text-theme-xs mt-1.5 text-error-500">
                  {errors.image.message}
                </p>
              )}
            </div>
          </div>
        </ComponentCard>
      </fieldset>

      <div className="mt-6 flex justify-end gap-3">
        {viewOnly ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/banners")}
          >
            Quay lại
          </Button>
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/banners")}
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
