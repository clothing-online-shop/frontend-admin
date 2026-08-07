import * as yup from "yup";
import { ProductStatus } from "@/types/shared-types";

const productVariantSchema = yup.object({
  id: yup.string().optional(),
  size: yup.string().trim().required("Nhập size."),
  color: yup.string().trim().required("Nhập màu."),
  sku: yup.string().trim().optional(),
  price: yup
    .number()
    .transform((value, original) => (original === "" ? undefined : value))
    .positive("Giá phải lớn hơn 0.")
    .optional(),
  stockQuantity: yup
    .number()
    .transform((value, original) => (original === "" ? 0 : value))
    .integer()
    .min(0)
    .default(0),
});

export const productSchema = yup.object({
  name: yup.string().trim().required("Vui lòng nhập tên sản phẩm."),
  slug: yup.string().trim().required("Vui lòng nhập slug."),
  description: yup.string().required("Vui lòng nhập mô tả sản phẩm."),
  material: yup.string().trim().required("Vui lòng nhập chất liệu."),
  careInstructions: yup.string().trim().optional(),
  categoryId: yup.string().required("Chọn danh mục."),
  brandId: yup.string().optional(),
  basePrice: yup
    .number()
    .transform((value, original) => (original === "" ? undefined : value))
    .typeError("Nhập giá gốc.")
    .positive("Giá gốc phải lớn hơn 0.")
    .required("Nhập giá gốc."),
  salePrice: yup
    .number()
    .transform((value, original) => (original === "" ? undefined : value))
    .positive("Giá khuyến mãi phải lớn hơn 0.")
    .optional()
    .test("less-than-base-price", "Giá khuyến mãi phải nhỏ hơn giá gốc.", function (value) {
      if (value === undefined) return true;
      return value < this.parent.basePrice;
    }),
  status: yup
    .mixed<ProductStatus>()
    .oneOf(Object.values(ProductStatus))
    .required()
    .default(ProductStatus.DRAFT),
  thumbnail: yup
    .array()
    .of(yup.string().required())
    .min(1, "Vui lòng chọn ảnh đại diện sản phẩm.")
    .required(),
  // Cloudinary publicId song song với thumbnail/images — không hiển thị lên UI, chỉ để
  // BE dọn ảnh cũ trên Cloudinary khi thay/xóa ảnh (xem ProductImagesStep).
  thumbnailPublicId: yup.string().optional(),
  images: yup
    .array()
    .of(yup.string().required())
    .min(1, "Vui lòng chọn ít nhất 1 ảnh chi tiết sản phẩm.")
    .required(),
  imagePublicIds: yup.array().of(yup.string().required()).default([]),
  metaTitle: yup.string().trim().optional(),
  metaDescription: yup.string().trim().optional(),
  variants: yup
    .array()
    .of(productVariantSchema)
    .min(1, "Sản phẩm cần ít nhất 1 biến thể.")
    .required()
    .test("no-duplicate-variants", "Biến thể trùng lặp.", function (variants) {
      if (!variants) return true;
      const seen = new Set<string>();
      for (const variant of variants) {
        const key = `${(variant.size ?? "").trim().toLowerCase()}|${(variant.color ?? "").trim().toLowerCase()}`;
        if (seen.has(key)) {
          return this.createError({
            message: `Biến thể trùng lặp: size "${variant.size}" + màu "${variant.color}"`,
          });
        }
        seen.add(key);
      }
      return true;
    }),
});

export type ProductFormValues = yup.InferType<typeof productSchema>;
