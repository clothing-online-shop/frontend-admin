import * as yup from "yup";

const flashSaleItemSchema = yup.object({
  productVariantId: yup.string().required(),
  sku: yup.string().required(),
  size: yup.string().required(),
  color: yup.string().required(),
  productName: yup.string().required(),
  thumbnail: yup.string().nullable().default(null),
  // Giá gốc/tồn kho tại thời điểm chọn — chỉ dùng để hiển thị + validate chéo salePrice/
  // quantityLimit, không phải field gửi lên BE.
  price: yup.number().required(),
  stockQuantity: yup.number().required(),
  salePrice: yup
    .number()
    .transform((value, original) => (original === "" ? undefined : value))
    .typeError("Nhập giá sale.")
    .positive("Giá sale phải lớn hơn 0.")
    .required("Nhập giá sale.")
    .test("less-than-price", "Giá sale phải nhỏ hơn giá gốc.", function (value) {
      const { price } = this.parent as { price?: number };
      return value === undefined || price === undefined || value < price;
    }),
  quantityLimit: yup
    .number()
    .transform((value, original) => (original === "" ? undefined : value))
    .typeError("Nhập số lượng giới hạn.")
    .integer("Số lượng giới hạn phải là số nguyên.")
    .positive("Số lượng giới hạn phải lớn hơn 0.")
    .required("Nhập số lượng giới hạn.")
    .test("le-stock", "Không được vượt quá tồn kho hiện tại.", function (value) {
      const { stockQuantity } = this.parent as { stockQuantity?: number };
      return value === undefined || stockQuantity === undefined || value <= stockQuantity;
    }),
});

export const flashSaleSchema = yup.object({
  name: yup.string().trim().required("Vui lòng nhập tên Flash Sale."),
  startDate: yup.string().required("Vui lòng chọn ngày bắt đầu."),
  endDate: yup
    .string()
    .required("Vui lòng chọn ngày kết thúc.")
    .test("after-start", "Ngày kết thúc phải sau ngày bắt đầu.", function (value) {
      const { startDate } = this.parent as { startDate?: string };
      return !startDate || !value || value >= startDate;
    }),
  items: yup
    .array()
    .of(flashSaleItemSchema)
    .min(1, "Chọn ít nhất 1 sản phẩm tham gia.")
    .default([]),
});

export type FlashSaleItemFormValue = yup.InferType<typeof flashSaleItemSchema>;
export type FlashSaleFormValues = yup.InferType<typeof flashSaleSchema>;
