import * as yup from "yup";

export const brandSchema = yup.object({
  name: yup.string().trim().required("Vui lòng nhập tên thương hiệu."),
  origin: yup.string().trim().optional(),
  description: yup.string().trim().optional(),
  logo: yup.array().of(yup.string().required()).default([]),
});

export type BrandFormValues = yup.InferType<typeof brandSchema>;
