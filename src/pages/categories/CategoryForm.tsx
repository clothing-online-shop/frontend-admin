import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useWatch, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { findNode } from "@/lib/categoryTree";
import { ImageUploader } from "@/components/common/ImageUploader";
import {
  useCategoryTree,
  useCreateCategory,
  useUpdateCategory,
} from "@/hooks/useCategories";
import { getErrorMessage } from "@/lib/error";
import { useToast } from "@/hooks/useToast";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import {
  categorySchema,
  type CategoryFormValues,
} from "@/schemas/category.schema";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import CategorySelect from "@/components/form/CategorySelect";
import Switch from "@/components/form/switch/Switch";
import FieldLabel from "@/components/form/FieldLabel";
import Spinner from "@/components/ui/spinner/Spinner";

const EMPTY_VALUES: CategoryFormValues = {
  name: "",
  slug: "",
  parentId: undefined,
  isActive: true,
  image: [],
  showInNewArrivals: false,
  showInSaleCorner: false,
  megaMenuLeftImage: [],
  megaMenuRightImage: [],
  bannerImage: [],
};

interface CategoryFormProps {
  viewOnly?: boolean;
}

export default function CategoryForm({ viewOnly = false }: CategoryFormProps) {
  const navigate = useNavigate();
  const toast = useToast();
  const { id: editingId } = useParams<{ id: string }>();
  const isEditing = Boolean(editingId);
  const pageTitle = viewOnly
    ? "Xem danh mục"
    : isEditing
      ? "Sửa danh mục"
      : "Thêm danh mục";
  useBreadcrumb([
    { label: "Danh mục", href: "/categories" },
    { label: pageTitle },
  ]);

  const [imagePublicId, setImagePublicId] = useState<string | null>(null);
  const [megaMenuLeftImagePublicId, setMegaMenuLeftImagePublicId] = useState<
    string | null
  >(null);
  const [megaMenuRightImagePublicId, setMegaMenuRightImagePublicId] = useState<
    string | null
  >(null);
  const [bannerImagePublicId, setBannerImagePublicId] = useState<string | null>(
    null,
  );
  // Cây danh mục đã tải sẵn cho CategorySelect ("Danh mục cha") — tận dụng luôn để tra ra
  // node đang sửa (tìm theo id), không cần thêm 1 API GET chi tiết riêng như Voucher/Banner.
  const { data: categoryTree, isLoading: isLoadingTree } = useCategoryTree();
  const editing =
    editingId && categoryTree ? findNode(categoryTree, editingId) : null;
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();

  const {
    register,
    control,
    handleSubmit,
    reset,
    trigger,
    formState: { errors, isValid, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: yupResolver(categorySchema),
    defaultValues: EMPTY_VALUES,
    // "onChange" — isValid phải cập nhật ngay khi gõ/chọn, không đợi tới lần submit đầu
    // tiên, để nút "Lưu" disable đúng lúc còn thiếu trường bắt buộc (giống VoucherForm.tsx).
    mode: "onChange",
  });

  // 2 ảnh "look" mega menu chỉ có tác dụng với danh mục GỐC (không có cha) — ẩn hẳn 2 field
  // này khi đang sửa danh mục cấp 2/3 để không gây hiểu nhầm là cũng áp dụng được.
  const parentId = useWatch({ control, name: "parentId" });
  const isRoot = !parentId;

  useEffect(() => {
    if (!isEditing) void trigger();
  }, [isEditing, trigger]);

  useEffect(() => {
    if (!editing) return;
    reset({
      name: editing.name,
      slug: editing.slug,
      parentId: editing.parentId ?? undefined,
      isActive: editing.isActive,
      image: editing.image ? [editing.image] : [],
      showInNewArrivals: editing.showInNewArrivals,
      showInSaleCorner: editing.showInSaleCorner,
      megaMenuLeftImage: editing.megaMenuLeftImageUrl
        ? [editing.megaMenuLeftImageUrl]
        : [],
      megaMenuRightImage: editing.megaMenuRightImageUrl
        ? [editing.megaMenuRightImageUrl]
        : [],
      bannerImage: editing.bannerImageUrl ? [editing.bannerImageUrl] : [],
    });
    setImagePublicId(editing.imagePublicId ?? null);
    setMegaMenuLeftImagePublicId(editing.megaMenuLeftImagePublicId ?? null);
    setMegaMenuRightImagePublicId(editing.megaMenuRightImagePublicId ?? null);
    setBannerImagePublicId(editing.bannerImagePublicId ?? null);
    void trigger();
  }, [editing, reset, trigger]);

  async function onValid(values: CategoryFormValues) {
    // Bỏ trống ảnh ở form nghĩa là user chủ động xoá ảnh — phải gửi null (không phải bỏ
    // field) để backend phân biệt với "không đổi", và cùng lúc phải khớp với
    // imagePublicId (cùng null hoặc cùng có giá trị) — xem assertImagePublicIdAligned ở
    // categories.service.ts. 2 ảnh look chỉ gửi khi đang là danh mục gốc — chuyển 1 danh mục
    // đang có ảnh look sang làm con của danh mục khác thì field này không còn ý nghĩa, nhưng
    // vẫn giữ nguyên dữ liệu cũ (không tự xoá) để không mất ảnh nếu admin chuyển qua lại.
    const payload = {
      name: values.name,
      slug: values.slug || undefined,
      parentId: values.parentId ?? null,
      isActive: values.isActive,
      image: values.image[0] ?? null,
      imagePublicId: values.image[0] ? imagePublicId : null,
      bannerImageUrl: values.bannerImage[0] ?? null,
      bannerImagePublicId: values.bannerImage[0] ? bannerImagePublicId : null,
      showInNewArrivals: values.showInNewArrivals,
      showInSaleCorner: values.showInSaleCorner,
      ...(isRoot
        ? {
            megaMenuLeftImageUrl: values.megaMenuLeftImage[0] ?? null,
            megaMenuLeftImagePublicId: values.megaMenuLeftImage[0]
              ? megaMenuLeftImagePublicId
              : null,
            megaMenuRightImageUrl: values.megaMenuRightImage[0] ?? null,
            megaMenuRightImagePublicId: values.megaMenuRightImage[0]
              ? megaMenuRightImagePublicId
              : null,
          }
        : {}),
    };

    try {
      if (isEditing && editing) {
        await updateMutation.mutateAsync({ id: editing.id, payload });
        toast.success("Đã cập nhật danh mục");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Đã tạo danh mục");
      }
      navigate("/categories");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  if (isEditing && isLoadingTree) {
    return <Spinner className="text-brand-500" />;
  }

  return (
    <form onSubmit={handleSubmit(onValid)}>
      {/* fieldset disabled tự vô hiệu hoá Input/Select/nút bấm trong ImageUploader khi xem —
          riêng Switch dựng từ <label onClick>, không phải form control gốc nên fieldset
          không tự khoá được, phải truyền disabled riêng (giống VoucherForm.tsx). */}
      <fieldset
        disabled={viewOnly}
        className="m-0 min-w-0 space-y-6 border-0 p-0"
      >
        <ComponentCard title="Thông tin cơ bản">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <Input
                label="Tên danh mục"
                required
                disabled={viewOnly}
                placeholder="Ví dụ: Áo nam"
                {...register("name")}
                error={!!errors.name}
                hint={errors.name?.message}
              />

              <Input
                label="URL"
                disabled={viewOnly}
                placeholder="ao-nam"
                {...register("slug")}
              />

              <Controller
                name="parentId"
                control={control}
                render={({ field }) => (
                  <CategorySelect
                    label="Danh mục cha"
                    allowClear
                    placeholder="Không có (danh mục gốc)"
                    value={field.value}
                    onChange={field.onChange}
                    excludeId={editing?.id}
                    disabled={viewOnly}
                  />
                )}
              />

              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <Switch
                    label="Hiển thị"
                    checked={field.value}
                    onChange={field.onChange}
                    disabled={viewOnly}
                  />
                )}
              />
            </div>

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
                    readOnly={viewOnly}
                    onPublicIdChange={(_url, publicId) =>
                      setImagePublicId(publicId)
                    }
                  />
                )}
              />
            </div>

            <div>
              <FieldLabel label="Ảnh nền banner" />
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                Khuyến nghị ảnh có độ dài khoảng (khoảng 1200×180).
              </p>
              <Controller
                name="bannerImage"
                control={control}
                render={({ field }) => (
                  <ImageUploader
                    value={field.value}
                    onChange={field.onChange}
                    max={1}
                    readOnly={viewOnly}
                    onPublicIdChange={(_url, publicId) =>
                      setBannerImagePublicId(publicId)
                    }
                  />
                )}
              />
            </div>
          </div>
        </ComponentCard>

        <ComponentCard
          title="Mega menu"
          desc='2 checkbox áp dụng cho danh mục cấp 2/3, 2 ảnh "look" chỉ áp dụng cho danh mục gốc (không có danh mục cha).'
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Controller
              name="showInNewArrivals"
              control={control}
              render={({ field }) => (
                <Switch
                  label='Hiện ở mục "Hàng mới về"'
                  checked={field.value}
                  onChange={field.onChange}
                  disabled={viewOnly}
                />
              )}
            />
            <Controller
              name="showInSaleCorner"
              control={control}
              render={({ field }) => (
                <Switch
                  label='Hiện ở mục "Sale corner"'
                  checked={field.value}
                  onChange={field.onChange}
                  disabled={viewOnly}
                />
              )}
            />
          </div>

          {isRoot ? (
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <FieldLabel label="Ảnh look bên trái" />
                <Controller
                  name="megaMenuLeftImage"
                  control={control}
                  render={({ field }) => (
                    <ImageUploader
                      value={field.value}
                      onChange={field.onChange}
                      max={1}
                      readOnly={viewOnly}
                      onPublicIdChange={(_url, publicId) =>
                        setMegaMenuLeftImagePublicId(publicId)
                      }
                    />
                  )}
                />
              </div>
              <div>
                <FieldLabel label="Ảnh look bên phải" />
                <Controller
                  name="megaMenuRightImage"
                  control={control}
                  render={({ field }) => (
                    <ImageUploader
                      value={field.value}
                      onChange={field.onChange}
                      max={1}
                      readOnly={viewOnly}
                      onPublicIdChange={(_url, publicId) =>
                        setMegaMenuRightImagePublicId(publicId)
                      }
                    />
                  )}
                />
              </div>
            </div>
          ) : null}
        </ComponentCard>
      </fieldset>

      <div className="mt-6 flex justify-end gap-3">
        {viewOnly ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/categories")}
          >
            Quay lại
          </Button>
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/categories")}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!isValid || isSubmitting}
              startIcon={isSubmitting ? <Spinner size="sm" /> : undefined}
            >
              Lưu
            </Button>
          </>
        )}
      </div>
    </form>
  );
}
