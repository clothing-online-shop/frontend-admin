import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import type { Brand } from "@/types/shared-types";
import { ImageUploader } from "@/components/common/ImageUploader";
import { useCreateBrand, useUpdateBrand } from "@/hooks/useBrands";
import { getErrorMessage } from "@/lib/error";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import FieldLabel from "@/components/form/FieldLabel";
import Spinner from "@/components/ui/spinner/Spinner";
import { useToast } from "@/hooks/useToast";
import { brandSchema, type BrandFormValues } from "@/schemas/brand.schema";

interface BrandFormModalProps {
  open: boolean;
  onClose: () => void;
  editing: Brand | null;
  viewOnly?: boolean;
}

const EMPTY_VALUES: BrandFormValues = { name: "", description: "", origin: "", logo: [] };

export default function BrandFormModal({
  open,
  onClose,
  editing,
  viewOnly = false,
}: BrandFormModalProps) {
  const toast = useToast();
  const createMutation = useCreateBrand();
  const updateMutation = useUpdateBrand();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BrandFormValues>({
    resolver: yupResolver(brandSchema),
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    if (open) {
      reset({
        name: editing?.name ?? "",
        description: editing?.description ?? "",
        origin: editing?.origin ?? "",
        logo: editing?.logo ? [editing.logo] : [],
      });
    }
  }, [open, editing, reset]);

  async function onValid(values: BrandFormValues) {
    const payload = {
      name: values.name,
      description: values.description || undefined,
      origin: values.origin || undefined,
      logo: values.logo[0],
    };

    try {
      if (editing) {
        // Bỏ trống logo/mô tả/xuất xứ ở form nghĩa là user chủ động xoá — phải gửi
        // null (không phải bỏ field) để backend phân biệt với "không đổi".
        await updateMutation.mutateAsync({
          id: editing.id,
          payload: {
            ...payload,
            logo: values.logo[0] ?? null,
            description: values.description || null,
            origin: values.origin || null,
          },
        });
        toast.success("Đã cập nhật thương hiệu");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Đã tạo thương hiệu");
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
          {viewOnly ? "Xem thương hiệu" : editing ? "Sửa thương hiệu" : "Thêm thương hiệu"}
        </h3>

        {/* fieldset disabled tự vô hiệu hoá Input/TextArea/nút bấm trong ImageUploader khi
            xem, khớp cách CollectionFormModal.tsx đang làm. */}
        <fieldset disabled={viewOnly} className="m-0 min-w-0 space-y-4 border-0 p-0">
          <div>
            <Input
              id="brand-name"
              label="Tên thương hiệu"
              required
              disabled={viewOnly}
              placeholder="Ví dụ: Uniqlo"
              {...register("name")}
              error={!!errors.name}
              hint={errors.name?.message}
            />
          </div>

          <div>
            <Input
              id="brand-origin"
              label="Xuất xứ"
              disabled={viewOnly}
              placeholder="Ví dụ: Nhật Bản"
              {...register("origin")}
            />
          </div>

          <div>
            <FieldLabel label="Mô tả" htmlFor="brand-description" />
            <Controller
              name="description"
              control={control}
              render={({ field }) =>
                // Xem (viewOnly): không dùng line-clamp (cắt cụt, không có cách nào đọc hết
                // phần bị ẩn) — bọc khung border + nền xám giống field disabled khác, giới
                // hạn chiều cao + overflow-y-auto để cuộn đọc hết mô tả dài, không phải
                // <textarea> thật nên không dính bug tràn chữ của bản cũ.
                viewOnly ? (
                  <div className="max-h-52ban overflow-y-auto rounded-lg border border-gray-300 bg-gray-100 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-800">
                    <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                      {field.value || "—"}
                    </p>
                  </div>
                ) : (
                  <TextArea
                    id="brand-description"
                    placeholder="Giới thiệu ngắn về thương hiệu"
                    value={field.value}
                    onChange={field.onChange}
                    rows={8}
                  />
                )
              }
            />
          </div>

          <div>
            <FieldLabel label="Logo" />
            <Controller
              name="logo"
              control={control}
              render={({ field }) => (
                <ImageUploader value={field.value} onChange={field.onChange} max={1} readOnly={viewOnly} />
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
