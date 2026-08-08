import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import type { Collection } from "@/lib/shared-types";
import { ImageUploader } from "@/components/ImageUploader";
import { useCreateCollection, useUpdateCollection } from "@/hooks/useCollections";
import { getErrorMessage } from "@/lib/error";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import DatePicker from "@/components/form/date-picker";
import Spinner from "@/components/ui/spinner/Spinner";
import { useToast } from "@/hooks/useToast";
import { collectionSchema, type CollectionFormValues } from "@/schemas/collection.schema";

interface CollectionFormModalProps {
  open: boolean;
  onClose: () => void;
  editing: Collection | null;
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

export default function CollectionFormModal({ open, onClose, editing }: CollectionFormModalProps) {
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
          {editing ? "Sửa bộ sưu tập" : "Thêm bộ sưu tập"}
        </h3>

        <div className="space-y-4">
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
