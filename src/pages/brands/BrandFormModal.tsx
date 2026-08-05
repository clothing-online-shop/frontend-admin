import { useEffect, useState } from "react";
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

interface BrandFormValues {
  name: string;
  description: string;
  origin: string;
}

interface BrandFormModalProps {
  open: boolean;
  onClose: () => void;
  editing: Brand | null;
}

const EMPTY_VALUES: BrandFormValues = { name: "", description: "", origin: "" };

export function BrandFormModal({ open, onClose, editing }: BrandFormModalProps) {
  const toast = useToast();
  const [values, setValues] = useState<BrandFormValues>(EMPTY_VALUES);
  const [nameError, setNameError] = useState<string | null>(null);
  const [logoUrls, setLogoUrls] = useState<string[]>([]);
  const createMutation = useCreateBrand();
  const updateMutation = useUpdateBrand();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (open) {
      setValues({
        name: editing?.name ?? "",
        description: editing?.description ?? "",
        origin: editing?.origin ?? "",
      });
      setNameError(null);
      setLogoUrls(editing?.logo ? [editing.logo] : []);
    }
  }, [open, editing]);

  async function handleSubmit() {
    if (!values.name.trim()) {
      setNameError("Vui lòng nhập tên thương hiệu");
      return;
    }

    const payload = {
      name: values.name,
      description: values.description || undefined,
      origin: values.origin || undefined,
      logo: logoUrls[0],
    };

    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, payload });
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
      <div className="p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90">
          {editing ? "Sửa thương hiệu" : "Thêm thương hiệu"}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Tên thương hiệu <span className="text-error-500">*</span>
            </label>
            <Input
              placeholder="Ví dụ: Uniqlo"
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
              Xuất xứ
            </label>
            <Input
              placeholder="Ví dụ: Nhật Bản"
              value={values.origin}
              onChange={(e) => setValues((v) => ({ ...v, origin: e.target.value }))}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Mô tả
            </label>
            <TextArea
              placeholder="Giới thiệu ngắn về thương hiệu"
              value={values.description}
              onChange={(value) => setValues((v) => ({ ...v, description: value }))}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Logo
            </label>
            <ImageUploader value={logoUrls} onChange={setLogoUrls} max={1} />
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
