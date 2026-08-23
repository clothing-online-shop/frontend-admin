import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useWatch, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { DiscountType } from "@/types/shared-types";
import { useCreateVoucher, useUpdateVoucher, useVoucherDetail } from "@/hooks/useVouchers";
import { getErrorMessage } from "@/lib/error";
import { useToast } from "@/hooks/useToast";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import { DISCOUNT_TYPE_OPTIONS } from "@/lib/voucherDiscountType";
import { voucherSchema, type VoucherFormValues } from "@/schemas/voucher.schema";
import ComponentCard from "@/components/common/ComponentCard";
import { ImageUploader } from "@/components/common/ImageUploader";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import DatePicker from "@/components/form/DatePicker";
import Switch from "@/components/form/switch/Switch";
import FieldLabel from "@/components/form/FieldLabel";
import Spinner from "@/components/ui/spinner/Spinner";

const EMPTY_VALUES: VoucherFormValues = {
  code: "",
  image: [],
  discountType: DiscountType.PERCENTAGE,
  discountValue: undefined as unknown as number,
  maxDiscountAmount: undefined,
  minOrderValue: 0,
  startsAt: "",
  expiresAt: "",
  usageLimit: undefined,
  perCustomerLimit: undefined,
  isActive: true,
};

// Voucher.startsAt/expiresAt về từ API là ISO datetime hoặc null — cắt về "Y-m-d" để khớp
// định dạng flatpickr đang dùng (giống BannerFormModal.tsx).
function toDateOnly(iso: string | null): string {
  return iso ? iso.slice(0, 10) : "";
}

interface VoucherFormProps {
  viewOnly?: boolean;
}

