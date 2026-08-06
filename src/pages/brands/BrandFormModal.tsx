import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import type { Brand } from "@/lib/shared-types";
import { ImageUploader } from "@/components/ImageUploader";
import { useCreateBrand, useUpdateBrand } from "@/hooks/useBrands";
import { getErrorMessage } from "@/lib/error";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Spinner from "@/components/ui/spinner/Spinner";
import { useToast } from "@/hooks/useToast";
import { brandSchema, type BrandFormValues } from "@/schemas/brand.schema";

interface BrandFormModalProps {
  open: boolean;
  onClose: () => void;
  editing: Brand | null;
}

const EMPTY_VALUES: BrandFormValues = { name: "", description: "", origin: "", logo: [] };

export default function BrandFormModal({ open, onClose, editing }: BrandFormModalProps) {
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
          {editing ? "Sửa thương hiệu" : "Thêm thương hiệu"}
        </h3>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="brand-name"
              className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
            >
              Tên thương hiệu <span className="text-error-500">*</span>
            </label>
            <Input
              id="brand-name"
              placeholder="Ví dụ: Uniqlo"
              {...register("name")}
              error={!!errors.name}
              hint={errors.name?.message}
            />
          </div>

          <div>
            <label
              htmlFor="brand-origin"
              className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
            >
              Xuất xứ
            </label>
            <Input id="brand-origin" placeholder="Ví dụ: Nhật Bản" {...register("origin")} />
          </div>

          <div>
            <label
              htmlFor="brand-description"
              className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
            >
              Mô tả
            </label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextArea
                  id="brand-description"
                  placeholder="Giới thiệu ngắn về thương hiệu"
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Logo
            </label>
            <Controller
              name="logo"
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
