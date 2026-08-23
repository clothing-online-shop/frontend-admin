import * as yup from "yup";
import { DiscountType } from "@/types/shared-types";

export const voucherSchema = yup.object({
  code: yup
    .string()
    .trim()
    .required("Vui lòng nhập mã voucher.")
    .min(3, "Mã voucher phải có ít nhất 3 ký tự."),
  // Không bắt buộc — voucher tạo nhanh không phải lúc nào cũng có ảnh sẵn.
  image: yup.array().of(yup.string().required()).default([]),
  discountType: yup
    .mixed<DiscountType>()
    .oneOf(Object.values(DiscountType))
    .required()
    .default(DiscountType.PERCENTAGE),
  discountValue: yup
    .number()
    .transform((value, original) => (original === "" ? undefined : value))
    .typeError("Nhập giá trị giảm.")
    .positive("Giá trị giảm phải lớn hơn 0.")
    .required("Nhập giá trị giảm.")
    .when("discountType", {
      is: DiscountType.PERCENTAGE,
      then: (schema) => schema.max(100, "Giảm theo % phải trong khoảng 0-100."),
    }),
  maxDiscountAmount: yup
    .number()
    .transform((value, original) => (original === "" ? undefined : value))
    .positive("Trần giảm phải lớn hơn 0.")
    .optional(),
  minOrderValue: yup
    .number()
    .transform((value, original) => (original === "" ? 0 : value))
    .min(0, "Giá trị đơn tối thiểu không được âm.")
    .default(0),
  startsAt: yup.string().required("Vui lòng chọn ngày bắt đầu."),
  // Bỏ trống = dùng mãi mãi, không hết hạn.
  expiresAt: yup
    .string()
    .optional()
    .test("after-start", "Ngày hết hạn phải sau ngày bắt đầu.", function (value) {
      const { startsAt } = this.parent as { startsAt?: string };
      return !startsAt || !value || value >= startsAt;
    }),
  usageLimit: yup
    .number()
    .transform((value, original) => (original === "" ? undefined : value))
    .integer("Tổng lượt dùng phải là số nguyên.")
    .positive("Tổng lượt dùng phải lớn hơn 0.")
    .optional(),
  perCustomerLimit: yup
    .number()
    .transform((value, original) => (original === "" ? undefined : value))
    .integer("Lượt dùng/khách phải là số nguyên.")
    .positive("Lượt dùng/khách phải lớn hơn 0.")
    .optional(),
  isActive: yup.boolean().default(true),
});

export type VoucherFormValues = yup.InferType<typeof voucherSchema>;
