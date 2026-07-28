import { useEffect, useState } from "react";
import { Form, Input, Modal, Select, Switch, message } from "antd";
import type { CategoryNode } from "@/lib/shared-types";
import { ImageUploader } from "@/components/ImageUploader";
import { useCreateCategory, useUpdateCategory } from "@/hooks/useCategories";
import { getErrorMessage } from "@/lib/error";

export interface CategoryOption {
  id: string;
  name: string;
  depth: number;
}

interface CategoryFormValues {
  name: string;
  slug?: string;
  parentId?: string;
  isActive: boolean;
}

interface CategoryFormModalProps {
  open: boolean;
  onClose: () => void;
  editing: CategoryNode | null;
  parentOptions: CategoryOption[];
}

export function CategoryFormModal({
  open,
  onClose,
  editing,
  parentOptions,
}: CategoryFormModalProps) {
  const [form] = Form.useForm<CategoryFormValues>();
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        name: editing?.name ?? "",
        slug: editing?.slug ?? "",
        parentId: editing?.parentId ?? undefined,
        isActive: editing?.isActive ?? true,
      });
      setImageUrls(editing?.image ? [editing.image] : []);
    }
  }, [open, editing, form]);

  async function handleSubmit() {
    const values = await form.validateFields();
    const payload = {
      name: values.name,
      slug: values.slug || undefined,
      parentId: values.parentId ?? null,
      isActive: values.isActive,
      image: imageUrls[0],
    };

    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, payload });
        message.success("Đã cập nhật danh mục");
      } else {
        await createMutation.mutateAsync(payload);
        message.success("Đã tạo danh mục");
      }
      onClose();
    } catch (error) {
      message.error(getErrorMessage(error));
    }
  }

  return (
    <Modal
      title={editing ? "Sửa danh mục" : "Thêm danh mục"}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={isSaving}
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="Tên danh mục"
          rules={[{ required: true, message: "Vui lòng nhập tên danh mục" }]}
        >
          <Input placeholder="Ví dụ: Áo nam" />
        </Form.Item>
        <Form.Item name="slug" label="Slug (bỏ trống để tự sinh)">
          <Input placeholder="ao-nam" />
        </Form.Item>
        <Form.Item name="parentId" label="Danh mục cha">
          <Select
            allowClear
            placeholder="Không có (danh mục gốc)"
            options={parentOptions
              .filter((option) => option.id !== editing?.id)
              .map((option) => ({
                value: option.id,
                label: `${"— ".repeat(option.depth)}${option.name}`,
              }))}
          />
        </Form.Item>
        <Form.Item name="isActive" label="Hiển thị" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item label="Ảnh danh mục">
          <ImageUploader value={imageUrls} onChange={setImageUrls} max={1} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
