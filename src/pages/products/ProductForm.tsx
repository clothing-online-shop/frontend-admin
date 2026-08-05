import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ProductStatus } from "@/lib/shared-types";
import { useCategoryTree } from "@/hooks/useCategories";
import { useBrands } from "@/hooks/useBrands";
import { useCreateProduct, useProductDetail, useUpdateProduct } from "@/hooks/useProducts";
import type { CreateProductPayload } from "@/lib/products-api";
import { ImageUploader } from "@/components/ImageUploader";
import { RichTextEditor } from "@/components/RichTextEditor";
import { getErrorMessage } from "@/lib/error";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Spinner from "@/components/ui/spinner/Spinner";
import { useToast } from "@/hooks/useToast";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import { PlusIcon, TrashBinIcon } from "@/icons";

interface VariantFormValue {
  id?: string;
  size: string;
  color: string;
  sku: string;
  price: string;
  stockQuantity: string;
}

interface ProductFormValues {
  name: string;
  slug: string;
  categoryId: string;
  brandId: string;
  basePrice: string;
  status: ProductStatus;
}

const EMPTY_VARIANT: VariantFormValue = { size: "", color: "", sku: "", price: "", stockQuantity: "" };

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
  const toast = useToast();
  const { slug: editingSlug } = useParams<{ slug: string }>();
  const isEditing = Boolean(editingSlug);
  useBreadcrumb([
    { label: "Sản phẩm", href: "/products" },
    { label: isEditing ? "Sửa sản phẩm" : "Thêm sản phẩm" },
  ]);

  const [values, setValues] = useState<ProductFormValues>({
    name: "",
    slug: "",
    categoryId: "",
    brandId: "",
    basePrice: "",
    status: ProductStatus.DRAFT,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormValues, string>>>({});
  const [variants, setVariants] = useState<VariantFormValue[]>([{ ...EMPTY_VARIANT }]);
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

  const { data: brands } = useBrands();
  const brandOptions = useMemo(
    () => (brands ?? []).map((b) => ({ value: b.id, label: b.name })),
    [brands],
  );

  const { data: product, isLoading: isLoadingProduct } = useProductDetail(editingSlug);
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (product) {
      setValues({
        name: product.name,
        slug: product.slug,
        categoryId: product.categoryId,
        brandId: product.brand?.id ?? "",
        basePrice: String(product.basePrice),
        status: product.status,
      });
      setVariants(
        product.variants.map((v) => ({
          id: v.id,
          size: v.size,
          color: v.color,
          sku: v.sku,
          price: String(v.price),
          stockQuantity: String(v.stockQuantity),
        })),
      );
      setDescription(product.description ?? "");
      setThumbnail(product.thumbnail ? [product.thumbnail] : []);
      setImages(product.images ?? []);
    }
  }, [product]);

  function updateVariant(index: number, patch: Partial<VariantFormValue>) {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  }

  function addVariant() {
    setVariants((prev) => [...prev, { ...EMPTY_VARIANT }]);
  }

  function removeVariant(index: number) {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  }

  function suggestSku(index: number) {
    const variant = variants[index];
    if (!variant || variant.sku) return;
    const baseSlug = values.slug || slugifyClientSide(values.name);
    if (!baseSlug || !variant.size || !variant.color) return;
    const sku = slugifyClientSide(`${baseSlug}-${variant.size}-${variant.color}`).toUpperCase();
    updateVariant(index, { sku });
  }

  function validate(): boolean {
    const newErrors: Partial<Record<keyof ProductFormValues, string>> = {};
    if (!values.name.trim()) newErrors.name = "Vui lòng nhập tên sản phẩm";
    if (!values.categoryId) newErrors.categoryId = "Chọn danh mục";
    if (!values.basePrice || Number(values.basePrice) <= 0) newErrors.basePrice = "Nhập giá gốc";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    if (thumbnail.length === 0) {
      toast.error("Vui lòng chọn ảnh đại diện sản phẩm");
      return;
    }
    if (variants.length === 0) {
      toast.error("Sản phẩm cần ít nhất 1 biến thể");
      return;
    }
    for (const variant of variants) {
      if (!variant.size.trim() || !variant.color.trim()) {
        toast.error("Vui lòng nhập đủ size và màu cho từng biến thể");
        return;
      }
    }

    const seen = new Set<string>();
    for (const variant of variants) {
      const key = `${variant.size.trim().toLowerCase()}|${variant.color.trim().toLowerCase()}`;
      if (seen.has(key)) {
        toast.error(`Biến thể trùng lặp: ${variant.size} / ${variant.color}`);
        return;
      }
      seen.add(key);
    }

    const payload: CreateProductPayload = {
      name: values.name,
      slug: values.slug || undefined,
      description,
      categoryId: values.categoryId,
      brandId: values.brandId || undefined,
      basePrice: Number(values.basePrice),
      status: values.status,
      thumbnail: thumbnail[0],
      images,
      variants: variants.map((v) => ({
        id: v.id,
        size: v.size,
        color: v.color,
        sku: v.sku || undefined,
        price: v.price ? Number(v.price) : undefined,
        stockQuantity: v.stockQuantity ? Number(v.stockQuantity) : 0,
      })),
    };

    try {
      if (isEditing && product) {
        await updateMutation.mutateAsync({ id: product.id, payload });
        toast.success("Đã cập nhật sản phẩm");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Đã tạo sản phẩm");
      }
      navigate("/products");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  if (isEditing && isLoadingProduct) {
    return <Spinner />;
  }

  return (
    <div>
      <h3 className="mb-5 text-2xl font-semibold text-gray-800 dark:text-white/90">
        {isEditing ? "Sửa sản phẩm" : "Thêm sản phẩm"}
      </h3>

      <div className="space-y-4">
        <ComponentCard title="Thông tin chung">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Tên sản phẩm <span className="text-error-500">*</span>
            </label>
            <Input
              placeholder="Ví dụ: Áo sơ mi nam trắng"
              value={values.name}
              onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
              error={!!errors.name}
              hint={errors.name}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Slug (bỏ trống để tự sinh)
            </label>
            <Input
              placeholder="ao-so-mi-nam-trang"
              value={values.slug}
              onChange={(e) => setValues((v) => ({ ...v, slug: e.target.value }))}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Mô tả sản phẩm
            </label>
            <RichTextEditor value={description} onChange={setDescription} />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Danh mục <span className="text-error-500">*</span>
              </label>
              <Select
                placeholder="Chọn danh mục"
                options={categoryOptions}
                value={values.categoryId || undefined}
                onChange={(value) => setValues((v) => ({ ...v, categoryId: value ?? "" }))}
              />
              {errors.categoryId && (
                <p className="mt-1.5 text-xs text-error-500">{errors.categoryId}</p>
              )}
            </div>
            <div className="flex-1">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Thương hiệu
              </label>
              <Select
                allowClear
                placeholder="Chọn thương hiệu"
                options={brandOptions}
                value={values.brandId || undefined}
                onChange={(value) => setValues((v) => ({ ...v, brandId: value ?? "" }))}
              />
            </div>
            <div className="flex-1">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Giá gốc <span className="text-error-500">*</span>
              </label>
              <Input
                type="number"
                min="1000"
                step={1000}
                placeholder="0"
                value={values.basePrice}
                onChange={(e) => setValues((v) => ({ ...v, basePrice: e.target.value }))}
                error={!!errors.basePrice}
                hint={errors.basePrice}
              />
            </div>
            <div className="flex-1">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Trạng thái
              </label>
              <Select
                value={values.status}
                onChange={(value) => setValues((v) => ({ ...v, status: (value as ProductStatus) ?? ProductStatus.DRAFT }))}
                options={[
                  { value: ProductStatus.DRAFT, label: "Nháp" },
                  { value: ProductStatus.ACTIVE, label: "Đang bán" },
                  { value: ProductStatus.INACTIVE, label: "Ngừng bán" },
                ]}
              />
            </div>
          </div>
        </ComponentCard>

        <ComponentCard title="Hình ảnh">
          <ImageUploader value={thumbnail} onChange={setThumbnail} max={1} label="Ảnh đại diện" />
          <ImageUploader value={images} onChange={setImages} max={8} label="Thư viện ảnh" />
        </ComponentCard>

        <ComponentCard title="Biến thể (size / màu)">
          <div className="flex flex-col gap-3">
            {variants.map((variant, index) => (
              <div key={index} className="flex flex-wrap items-end gap-3">
                <div className="w-28">
                  <Input
                    placeholder="Size (S, M, L...)"
                    value={variant.size}
                    onChange={(e) => updateVariant(index, { size: e.target.value })}
                    onBlur={() => suggestSku(index)}
                  />
                </div>
                <div className="w-32">
                  <Input
                    placeholder="Màu sắc"
                    value={variant.color}
                    onChange={(e) => updateVariant(index, { color: e.target.value })}
                    onBlur={() => suggestSku(index)}
                  />
                </div>
                <div className="w-50">
                  <Input
                    placeholder="SKU (tự sinh)"
                    value={variant.sku}
                    onChange={(e) => updateVariant(index, { sku: e.target.value })}
                  />
                </div>
                <div className="w-50">
                  <Input
                    type="number"
                    placeholder="Giá (= giá gốc nếu bỏ trống)"
                    value={variant.price}
                    onChange={(e) => updateVariant(index, { price: e.target.value })}
                  />
                </div>
                <div className="w-30">
                  <Input
                    type="number"
                    min="0"
                    placeholder="Tồn kho"
                    value={variant.stockQuantity}
                    onChange={(e) => updateVariant(index, { stockQuantity: e.target.value })}
                  />
                </div>
                <Button
                  variant="outline"
                  className="!px-2.5 !py-2.5 !text-error-500 hover:!bg-error-50"
                  onClick={() => removeVariant(index)}
                >
                  <TrashBinIcon className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              startIcon={<PlusIcon className="h-4 w-4" />}
              onClick={addVariant}
              className="self-start"
            >
              Thêm biến thể
            </Button>
          </div>
        </ComponentCard>

        <div className="flex gap-3">
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={isSaving}
            startIcon={isSaving ? <Spinner size="sm" /> : undefined}
          >
            Lưu
          </Button>
          <Button variant="outline" onClick={() => navigate("/products")}>
            Hủy
          </Button>
        </div>
      </div>
    </div>
  );
}
