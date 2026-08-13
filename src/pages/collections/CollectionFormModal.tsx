import { useEffect } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { CollectionStatus, type Collection } from "@/types/shared-types";
import { ImageUploader } from "@/components/common/ImageUploader";
import { useCreateCollection, useUpdateCollection } from "@/hooks/useCollections";
import { getErrorMessage } from "@/lib/error";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import DatePicker from "@/components/form/DatePicker";
import Spinner from "@/components/ui/spinner/Spinner";
import Badge from "@/components/ui/badge/Badge";
import { useToast } from "@/hooks/useToast";
import { collectionSchema, type CollectionFormValues } from "@/schemas/collection.schema";

interface CollectionFormModalProps {
  open: boolean;
  onClose: () => void;
  editing: Collection | null;
  viewOnly?: boolean;
}

const EMPTY_VALUES: CollectionFormValues = {
  name: "",
  description: "",
  banner: [],
  startDate: "",
  endDate: "",
};

// Collection.startDate/endDate về từ API là ISO datetime (vd "2026-09-01T00:00:00.000Z") —
// cắt về "Y-m-d" để khớp định dạng flatpickr đang dùng (dateFormat: "Y-m-d" ở date-picker.tsx).
function toDateOnly(iso: string): string {
  return iso.slice(0, 10);
}

export default function CollectionFormModal({
  open,
  onClose,
  editing,
  viewOnly = false,
}: CollectionFormModalProps) {
  const toast = useToast();
  const createMutation = useCreateCollection();
  const updateMutation = useUpdateCollection();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CollectionFormValues>({
    resolver: yupResolver(collectionSchema),
    defaultValues: EMPTY_VALUES,
  });

  // minDate cho lịch chọn ngày kết thúc bám theo ngày bắt đầu đang chọn — không cho chọn
  // kết thúc trước bắt đầu ngay ở UI (bổ sung cho rule "after-start" đã có ở Yup), luôn
  // dùng "today" khi chưa chọn ngày bắt đầu.
  const startDateValue = useWatch({ control, name: "startDate" });

  // Bộ sưu tập đang RUNNING: đổi tên kéo theo đổi slug (URL đang chia sẻ/index thật trên
  // web bị gãy), đổi ngày bắt đầu thì vô nghĩa vì đã diễn ra rồi — chỉ còn banner/mô tả/
  // ngày kết thúc là hợp lý để sửa giữa chừng (kéo dài/rút ngắn chiến dịch). BE
  // (collections.service.ts update()) chặn y hệt 2 field này, đây chỉ là khoá UI tương ứng.
  const isRunning = editing?.status === CollectionStatus.RUNNING;

  useEffect(() => {
    if (open) {
      reset({
        name: editing?.name ?? "",
        description: editing?.description ?? "",
        banner: editing?.banner ? [editing.banner] : [],
        startDate: editing?.startDate ? toDateOnly(editing.startDate) : "",
        endDate: editing?.endDate ? toDateOnly(editing.endDate) : "",
      });
    }
  }, [open, editing, reset]);

  async function onValid(values: CollectionFormValues) {
    const payload = {
      name: values.name,
      description: values.description || undefined,
      banner: values.banner[0],
      startDate: values.startDate,
      endDate: values.endDate,
    };

    try {
      if (editing) {
        // Bỏ trống banner/mô tả ở form nghĩa là user chủ động xoá — phải gửi
        // null (không phải bỏ field) để backend phân biệt với "không đổi".
        await updateMutation.mutateAsync({
          id: editing.id,
          payload: {
            ...payload,
            banner: values.banner[0] ?? null,
            description: values.description || null,
          },
        });
        toast.success("Đã cập nhật bộ sưu tập");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Đã tạo bộ sưu tập");
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
          {viewOnly ? "Xem bộ sưu tập" : editing ? "Sửa bộ sưu tập" : "Thêm bộ sưu tập"}
        </h3>

        {!viewOnly && isRunning && (
          <p className="mb-4 rounded-lg bg-blue-light-50 px-3 py-2 text-xs text-blue-light-500 dark:bg-blue-light-500/15">
            Bộ sưu tập đang diễn ra — chỉ có thể sửa banner, mô tả và ngày kết thúc.
          </p>
        )}

        {/* fieldset disabled tự vô hiệu hoá Input/TextArea/nút bấm trong ImageUploader (đều
            là form control gốc) khi xem — riêng DatePicker vẫn truyền disabled riêng vì
            flatpickr tự mở lịch bằng JS, không dựa theo input[disabled] của trình duyệt. */}
        <fieldset disabled={viewOnly} className="m-0 min-w-0 space-y-4 border-0 p-0">
          <div>
            <label
              htmlFor="collection-name"
              className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
            >
              Tên bộ sưu tập <span className="text-error-500">*</span>
            </label>
            <Input
              id="collection-name"
              placeholder="Ví dụ: Bộ sưu tập Thu Đông 2026"
              disabled={viewOnly || isRunning}
              {...register("name")}
              error={!!errors.name}
              hint={errors.name?.message}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Controller
              name="startDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  id="collection-start-date"
                  label="Ngày bắt đầu"
                  placeholder="Chọn ngày bắt đầu"
                  defaultDate={field.value || undefined}
                  // Không cho chọn ngày bắt đầu trong quá khứ — nhưng chỉ áp khi field còn
                  // sửa được. Field disabled (xem/RUNNING) mà vẫn set minDate="today" thì
                  // flatpickr âm thầm bỏ qua defaultDate nằm trước minDate, khiến ngày bắt đầu
                  // thật (đã ở quá khứ) không hiển thị dù data vẫn đúng trong form.
                  minDate={viewOnly || isRunning ? undefined : "today"}
                  disabled={viewOnly || isRunning}
                  onChange={(_dates, dateStr) => field.onChange(dateStr)}
                />
              )}
            />
            <Controller
              name="endDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  id="collection-end-date"
                  label="Ngày kết thúc"
                  placeholder="Chọn ngày kết thúc"
                  defaultDate={field.value || undefined}
                  minDate={startDateValue || "today"}
                  disabled={viewOnly}
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
            <label
              htmlFor="collection-description"
              className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
            >
              Mô tả
            </label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextArea
                  id="collection-description"
                  placeholder="Giới thiệu ngắn về bộ sưu tập"
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Banner
            </label>
            <Controller
              name="banner"
              control={control}
              render={({ field }) => (
                <ImageUploader value={field.value} onChange={field.onChange} max={1} />
              )}
            />
          </div>
        </fieldset>

        {/* Chỉ hiện khi xem — thêm/sửa bộ sưu tập không quản lý sản phẩm ở đây, đi qua
            AssignProductsModal riêng (nút "Gán sản phẩm" ở CollectionList.tsx). */}
        {viewOnly && (
          <div className="mt-4">
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Sản phẩm thuộc bộ sưu tập
            </label>
            {editing && editing.products.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {editing.products.map((product) => (
                  <Badge key={product.id} color="light">
                    {product.name}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Chưa có sản phẩm nào.
              </p>
            )}
          </div>
        )}

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
