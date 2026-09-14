import { useEffect } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import type { PromoBar } from "@/types/shared-types";
import { useCreatePromoBar, useUpdatePromoBar } from "@/hooks/usePromoBars";
import { getErrorMessage } from "@/lib/error";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import DatePicker from "@/components/form/DatePicker";
import Spinner from "@/components/ui/spinner/Spinner";
import { useToast } from "@/hooks/useToast";
import { promoBarSchema, type PromoBarFormValues } from "@/schemas/promoBar.schema";

interface PromoBarFormModalProps {
  open: boolean;
  onClose: () => void;
  editing: PromoBar | null;
  viewOnly?: boolean;
}

const EMPTY_VALUES: PromoBarFormValues = {
  label: "",
  highlight: "",
  linkUrl: "",
  startDate: "",
  endDate: "",
};

// PromoBar.startDate/endDate về từ API là ISO datetime — cắt về "Y-m-d" để khớp định dạng
// flatpickr đang dùng (giống BannerForm.tsx).
function toDateOnly(iso: string): string {
  return iso.slice(0, 10);
}

export default function PromoBarFormModal({
  open,
  onClose,
  editing,
  viewOnly = false,
}: PromoBarFormModalProps) {
  const toast = useToast();
  const createMutation = useCreatePromoBar();
  const updateMutation = useUpdatePromoBar();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PromoBarFormValues>({
    resolver: yupResolver(promoBarSchema),
    defaultValues: EMPTY_VALUES,
  });

  // minDate cho lịch chọn ngày kết thúc bám theo ngày bắt đầu đang chọn, giống
  // BannerForm.tsx.
  const startDateValue = useWatch({ control, name: "startDate" });

  useEffect(() => {
    if (open) {
      reset({
        label: editing?.label ?? "",
        highlight: editing?.highlight ?? "",
        linkUrl: editing?.linkUrl ?? "",
        startDate: editing?.startDate ? toDateOnly(editing.startDate) : "",
        endDate: editing?.endDate ? toDateOnly(editing.endDate) : "",
      });
    }
  }, [open, editing, reset]);

  async function onValid(values: PromoBarFormValues) {
    try {
      if (editing) {
        await updateMutation.mutateAsync({
          id: editing.id,
          payload: {
            label: values.label,
            highlight: values.highlight,
            linkUrl: values.linkUrl,
            startDate: values.startDate,
            endDate: values.endDate,
          },
        });
        toast.success("Đã cập nhật thanh khuyến mãi.");
      } else {
        await createMutation.mutateAsync({
          label: values.label,
          highlight: values.highlight,
          linkUrl: values.linkUrl,
          startDate: values.startDate,
          endDate: values.endDate,
        });
        toast.success("Đã tạo thanh khuyến mãi.");
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
          {viewOnly ? "Xem thanh khuyến mãi" : editing ? "Sửa thanh khuyến mãi" : "Thêm thanh khuyến mãi"}
        </h3>

        <fieldset disabled={viewOnly} className="m-0 min-w-0 space-y-4 border-0 p-0">
          <div>
            <Input
              label="Nhãn"
              required
              disabled={viewOnly}
              placeholder="Ví dụ: Thu 2026"
              {...register("label")}
              error={!!errors.label}
              hint={errors.label?.message}
            />
          </div>

          <div>
            <Input
              label="Dòng chữ giảm giá"
              required
              disabled={viewOnly}
              placeholder="Ví dụ: Giảm 30 – 50%"
              {...register("highlight")}
              error={!!errors.highlight}
              hint={errors.highlight?.message}
            />
          </div>

          <div>
            <Input
              label="Link đích (click cả thanh sẽ điều hướng tới đây)"
              required
              disabled={viewOnly}
              placeholder="/san-pham"
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
                  id="promo-bar-start-date"
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
                  id="promo-bar-end-date"
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
