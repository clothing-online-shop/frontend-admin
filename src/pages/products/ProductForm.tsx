import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useWatch, FormProvider, type FieldErrors } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { ProductStatus } from "@/types/shared-types";
import {
  useAssignProductCollections,
  useCreateProduct,
  useProductDetail,
  useUpdateProduct,
} from "@/hooks/useProducts";
import type {
  CreateProductPayload,
  ProductVariantPayload,
  UpdateProductPayload,
} from "@/types/products-api.types";
import { getErrorMessage } from "@/lib/error";
import Button from "@/components/ui/button/Button";
import Spinner from "@/components/ui/spinner/Spinner";
import DeactivateCollectionsConfirmModal from "./DeactivateCollectionsConfirmModal";
import { useToast } from "@/hooks/useToast";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import { productSchema, type ProductFormValues } from "@/schemas/product.schema";
import { ProductFormStepper } from "./form-steps/ProductFormStepper";
import { ProductGeneralInfoStep } from "./form-steps/ProductGeneralInfoStep";
import { ProductVariantsStep } from "./form-steps/ProductVariantsStep";
import { ProductImagesStep } from "./form-steps/ProductImagesStep";
import { ProductCollectionsStep } from "./form-steps/ProductCollectionsStep";
import { ProductSeoStep } from "./form-steps/ProductSeoStep";

const STEPS: { label: string; fields: (keyof ProductFormValues)[] }[] = [
  {
    label: "Thông tin chung",
    fields: [
      "name",
      "slug",
      "description",
      "material",
      "categoryId",
      "basePrice",
      "salePrice",
      "status",
      "isFeatured",
    ],
  },
  { label: "Biến thể", fields: ["variants"] },
  { label: "Ảnh", fields: ["thumbnail", "images"] },
  { label: "Bộ sưu tập", fields: ["collectionIds"] },
  { label: "SEO", fields: [] },
];

// Bộ sưu tập gán qua PUT /products/:id/collections riêng (xem AssignCollectionsDto ở BE),
// không PATCH gộp như các step khác — handleSaveStep rẽ nhánh theo index này.
const COLLECTIONS_STEP_INDEX = STEPS.findIndex((step) => step.label === "Bộ sưu tập");

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
  isFeatured: false,
  thumbnail: [],
  thumbnailPublicId: undefined,
  images: [],
  imagePublicIds: [],
  metaTitle: "",
  metaDescription: "",
  variants: [{ size: "", color: "", sku: "", price: undefined, stockQuantity: 0, imageUrl: undefined }],
  collectionIds: [],
};

function buildVariantsPayload(variants: ProductFormValues["variants"]): ProductVariantPayload[] {
  return variants
    .filter((v) => v.size?.trim() && v.color?.trim())
    .map((v) => ({
      id: v.id,
      size: v.size,
      color: v.color,
      sku: v.sku || undefined,
      price: v.price,
      stockQuantity: v.stockQuantity ?? 0,
      // null (không phải undefined) khi trống — undefined bị JSON.stringify loại khỏi
      // payload, PATCH sẽ hiểu nhầm thành "giữ nguyên ảnh cũ" thay vì "đã gỡ ảnh".
      imageUrl: v.imageUrl || null,
    }));
}

// Dùng khi tạo mới sản phẩm — chỉ gọi được từ nút "Lưu" ở step cuối (SEO), sau khi
// handleSubmit đã validate toàn bộ 4 step nên mọi field ở đây chắc chắn đã hợp lệ.
function buildCreatePayload(values: ProductFormValues): CreateProductPayload {
  return {
    name: values.name,
    slug: values.slug,
    description: values.description,
    material: values.material || undefined,
    careInstructions: values.careInstructions || undefined,
    categoryId: values.categoryId,
    brandId: values.brandId || undefined,
    basePrice: values.basePrice,
    salePrice: values.salePrice,
    status: values.status,
    isFeatured: values.isFeatured,
    thumbnail: values.thumbnail[0],
    thumbnailPublicId: values.thumbnailPublicId,
    images: values.images,
    imagePublicIds: values.imagePublicIds,
    metaTitle: values.metaTitle || undefined,
    metaDescription: values.metaDescription || undefined,
    variants: buildVariantsPayload(values.variants),
    collectionIds: values.collectionIds,
  };
}

function buildGeneralPayload(values: ProductFormValues): UpdateProductPayload {
  return {
    name: values.name,
    slug: values.slug,
    description: values.description,
    material: values.material,
    careInstructions: values.careInstructions,
    categoryId: values.categoryId,
    // Bỏ trống = user chủ động gỡ thương hiệu → gửi null để backend phân biệt với "không đổi".
    brandId: values.brandId || null,
    basePrice: values.basePrice,
    // Bỏ trống = user chủ động xoá giá khuyến mãi → gửi null để backend phân biệt với
    // "không đổi" (undefined bị JSON.stringify loại khỏi payload, PATCH sẽ giữ nguyên giá cũ).
    salePrice: values.salePrice ?? null,
    status: values.status,
    isFeatured: values.isFeatured,
  };
}

