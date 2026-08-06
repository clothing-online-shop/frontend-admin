import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, FormProvider } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { ProductStatus } from "@/lib/shared-types";
import { useCreateProduct, useProductDetail, useUpdateProduct } from "@/hooks/useProducts";
import type { CreateProductPayload } from "@/lib/products-api";
import { getErrorMessage } from "@/lib/error";
import Button from "@/components/ui/button/Button";
import Spinner from "@/components/ui/spinner/Spinner";
import { useToast } from "@/hooks/useToast";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import { productSchema, type ProductFormValues } from "@/schemas/product.schema";
import { ProductFormStepper } from "./ProductFormStepper";
import { ProductGeneralInfoStep } from "./ProductGeneralInfoStep";
import { ProductVariantsStep } from "./ProductVariantsStep";
import { ProductImagesStep } from "./ProductImagesStep";
import { ProductSeoStep } from "./ProductSeoStep";

const STEPS: { label: string; fields: (keyof ProductFormValues)[] }[] = [
  { label: "Thông tin chung", fields: ["name", "categoryId", "basePrice", "salePrice"] },
  { label: "Biến thể", fields: ["variants"] },
  { label: "Ảnh", fields: ["thumbnail"] },
  { label: "SEO", fields: [] },
];

const EMPTY_VALUES: ProductFormValues = {
  name: "",
  slug: "",
  description: "",
  material: "",
  careInstructions: "",
  categoryId: "",
  brandId: "",
  basePrice: undefined as unknown as number,
  salePrice: undefined,
  status: ProductStatus.DRAFT,
  thumbnail: [],
  images: [],
  metaTitle: "",
  metaDescription: "",
  variants: [{ size: "", color: "", sku: "", price: undefined, stockQuantity: 0 }],
};

export default function ProductForm() {
  const navigate = useNavigate();
  const toast = useToast();
  const { slug: editingSlug } = useParams<{ slug: string }>();
  const isEditing = Boolean(editingSlug);
  useBreadcrumb([
    { label: "Sản phẩm", href: "/products" },
    { label: isEditing ? "Sửa sản phẩm" : "Thêm sản phẩm" },
  ]);

  const [currentStep, setCurrentStep] = useState(0);
  const [maxStepReached, setMaxStepReached] = useState(0);

  const methods = useForm<ProductFormValues>({
    resolver: yupResolver(productSchema),
    defaultValues: EMPTY_VALUES,
  });
  const { handleSubmit, trigger, reset } = methods;

  const { data: product, isLoading: isLoadingProduct } = useProductDetail(editingSlug);
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        slug: product.slug,
        description: product.description ?? "",
        material: product.material ?? "",
        careInstructions: product.careInstructions ?? "",
        categoryId: product.categoryId,
        brandId: product.brand?.id ?? "",
        basePrice: product.basePrice,
        salePrice: product.salePrice ?? undefined,
        status: product.status,
        thumbnail: product.thumbnail ? [product.thumbnail] : [],
        images: product.images ?? [],
        metaTitle: product.metaTitle ?? "",
        metaDescription: product.metaDescription ?? "",
        variants: product.variants.map((v) => ({
          id: v.id,
          size: v.size,
          color: v.color,
          sku: v.sku,
          price: v.price,
          stockQuantity: v.stockQuantity,
        })),
      });
      setMaxStepReached(STEPS.length - 1);
    }
  }, [product, reset]);

  function goToStep(index: number) {
    if (index <= maxStepReached) setCurrentStep(index);
  }

  async function goNext() {
    const fields = STEPS[currentStep].fields;
    const valid = fields.length === 0 ? true : await trigger(fields);
    if (!valid) return;
    const next = Math.min(currentStep + 1, STEPS.length - 1);
    setCurrentStep(next);
    setMaxStepReached((prev) => Math.max(prev, next));
  }

  function goBack() {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }

  async function onValid(values: ProductFormValues) {
    const payload: CreateProductPayload = {
      name: values.name,
      slug: values.slug || undefined,
      description: values.description,
      material: values.material || undefined,
      careInstructions: values.careInstructions || undefined,
      categoryId: values.categoryId,
      brandId: values.brandId || undefined,
      basePrice: values.basePrice,
      salePrice: values.salePrice,
      status: values.status,
      thumbnail: values.thumbnail[0],
      images: values.images,
      metaTitle: values.metaTitle || undefined,
      metaDescription: values.metaDescription || undefined,
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

  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <FormProvider {...methods}>
      <div>
        <h3 className="mb-5 text-2xl font-semibold text-gray-800 dark:text-white/90">
          {isEditing ? "Sửa sản phẩm" : "Thêm sản phẩm"}
        </h3>

        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <ProductFormStepper
            steps={STEPS}
            currentStep={currentStep}
            maxStepReached={maxStepReached}
            onStepClick={goToStep}
          />
        </div>

        <form onSubmit={handleSubmit(onValid)} className="space-y-4">
          {currentStep === 0 && <ProductGeneralInfoStep />}
          {currentStep === 1 && <ProductVariantsStep />}
          {currentStep === 2 && <ProductImagesStep />}
          {currentStep === 3 && <ProductSeoStep />}

          <div className="flex gap-3">
            {currentStep > 0 && (
              <Button type="button" variant="outline" onClick={goBack}>
                Quay lại
              </Button>
            )}
            {!isLastStep && (
              <Button type="button" onClick={goNext}>
                Tiếp theo
              </Button>
            )}
            {isLastStep && (
              <Button
                type="submit"
                variant="primary"
                disabled={isSaving}
                startIcon={isSaving ? <Spinner size="sm" /> : undefined}
              >
                Lưu
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => navigate("/products")}>
              Hủy
            </Button>
          </div>
        </form>
      </div>
    </FormProvider>
  );
}
