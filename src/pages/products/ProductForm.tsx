import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Spin,
  Typography,
  message,
} from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { ProductStatus } from "@/lib/shared-types";
import { useCategoryTree } from "@/hooks/useCategories";
import { useCreateProduct, useProductDetail, useUpdateProduct } from "@/hooks/useProducts";
import type { CreateProductPayload } from "@/lib/products-api";
import { ImageUploader } from "@/components/ImageUploader";
import { RichTextEditor } from "@/components/RichTextEditor";
import { getErrorMessage } from "@/lib/error";

interface VariantFormValue {
  id?: string;
  size: string;
  color: string;
  sku?: string;
  price?: number;
  stockQuantity?: number;
}

interface ProductFormValues {
  name: string;
  slug?: string;
  categoryId: string;
  basePrice: number;
  status: ProductStatus;
  variants: VariantFormValue[];
}

function slugifyClientSide(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function ProductForm() {
  const navigate = useNavigate();
  const { slug: editingSlug } = useParams<{ slug: string }>();
  const isEditing = Boolean(editingSlug);

  const [form] = Form.useForm<ProductFormValues>();
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);

  const { data: categoryTree } = useCategoryTree();
  const categoryOptions = useMemo(() => {
    function flatten(
      nodes: typeof categoryTree = [],
      depth = 0,
    ): { value: string; label: string }[] {
      return (nodes ?? []).flatMap((node) => [
        { value: node.id, label: `${"— ".repeat(depth)}${node.name}` },
        ...flatten(node.children, depth + 1),
      ]);
    }
    return flatten(categoryTree);
  }, [categoryTree]);

  const { data: product, isLoading: isLoadingProduct } = useProductDetail(editingSlug);
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (product) {
      form.setFieldsValue({
        name: product.name,
        slug: product.slug,
        categoryId: product.categoryId,
        basePrice: product.basePrice,
        status: product.status,
        variants: product.variants.map((v) => ({
          id: v.id,
          size: v.size,
          color: v.color,
          sku: v.sku,
          price: v.price,
          stockQuantity: v.stockQuantity,
        })),
      });
      setDescription(product.description ?? "");
      setThumbnail(product.thumbnail ? [product.thumbnail] : []);
      setImages(product.images ?? []);
    }
  }, [product, form]);

  function suggestSku(index: number) {
    const values = form.getFieldsValue();
    const variant = values.variants?.[index];
    if (!variant || variant.sku) return;
    const baseSlug = values.slug || slugifyClientSide(values.name || "");
    if (!baseSlug || !variant.size || !variant.color) return;
    const sku = slugifyClientSide(`${baseSlug}-${variant.size}-${variant.color}`).toUpperCase();
    const nextVariants = [...(values.variants ?? [])];
    nextVariants[index] = { ...variant, sku };
    form.setFieldValue("variants", nextVariants);
  }

  async function handleSubmit(values: ProductFormValues) {
    if (thumbnail.length === 0) {
      message.error("Vui lòng chọn ảnh đại diện sản phẩm");
      return;
    }
    if (!values.variants || values.variants.length === 0) {
      message.error("Sản phẩm cần ít nhất 1 biến thể");
      return;
    }

    const seen = new Set<string>();
    for (const variant of values.variants) {
      const key = `${variant.size.trim().toLowerCase()}|${variant.color.trim().toLowerCase()}`;
      if (seen.has(key)) {
        message.error(`Biến thể trùng lặp: ${variant.size} / ${variant.color}`);
        return;
      }
      seen.add(key);
    }

    const payload: CreateProductPayload = {
      name: values.name,
      slug: values.slug || undefined,
      description,
      categoryId: values.categoryId,
      basePrice: values.basePrice,
      status: values.status,
      thumbnail: thumbnail[0],
      images,
      variants: values.variants.map((v) => ({
        id: v.id,
        size: v.size,
        color: v.color,
        sku: v.sku || undefined,
        price: v.price,
        stockQuantity: v.stockQuantity ?? 0,
      })),
    };

    try {
      if (isEditing && product) {
        await updateMutation.mutateAsync({ id: product.id, payload });
        message.success("Đã cập nhật sản phẩm");
      } else {
        await createMutation.mutateAsync(payload);
        message.success("Đã tạo sản phẩm");
      }
      navigate("/products");
    } catch (error) {
      message.error(getErrorMessage(error));
    }
  }

  if (isEditing && isLoadingProduct) {
    return <Spin />;
  }

  return (
    <div>
      <Typography.Title level={3}>
        {isEditing ? "Sửa sản phẩm" : "Thêm sản phẩm"}
      </Typography.Title>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ status: ProductStatus.DRAFT, variants: [{ size: "", color: "" }] }}
      >
        <Card title="Thông tin chung" style={{ marginBottom: 16 }}>
          <Form.Item
            name="name"
            label="Tên sản phẩm"
            rules={[{ required: true, message: "Vui lòng nhập tên sản phẩm" }]}
          >
            <Input placeholder="Ví dụ: Áo sơ mi nam trắng" />
          </Form.Item>
          <Form.Item name="slug" label="Slug (bỏ trống để tự sinh)">
            <Input placeholder="ao-so-mi-nam-trang" />
          </Form.Item>
          <Form.Item label="Mô tả sản phẩm">
            <RichTextEditor value={description} onChange={setDescription} />
          </Form.Item>
          <div style={{ display: "flex", gap: 16 }}>
            <Form.Item
              name="categoryId"
              label="Danh mục"
              rules={[{ required: true, message: "Chọn danh mục" }]}
              style={{ flex: 1 }}
            >
              <Select options={categoryOptions} placeholder="Chọn danh mục" />
            </Form.Item>
            <Form.Item
              name="basePrice"
              label="Giá gốc"
              rules={[{ required: true, message: "Nhập giá gốc" }]}
              style={{ flex: 1 }}
            >
              <InputNumber min={1000} step={1000} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="status" label="Trạng thái" style={{ flex: 1 }}>
              <Select
                options={[
                  { value: ProductStatus.DRAFT, label: "Nháp" },
                  { value: ProductStatus.ACTIVE, label: "Đang bán" },
                  { value: ProductStatus.INACTIVE, label: "Ngừng bán" },
                ]}
              />
            </Form.Item>
          </div>
        </Card>

        <Card title="Hình ảnh" style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 16 }}>
            <ImageUploader value={thumbnail} onChange={setThumbnail} max={1} label="Ảnh đại diện" />
          </div>
          <ImageUploader value={images} onChange={setImages} max={8} label="Thư viện ảnh" />
        </Card>

        <Card title="Biến thể (size / màu)" style={{ marginBottom: 16 }}>
          <Form.List name="variants">
            {(fields, { add, remove }) => (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {fields.map((field) => (
                  <Space key={field.key} align="baseline" wrap>
                    <Form.Item
                      name={[field.name, "size"]}
                      rules={[{ required: true, message: "Size" }]}
                      style={{ marginBottom: 0 }}
                    >
                      <Input
                        placeholder="Size (S, M, L...)"
                        style={{ width: 110 }}
                        onBlur={() => suggestSku(field.name)}
                      />
                    </Form.Item>
                    <Form.Item
                      name={[field.name, "color"]}
                      rules={[{ required: true, message: "Màu" }]}
                      style={{ marginBottom: 0 }}
                    >
                      <Input
                        placeholder="Màu sắc"
                        style={{ width: 130 }}
                        onBlur={() => suggestSku(field.name)}
                      />
                    </Form.Item>
                    <Form.Item name={[field.name, "sku"]} style={{ marginBottom: 0 }}>
                      <Input placeholder="SKU (tự sinh)" style={{ width: 200 }} />
                    </Form.Item>
                    <Form.Item name={[field.name, "price"]} style={{ marginBottom: 0 }}>
                      <InputNumber placeholder="Giá (= giá gốc nếu bỏ trống)" style={{ width: 200 }} />
                    </Form.Item>
                    <Form.Item name={[field.name, "stockQuantity"]} style={{ marginBottom: 0 }}>
                      <InputNumber min={0} placeholder="Tồn kho" style={{ width: 120 }} />
                    </Form.Item>
                    <Button danger icon={<DeleteOutlined />} onClick={() => remove(field.name)} />
                  </Space>
                ))}
                <Button type="dashed" icon={<PlusOutlined />} onClick={() => add({ size: "", color: "" })}>
                  Thêm biến thể
                </Button>
              </div>
            )}
          </Form.List>
        </Card>

        <Space>
          <Button type="primary" htmlType="submit" loading={isSaving}>
            Lưu
          </Button>
          <Button onClick={() => navigate("/products")}>Hủy</Button>
        </Space>
      </Form>
    </div>
  );
}