// Dùng khi sửa sản phẩm có sẵn — mỗi step tự PATCH đúng phần dữ liệu của step đó, không
// đụng tới field ở step khác (API update đã là PATCH, field không gửi lên = giữ nguyên).
function buildStepUpdatePayload(stepIndex: number, values: ProductFormValues): UpdateProductPayload {
  switch (stepIndex) {
    case 0:
      return buildGeneralPayload(values);
    case 1:
      return { variants: buildVariantsPayload(values.variants) };
    case 2:
      return {
        thumbnail: values.thumbnail[0],
        thumbnailPublicId: values.thumbnailPublicId,
        images: values.images,
        imagePublicIds: values.imagePublicIds,
        // Khối "Ảnh theo màu sắc" nằm ở step này nhưng ghi vào variants[].imageUrl (form
        // state dùng chung, không tách riêng) — phải gửi kèm variants thì lựa chọn ảnh
        // theo màu mới tới được BE, nếu không chỉ nằm ở state cục bộ rồi mất khi rời trang.
        variants: buildVariantsPayload(values.variants),
      };
    // Bước "Bộ sưu tập" (COLLECTIONS_STEP_INDEX) không bao giờ tới đây — handleSaveStep
    // rẽ nhánh gọi assignCollectionsMutation riêng trước khi gọi hàm này.
    default:
      return { metaTitle: values.metaTitle, metaDescription: values.metaDescription };
  }
}

interface ProductFormProps {
  viewOnly?: boolean;
}

