import * as yup from "yup";

// 1 schema chung cho cả 3 chế độ (field `mode` bind với SegmentedControl) thay vì 3 form
// riêng — bắt buộc theo field nào dùng .when("mode", ...), đúng quy ước "mọi form dùng
// React Hook Form + Yup" (không validate if/else tay) trong CLAUDE.md.
export const stockMovementSchema = yup.object({
  mode: yup
    .mixed<"IMPORT" | "EXPORT" | "ADJUSTMENT">()
    .oneOf(["IMPORT", "EXPORT", "ADJUSTMENT"])
    .required(),
  quantity: yup
    .number()
    .transform((value, original) => (original === "" ? undefined : value))
    .when("mode", {
      is: (mode: string) => mode === "IMPORT" || mode === "EXPORT",
      then: (schema) =>
        schema
          .typeError("Vui lòng nhập số lượng.")
          .required("Vui lòng nhập số lượng.")
          .integer("Vui lòng nhập số nguyên.")
          .min(1, "Số lượng phải lớn hơn 0."),
      otherwise: (schema) => schema.optional(),
    }),
  actualQuantity: yup
    .number()
    .transform((value, original) => (original === "" ? undefined : value))
    .when("mode", {
      is: "ADJUSTMENT",
      then: (schema) =>
        schema
          .typeError("Vui lòng nhập số tồn thực tế.")
          .required("Vui lòng nhập số tồn thực tế.")
          .integer("Vui lòng nhập số nguyên.")
          .min(0, "Số tồn thực tế không được âm."),
      otherwise: (schema) => schema.optional(),
    }),
  note: yup.string().trim().optional(),
  reason: yup.string().when("mode", {
    is: (mode: string) => mode === "EXPORT" || mode === "ADJUSTMENT",
    then: (schema) => schema.trim().required("Vui lòng nhập lý do."),
    otherwise: (schema) => schema.optional(),
  }),
});

export type StockMovementFormValues = yup.InferType<typeof stockMovementSchema>;
