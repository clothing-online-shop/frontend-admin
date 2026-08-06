import { useEffect, useState } from "react";
import type { CategoryNode } from "@/lib/shared-types";
import { ImageUploader } from "@/components/ImageUploader";
import { useCreateCategory, useUpdateCategory } from "@/hooks/useCategories";
import { getErrorMessage } from "@/lib/error";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Switch from "@/components/form/switch/Switch";
import Spinner from "@/components/ui/spinner/Spinner";
import { useToast } from "@/hooks/useToast";

export interface CategoryOption {
  id: string;
  name: string;
  depth: number;
}

interface CategoryFormValues {
  name: string;
  slug: string;
  parentId?: string;
  isActive: boolean;
}

interface CategoryFormModalProps {
  open: boolean;
  onClose: () => void;
  editing: CategoryNode | null;
  parentOptions: CategoryOption[];
}

const EMPTY_VALUES: CategoryFormValues = { name: "", slug: "", parentId: undefined, isActive: true };

export function CategoryFormModal({
  open,
  onClose,
  editing,
  parentOptions,
}: CategoryFormModalProps) {
  const toast = useToast();
  const [values, setValues] = useState<CategoryFormValues>(EMPTY_VALUES);
  const [nameError, setNameError] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imagePublicId, setImagePublicId] = useState<string | null>(null);
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (open) {
      setValues({
        name: editing?.name ?? "",
        slug: editing?.slug ?? "",
        parentId: editing?.parentId ?? undefined,
        isActive: editing?.isActive ?? true,
      });
      setNameError(null);
      setImageUrls(editing?.image ? [editing.image] : []);
      setImagePublicId(editing?.imagePublicId ?? null);
    }
  }, [open, editing]);

  async function handleSubmit() {
    if (!values.name.trim()) {
      setNameError("Vui lòng nhập tên danh mục");
      return;
    }

    const payload = {
      name: values.name,
      slug: values.slug || undefined,
      parentId: values.parentId ?? null,
      isActive: values.isActive,
      image: imageUrls[0] ?? null,
      imagePublicId: imageUrls[0] ? imagePublicId : null,
    };

    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, payload });
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
      <div className="p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90">
          {editing ? "Sửa danh mục" : "Thêm danh mục"}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Tên danh mục <span className="text-error-500">*</span>
            </label>
            <Input
              placeholder="Ví dụ: Áo nam"
              value={values.name}
              onChange={(e) => {
                setValues((v) => ({ ...v, name: e.target.value }));
                if (nameError) setNameError(null);
              }}
              error={!!nameError}
              hint={nameError ?? undefined}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Slug (bỏ trống để tự sinh)
            </label>
            <Input
              placeholder="ao-nam"
              value={values.slug}
              onChange={(e) => setValues((v) => ({ ...v, slug: e.target.value }))}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Danh mục cha
            </label>
            <Select
              allowClear
              placeholder="Không có (danh mục gốc)"
              value={values.parentId}
              onChange={(value) => setValues((v) => ({ ...v, parentId: value }))}
              options={parentOptions
                .filter((option) => option.id !== editing?.id)
                .map((option) => ({
                  value: option.id,
                  label: `${"— ".repeat(option.depth)}${option.name}`,
                }))}
            />
          </div>

          <Switch
            label="Hiển thị"
            checked={values.isActive}
            onChange={(checked) => setValues((v) => ({ ...v, isActive: checked }))}
          />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Ảnh danh mục
            </label>
            <ImageUploader
              value={imageUrls}
              onChange={setImageUrls}
              max={1}
              onPublicIdChange={(_url, publicId) => setImagePublicId(publicId)}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Hủy
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={isSaving}
            startIcon={isSaving ? <Spinner size="sm" /> : undefined}
          >
            Lưu
          </Button>
        </div>
      </div>
    </Modal>
  );
}