export default function ProductForm({ viewOnly = false }: ProductFormProps) {
  const navigate = useNavigate();
  const toast = useToast();
  const { slug: editingSlug } = useParams<{ slug: string }>();
  const isEditing = Boolean(editingSlug);
  const pageTitle = viewOnly ? "Xem sản phẩm" : isEditing ? "Sửa sản phẩm" : "Thêm sản phẩm";
  useBreadcrumb([{ label: "Sản phẩm", href: "/products" }, { label: pageTitle }]);

  const [currentStep, setCurrentStep] = useState(0);
  const [maxStepReached, setMaxStepReached] = useState(0);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  // Luồng sửa sản phẩm "Lưu" từng bước gọi trigger() chứ không phải handleSubmit(), nên
  // formState.isSubmitted (RHF chỉ set true qua handleSubmit) không bao giờ true — field lỗi
  // từ dữ liệu cũ (trước khi có rule validate này) mà user chưa đụng vào sẽ không hiện viền
  // đỏ/hint dù nút "Lưu" bị disable đúng, khiến user không hiểu vì sao không lưu được. Cờ này
  // bổ sung thêm 1 điều kiện hiện lỗi nữa cho riêng bước đang xem, không đụng semantics
  // isDirty/isSubmitted sẵn có (xem lib/form.ts).
  const [currentStepSaveFailed, setCurrentStepSaveFailed] = useState(false);

  const methods = useForm<ProductFormValues>({
    resolver: yupResolver(productSchema),
    defaultValues: EMPTY_VALUES,
    mode: "onChange",
  });
  const { handleSubmit, trigger, reset, getValues, setValue, control, formState } = methods;

  const currentStepFields = STEPS[currentStep].fields;
  // Chỉ để subscribe re-render khi giá trị các field của bước hiện tại đổi — validity
  // thật lấy từ formState.errors (yupResolver validate toàn bộ schema mỗi lần đổi vì
  // mode "onChange", nên errors của field bước khác cũng có sẵn, không cần validate lại).
  useWatch({ control, name: currentStepFields });
  const isStepValid = useMemo(
    () => currentStepFields.every((field) => !formState.errors[field]),
    [currentStepFields, formState.errors],
  );

  const { data: product, isLoading: isLoadingProduct } = useProductDetail(editingSlug);
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const assignCollectionsMutation = useAssignProductCollections();
  const isSaving =
    createMutation.isPending || updateMutation.isPending || assignCollectionsMutation.isPending;

  useEffect(() => {
    // Bước 0 chưa có tương tác gì thì formState.errors rỗng dù field bắt buộc còn
    // trống — trigger 1 lần khi đổi bước để nút "Tiếp theo"/"Lưu" phản ánh đúng trạng
    // thái ngay từ đầu, không cần đợi user gõ phím mới thấy disable.
    void trigger(currentStepFields);
    setCurrentStepSaveFailed(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  useEffect(() => {
    if (!product) return;
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
      isFeatured: product.isFeatured,
      thumbnail: product.thumbnail ? [product.thumbnail] : [],
      thumbnailPublicId: product.thumbnailPublicId ?? undefined,
      images: product.images ?? [],
      imagePublicIds: product.imagePublicIds ?? [],
      metaTitle: product.metaTitle ?? "",
      metaDescription: product.metaDescription ?? "",
      variants: product.variants.map((v) => ({
        id: v.id,
        size: v.size,
        color: v.color,
        sku: v.sku,
        price: v.price,
        stockQuantity: v.stockQuantity,
        imageUrl: v.imageUrl ?? undefined,
      })),
      collectionIds: product.collections.map((c) => c.id),
    });
    setMaxStepReached(STEPS.length - 1);
    // reset() xoá sạch errors cũ — trigger lại để nút "Tiếp theo"/"Lưu" phản ánh đúng dữ
    // liệu sản phẩm thật vừa load (vd sản phẩm cũ tạo trước khi field bắt buộc này tồn
    // tại) thay vì mặc định coi là hợp lệ.
    void trigger(STEPS[0].fields);
    // Chỉ hydrate lại khi ĐỔI sản phẩm (id đổi) — không phải mỗi lần refetch nội dung.
    // Mọi mutation đều invalidateQueries, PATCH 1 step xong sẽ làm `product` đổi
    // reference dù cùng id; nếu effect chạy lại theo reference, reset() sẽ ghi đè mất
    // dữ liệu đang gõ dở ở step khác chưa lưu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id, reset, trigger]);

  function goToStep(index: number) {
    if (index <= maxStepReached) setCurrentStep(index);
  }

  async function goNext() {
    // Màn xem (viewOnly) không nhập liệu gì — không validate, chỉ điều hướng, tránh
    // trường hợp sản phẩm cũ không còn khớp schema hiện tại (vd thiếu ảnh) làm kẹt
    // luôn cả việc xem, không liên quan gì tới "Tiếp theo" ở màn tạo/sửa thật.
    if (!viewOnly) {
      const fields = STEPS[currentStep].fields;
      const valid = fields.length === 0 ? true : await trigger(fields);
      if (!valid) {
        toast.error("Vui lòng điền đủ thông tin bắt buộc ở bước này trước khi tiếp tục");
        return;
      }
    }
    const next = Math.min(currentStep + 1, STEPS.length - 1);
    setCurrentStep(next);
    setMaxStepReached((prev) => Math.max(prev, next));
  }

  function goBack() {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }

  // Tạo mới sản phẩm — chỉ dùng ở step cuối, validate toàn bộ form (handleSubmit lo).
  async function onValid(values: ProductFormValues) {
    try {
      await createMutation.mutateAsync(buildCreatePayload(values));
      toast.success("Đã tạo sản phẩm");
      navigate("/products");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  function onInvalid(errors: FieldErrors<ProductFormValues>) {
    // Lỗi có thể nằm ở step không phải step đang hiển thị — nhảy về đúng step đầu tiên
    // có lỗi để admin thấy ngay, không chỉ hiện toast chung chung.
    const erroredFields = Object.keys(errors);
    const stepIndex = STEPS.findIndex((step) =>
      step.fields.some((field) => erroredFields.includes(field)),
    );
    if (stepIndex !== -1) {
      setCurrentStep(stepIndex);
      setMaxStepReached((prev) => Math.max(prev, stepIndex));
    }
    toast.error("Vui lòng kiểm tra lại thông tin đã nhập");
  }

  // getValues() trả nguyên giá trị input thô (vd basePrice là string "199000") — chỉ
  // schema.cast() mới áp transform/coerce kiểu của Yup (vd ép sang number thật) giống hệt
  // dữ liệu handleSubmit() vẫn hay trả về, assert: false vì field ở step khác có thể chưa
  // hợp lệ tại thời điểm này (không cần chặn, chỉ cần đúng field của step đang lưu).
  function castCurrentValues(): ProductFormValues {
    return productSchema.cast(getValues(), { assert: false }) as ProductFormValues;
  }

  // Lưu riêng 1 step khi đang sửa sản phẩm có sẵn — PATCH đúng phần dữ liệu step đó.
  async function handleSaveStep() {
    if (!product) return;
    const fields = STEPS[currentStep].fields;
    const valid = fields.length === 0 ? true : await trigger(fields);
    if (!valid) {
      setCurrentStepSaveFailed(true);
      return;
    }
    setCurrentStepSaveFailed(false);

    const values = castCurrentValues();

    // Đổi status khỏi ACTIVE trong khi sản phẩm đang thuộc ≥1 bộ sưu tập — lưu sẽ tự động
    // gỡ khỏi các bộ sưu tập đó (xem products.service.ts update()), xác nhận trước để
    // admin không bị bất ngờ mất liên kết mà không hay biết.
    if (
      currentStep === 0 &&
      values.status !== ProductStatus.ACTIVE &&
      product.collections.length > 0
    ) {
      setConfirmDeactivate(true);
      return;
    }

    await saveStep(values);
  }

  async function saveStep(values: ProductFormValues) {
    if (!product) return;
    try {
      if (currentStep === COLLECTIONS_STEP_INDEX) {
        await assignCollectionsMutation.mutateAsync({
          productId: product.id,
          payload: { collectionIds: values.collectionIds ?? [] },
        });
      } else {
        await updateMutation.mutateAsync({
          id: product.id,
          payload: buildStepUpdatePayload(currentStep, values),
        });
        // BE tự gỡ sản phẩm khỏi mọi bộ sưu tập khi status đổi khỏi ACTIVE (xem
        // products.service.ts update()) — đồng bộ lại ngay ở form, nếu không giữ nguyên
        // collectionIds cũ thì lần lưu bước "Bộ sưu tập" sau (kể cả sau khi đã bật lại
        // ACTIVE, vì admin không đụng gì tới checkbox) sẽ vô tình gán lại đúng những bộ sưu
        // tập vừa bị gỡ, do PUT .../collections là API thay thế toàn bộ.
        if (currentStep === 0 && values.status !== ProductStatus.ACTIVE) {
          setValue("collectionIds", []);
        }
      }
      toast.success(`Đã lưu ${STEPS[currentStep].label}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function handleConfirmDeactivate() {
    setConfirmDeactivate(false);
    await saveStep(castCurrentValues());
  }

  if (isEditing && isLoadingProduct) {
    return <Spinner className="text-brand-500" />;
  }

  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <FormProvider {...methods}>
      <div>
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <ProductFormStepper
            steps={STEPS}
            currentStep={currentStep}
            maxStepReached={maxStepReached}
            onStepClick={goToStep}
          />
        </div>

        <div className="space-y-4">
          {/* fieldset disabled tự vô hiệu hoá mọi input/select/button form-native bên trong
              (kể cả Select tự dựng vì trigger vẫn là <button> thật) mà không cần sửa từng
              step component — chỉ CKEditor (contenteditable, không phải form control chuẩn)
              cần tự truyền prop disabled riêng, xem ProductGeneralInfoStep. */}
          <fieldset disabled={viewOnly} className="m-0 min-w-0 space-y-4 border-0 p-0">
            {currentStep === 0 && (
              <ProductGeneralInfoStep viewOnly={viewOnly} saveAttempted={currentStepSaveFailed} />
            )}
            {currentStep === 1 && (
              <ProductVariantsStep viewOnly={viewOnly} saveAttempted={currentStepSaveFailed} />
            )}
            {currentStep === 2 && (
              <ProductImagesStep viewOnly={viewOnly} saveAttempted={currentStepSaveFailed} />
            )}
            {currentStep === COLLECTIONS_STEP_INDEX && (
              <ProductCollectionsStep viewOnly={viewOnly} />
            )}
            {currentStep === STEPS.length - 1 && <ProductSeoStep />}
          </fieldset>

          <div className="flex items-center justify-between gap-3 mt-3">
            <div>
              {!viewOnly && currentStep > 0 && (
                <Button type="button" variant="outline" onClick={goBack}>
                  Quay lại
                </Button>
              )}
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => navigate("/products")}>
                Hủy
              </Button>
              {!isLastStep && (
                <Button type="button" onClick={goNext} disabled={!viewOnly && !isStepValid}>
                  Tiếp theo
                </Button>
              )}
              {!viewOnly &&
                (isEditing ? (
                  // Sửa sản phẩm: mỗi step tự "Lưu" riêng, chỉ PATCH đúng dữ liệu step đó.
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleSaveStep}
                    disabled={!isStepValid || isSaving}
                    startIcon={isSaving ? <Spinner size="sm" /> : undefined}
                  >
                    Lưu
                  </Button>
                ) : (
                  // Tạo mới: chỉ 1 nút "Lưu" ở step cuối, bắt buộc nhập đủ thông tin từ step
                  // đầu (tên, danh mục...) tới biến thể/ảnh mới tạo được sản phẩm.
                  isLastStep && (
                    <Button
                      type="button"
                      variant="primary"
                      onClick={() => handleSubmit(onValid, onInvalid)()}
                      disabled={isSaving}
                      startIcon={isSaving ? <Spinner size="sm" /> : undefined}
                    >
                      Lưu
                    </Button>
                  )
                ))}
            </div>
          </div>
        </div>
      </div>

      <DeactivateCollectionsConfirmModal
        open={confirmDeactivate}
        collections={product?.collections ?? []}
        onClose={() => setConfirmDeactivate(false)}
        onConfirm={handleConfirmDeactivate}
      />
    </FormProvider>
  );
}
