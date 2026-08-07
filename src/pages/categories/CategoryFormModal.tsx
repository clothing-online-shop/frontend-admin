import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import type { CategoryNode } from "@/types/shared-types";
import { ImageUploader } from "@/components/common/ImageUploader";
import { useCreateCategory, useUpdateCategory } from "@/hooks/useCategories";
import { getErrorMessage } from "@/lib/error";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Switch from "@/components/form/switch/Switch";
import FieldLabel from "@/components/form/FieldLabel";
import Spinner from "@/components/ui/spinner/Spinner";
import { useToast } from "@/hooks/useToast";
import { categorySchema, type CategoryFormValues } from "@/schemas/category.schema";

export interface CategoryOption {
  id: string;
  name: string;
  depth: number;
}

interface CategoryFormModalProps {
  open: boolean;
  onClose: () => void;
  editing: CategoryNode | null;
  parentOptions: CategoryOption[];
}

const EMPTY_VALUES: CategoryFormValues = {
  name: "",
  slug: "",
  parentId: undefined,
  isActive: true,
  image: [],
};

export function CategoryFormModal({
  open,
  onClose,
  editing,
  parentOptions,
}: CategoryFormModalProps) {
  const toast = useToast();
  const [imagePublicId, setImagePublicId] = useState<string | null>(null);
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: yupResolver(categorySchema),
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    if (open) {
      reset({
        name: editing?.name ?? "",
        slug: editing?.slug ?? "",
        parentId: editing?.parentId ?? undefined,
        isActive: editing?.isActive ?? true,
        image: editing?.image ? [editing.image] : [],
      });
      setImagePublicId(editing?.imagePublicId ?? null);
    }
  }, [open, editing, reset]);

  async function onValid(values: CategoryFormValues) {
    const payload = {
      name: values.name,
      slug: values.slug || undefined,
      parentId: values.parentId ?? null,
      isActive: values.isActive,
      image: values.image[0],
      imagePublicId: values.image[0] ? imagePublicId : null,
    };

    try {
      if (editing) {
        // Bỏ trống ảnh ở form nghĩa là user chủ động xoá ảnh — phải gửi null
        // (không phải bỏ field) để backend phân biệt với "không đổi".
        await updateMutation.mutateAsync({
          id: editing.id,
          payload: { ...payload, image: values.image[0] ?? null },
        });
        toast.success("Đã cập nhật danh mục");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Đã tạo danh mục");
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
          {editing ? "Sửa danh mục" : "Thêm danh mục"}
        </h3>

        <div className="space-y-4">
          <div>
            <Input
              label="Tên danh mục"
              required
              placeholder="Ví dụ: Áo nam"
              {...register("name")}
              error={!!errors.name}
              hint={errors.name?.message}
            />
          </div>

          <div>
            <Input label="URL" placeholder="ao-nam" {...register("slug")} />
          </div>

          <div>
            <Controller
              name="parentId"
              control={control}
              render={({ field }) => (
                <Select
                  label="Danh mục cha"
                  allowClear
                  placeholder="Không có (danh mục gốc)"
                  value={field.value}
                  onChange={field.onChange}
                  options={parentOptions
                    .filter((option) => option.id !== editing?.id)
                    .map((option) => ({
                      value: option.id,
                      label: `${"— ".repeat(option.depth)}${option.name}`,
                    }))}
                />
              )}
            />
          </div>

          <Controller
            name="isActive"
            control={control}
            render={({ field }) => (
              <Switch label="Hiển thị" checked={field.value} onChange={field.onChange} />
            )}
          />

          <div>
            <FieldLabel label="Ảnh danh mục" />
            <Controller
              name="image"
              control={control}
              render={({ field }) => (
                <ImageUploader
                  value={field.value}
                  onChange={field.onChange}
                  max={1}
                  onPublicIdChange={(_url, publicId) => setImagePublicId(publicId)}
                />
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