export default function VoucherForm({ viewOnly = false }: VoucherFormProps) {
  const navigate = useNavigate();
  const toast = useToast();
  const { id: editingId } = useParams<{ id: string }>();
  const isEditing = Boolean(editingId);
  const pageTitle = viewOnly ? "Xem voucher" : isEditing ? "Sửa voucher" : "Thêm voucher";
  useBreadcrumb([{ label: "Voucher", href: "/vouchers" }, { label: pageTitle }]);

  const [imagePublicId, setImagePublicId] = useState<string | null>(null);
  const { data: voucher, isLoading: isLoadingVoucher } = useVoucherDetail(editingId);
  const createMutation = useCreateVoucher();
  const updateMutation = useUpdateVoucher();

  const {
    register,
    control,
    handleSubmit,
    reset,
    trigger,
    formState: { errors, isValid, isSubmitting },
  } = useForm<VoucherFormValues>({
    resolver: yupResolver(voucherSchema),
    defaultValues: EMPTY_VALUES,
    // "onChange" — isValid phải cập nhật ngay khi gõ/chọn, không đợi tới lần submit đầu
    // tiên, để nút "Lưu" disable đúng lúc còn thiếu trường bắt buộc thay vì chỉ báo lỗi
    // sau khi bấm (giống ProductForm.tsx).
    mode: "onChange",
  });

  const discountType = useWatch({ control, name: "discountType" });
  const startsAtValue = useWatch({ control, name: "startsAt" });

  // formState.isValid (dùng với resolver) không tự tính đúng ngay khi mount nếu chưa có
  // tương tác nào — phải tự trigger() 1 lần để nút "Lưu" disable đúng ngay từ đầu ở màn
  // thêm mới (còn trống các trường bắt buộc), không đợi user bấm/gõ vào field nào đó
  // trước (giống ProductForm.tsx phải tự trigger() sau khi đổi step/hydrate).
  useEffect(() => {
    if (!isEditing) void trigger();
  }, [isEditing, trigger]);

  useEffect(() => {
    if (!voucher) return;
    reset({
      code: voucher.code,
      image: voucher.imageUrl ? [voucher.imageUrl] : [],
      discountType: voucher.discountType,
      discountValue: voucher.discountValue,
      maxDiscountAmount: voucher.maxDiscountAmount ?? undefined,
      minOrderValue: voucher.minOrderValue,
      startsAt: toDateOnly(voucher.startsAt),
      expiresAt: toDateOnly(voucher.expiresAt),
      usageLimit: voucher.usageLimit ?? undefined,
      perCustomerLimit: voucher.perCustomerLimit ?? undefined,
      isActive: voucher.isActive,
    });
    setImagePublicId(voucher.imagePublicId);
    void trigger();
  }, [voucher, reset, trigger]);

  async function onValid(values: VoucherFormValues) {
    const imageChanged = values.image[0] !== (voucher?.imageUrl ?? undefined);
    const shared = {
      discountType: values.discountType,
      discountValue: values.discountValue,
      maxDiscountAmount:
        values.discountType === DiscountType.PERCENTAGE ? values.maxDiscountAmount : undefined,
      minOrderValue: values.minOrderValue,
      // Yup đã bắt buộc required — tới đây luôn là chuỗi khác rỗng.
      startsAt: values.startsAt,
      expiresAt: values.expiresAt || undefined,
      usageLimit: values.usageLimit,
      perCustomerLimit: values.perCustomerLimit,
      isActive: values.isActive,
    };

    try {
      if (isEditing && voucher) {
        await updateMutation.mutateAsync({
          id: voucher.id,
          payload: {
            ...shared,
            // Chỉ gửi kèm cặp imageUrl/imagePublicId khi ảnh thực sự đổi — gửi null nghĩa
            // là chủ động gỡ ảnh, khác "không đổi" (không gửi field này).
            ...(imageChanged
              ? {
                  imageUrl: values.image[0] ?? null,
                  imagePublicId: values.image[0] ? imagePublicId : null,
                }
              : {}),
          },
        });
        toast.success("Đã cập nhật voucher.");
      } else {
        await createMutation.mutateAsync({
          code: values.code,
          imageUrl: values.image[0],
          imagePublicId: values.image[0] ? (imagePublicId ?? undefined) : undefined,
          ...shared,
        });
        toast.success("Đã tạo voucher.");
      }
      navigate("/vouchers");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  if (isEditing && isLoadingVoucher) {
    return <Spinner className="text-brand-500" />;
  }

  return (
    <form onSubmit={handleSubmit(onValid)}>
      {/* fieldset disabled tự vô hiệu hoá mọi input/select/button form-native bên trong ở
          màn xem — không cần tự truyền disabled/readOnly cho từng field riêng lẻ, giống
          ProductForm.tsx. ImageUploader vẫn cần readOnly riêng để ẩn hẳn nút thêm/xóa ảnh
          thay vì chỉ vô hiệu hoá (xem comment trong ImageUploader.tsx). */}
      <fieldset disabled={viewOnly} className="m-0 min-w-0 space-y-6 border-0 p-0">
      <ComponentCard title="Thông tin cơ bản">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Input
              label="Mã voucher"
              required
              disabled={isEditing}
              placeholder="Ví dụ: SUMMER2026"
              {...register("code")}
              error={!!errors.code}
              hint={
                errors.code?.message ?? (isEditing ? "Không thể sửa mã sau khi tạo." : undefined)
              }
            />

            <Controller
              name="discountType"
              control={control}
              render={({ field }) => (
                <Select
                  label="Loại giảm giá"
                  required
                  disabled={viewOnly}
                  options={DISCOUNT_TYPE_OPTIONS}
                  value={field.value}
                  onChange={(value) => field.onChange(value ?? DiscountType.PERCENTAGE)}
                />
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                label={
                  discountType === DiscountType.PERCENTAGE ? "Giá trị giảm (%)" : "Số tiền giảm"
                }
                required
                disabled={viewOnly}
                placeholder={discountType === DiscountType.PERCENTAGE ? "10" : "50000"}
                {...register("discountValue")}
                error={!!errors.discountValue}
                hint={errors.discountValue?.message}
              />
              {discountType === DiscountType.PERCENTAGE && (
                <Input
                  type="number"
                  label="Trần giảm tối đa"
                  disabled={viewOnly}
                  placeholder="Bỏ trống = không giới hạn"
                  {...register("maxDiscountAmount")}
                  error={!!errors.maxDiscountAmount}
                  hint={errors.maxDiscountAmount?.message}
                />
              )}
            </div>
          </div>

          <div>
            <FieldLabel label="Ảnh voucher" />
            <Controller
              name="image"
              control={control}
              render={({ field }) => (
                <ImageUploader
                  value={field.value ?? []}
                  onChange={field.onChange}
                  max={1}
                  readOnly={viewOnly}
                  onPublicIdChange={(_url, publicId) => setImagePublicId(publicId)}
                />
              )}
            />
          </div>
        </div>
      </ComponentCard>

      <ComponentCard title="Điều kiện áp dụng" desc="">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input
            type="number"
            label="Giá trị đơn tối thiểu"
            disabled={viewOnly}
            placeholder="Bỏ trống = không yêu cầu"
            {...register("minOrderValue")}
            error={!!errors.minOrderValue}
            hint={errors.minOrderValue?.message}
          />
          <Controller
            name="startsAt"
            control={control}
            render={({ field }) => (
              <DatePicker
                id="voucher-starts-at"
                label="Ngày bắt đầu"
                placeholder="Chọn ngày bắt đầu"
                defaultDate={field.value || undefined}
                disabled={viewOnly}
                error={!!errors.startsAt}
                hint={errors.startsAt?.message}
                onChange={(_dates, dateStr) => field.onChange(dateStr)}
                required={true}
              />
            )}
          />
          <Controller
            name="expiresAt"
            control={control}
            render={({ field }) => (
              <DatePicker
                id="voucher-expires-at"
                label="Ngày hết hạn"
                placeholder="Nhập ngày hết hạn"
                defaultDate={field.value || undefined}
                minDate={startsAtValue || undefined}
                disabled={viewOnly}
                error={!!errors.expiresAt}
                hint={errors.expiresAt?.message}
                onChange={(_dates, dateStr) => field.onChange(dateStr)}
              />
            )}
          />
        </div>
      </ComponentCard>

      <ComponentCard title="Giới hạn sử dụng">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            type="number"
            label="Tổng số lượt dùng"
            disabled={viewOnly}
            placeholder="Bỏ trống = không giới hạn"
            {...register("usageLimit")}
            error={!!errors.usageLimit}
            hint={errors.usageLimit?.message}
          />
          <Input
            type="number"
            label="Số lượt dùng/khách"
            disabled={viewOnly}
            placeholder="Bỏ trống = không giới hạn"
            {...register("perCustomerLimit")}
            error={!!errors.perCustomerLimit}
            hint={errors.perCustomerLimit?.message}
          />
        </div>
        <div className="mt-4">
          <Controller
            name="isActive"
            control={control}
            render={({ field }) => (
              <Switch
                label="Đang hoạt động"
                checked={field.value}
                onChange={field.onChange}
                disabled={viewOnly}
              />
            )}
          />
        </div>
      </ComponentCard>
      </fieldset>

      <div className="mt-6 flex justify-end gap-3">
        {viewOnly ? (
          <Button type="button" variant="outline" onClick={() => navigate("/vouchers")}>
            Quay lại
          </Button>
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/vouchers")}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              // isSubmitting chặn spam-click (true suốt thời gian onValid đang chạy, kể cả
              // trước khi request mạng xong) — !isValid disable sẵn khi còn thiếu trường bắt
              // buộc, không cần đợi bấm "Lưu" mới báo lỗi.
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
